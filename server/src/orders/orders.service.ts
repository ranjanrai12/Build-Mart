import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  async createOrders(buyerId: string, orderData: any) {
    const { items, address, paymentMethod, deliveryFee } = orderData;
    const buyer = await this.userRepo.findOne({ where: { id: buyerId } });
    
    if (!buyer) {
      console.error(`[OrdersService] Create failed: Buyer with ID ${buyerId} not found in DB.`);
      throw new NotFoundException(`Buyer not found. Please log in again.`);
    }

    // Group items by seller
    const itemsBySeller = items.reduce((acc, item) => {
      const sId = item.sellerId;
      if (!acc[sId]) acc[sId] = [];
      acc[sId].push(item);
      return acc;
    }, {});

    const sellerIds = Object.keys(itemsBySeller);
    const resultOrders: Order[] = [];

    for (const [index, sId] of sellerIds.entries()) {
      const seller = await this.userRepo.findOne({ where: { id: sId } });
      const sellerItems = itemsBySeller[sId];
      
      const subtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const splitDeliveryFee = index === 0 ? deliveryFee : 0; // Only charge delivery fee once

      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const order = this.orderRepo.create({
        buyer: buyer,
        buyerId: buyer.id,
        seller: seller as User,
        sellerId: sId,
        orderNumber,
        address,
        paymentMethod,
        subtotal,
        deliveryFee: splitDeliveryFee,
        total: subtotal + splitDeliveryFee,
        status: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
      });

      const savedOrder = await this.orderRepo.save(order);

      for (const item of sellerItems) {
        const product = await this.productRepo.findOne({ where: { id: item.productId } });
        if (product) {
          const orderItem = this.orderItemRepo.create({
            order: savedOrder,
            product: product,
            quantity: item.quantity,
            price: item.price,
          });
          await this.orderItemRepo.save(orderItem);
        }
      }
      
      resultOrders.push(savedOrder);
    }

    // Reload all created orders with full relations
    const finalOrders = await Promise.all(
      resultOrders.map(o => this.orderRepo.findOne({
        where: { id: o.id },
        relations: ['items', 'items.product', 'seller']
      }))
    );

    return finalOrders;
  }

  async verifyPayment(orderId: string, paymentData: { transactionId: string, details: any }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // In a real scenario, we'd verify the transactionId with Razorpay/Stripe API here
    order.paymentStatus = PaymentStatus.COMPLETED;
    order.transactionId = paymentData.transactionId;
    order.paymentDetails = paymentData.details;
    
    // If payment is completed, auto-confirm the order
    order.status = OrderStatus.CONFIRMED;

    await this.orderRepo.save(order);

    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'buyer', 'seller'],
    });
  }

  async getBuyerOrders(buyerId: string) {
    return this.orderRepo.find({
      where: { buyer: { id: buyerId } },
      relations: ['items', 'items.product', 'seller'],
      order: { placedAt: 'DESC' },
    });
  }

  async getSellerOrders(sellerId: string) {
    return this.orderRepo.find({
      where: { seller: { id: sellerId } },
      relations: ['items', 'items.product', 'buyer'],
      order: { placedAt: 'DESC' },
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    await this.orderRepo.save(order);
    
    // Reload with full relations to prevent frontend data loss
    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'buyer', 'seller'],
    });
  }

  async getOrderDetails(orderId: string) {
    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'seller', 'buyer'],
    });
  }

  async getSellerRevenueMetrics(sellerId: string) {
    const now = new Date();
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const orders = await this.orderRepo.find({
      where: {
        sellerId,
        placedAt: { $gte: last14Days } as any, // TypeORM might need different syntax for SQLite/Postgres
      },
      order: { placedAt: 'ASC' },
    });

    // Actually, for SQLite in dev, it's easier to just fetch and filter/group in memory if the volume is low
    // or use a more robust TypeORM query. Let's use a simpler approach for the seeder/mock DB.
    
    const allSellerOrders = await this.orderRepo.find({
      where: { sellerId },
      order: { placedAt: 'ASC' },
    });

    const currentWeekOrders = allSellerOrders.filter(o => {
      const d = new Date(o.placedAt);
      return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && o.status !== OrderStatus.REJECTED;
    });

    const prevWeekOrders = allSellerOrders.filter(o => {
      const d = new Date(o.placedAt);
      const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= start && d < end && o.status !== OrderStatus.REJECTED;
    });

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const chartData: { day: string, value: number, trend: string, change: string }[] = [];
    
    // Last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const prevD = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const dateStr = d.toDateString();
      const prevDateStr = prevD.toDateString();
      const dayName = days[d.getDay()];
      
      const dayRev = currentWeekOrders
        .filter(o => new Date(o.placedAt).toDateString() === dateStr)
        .reduce((sum, o) => sum + o.total, 0);

      const prevDayRev = prevWeekOrders
        .filter(o => new Date(o.placedAt).toDateString() === prevDateStr)
        .reduce((sum, o) => sum + o.total, 0);
        
      let dayTrend = 'flat';
      if (dayRev > prevDayRev) dayTrend = 'up';
      else if (dayRev < prevDayRev) dayTrend = 'down';

      chartData.push({ 
        day: dayName, 
        value: dayRev, 
        trend: dayTrend,
        change: prevDayRev > 0 ? ((dayRev - prevDayRev) / prevDayRev * 100).toFixed(0) : '0'
      });
    }

    // Product Trends
    const productStats = {};
    currentWeekOrders.forEach(o => {
      o.items?.forEach(item => {
        const name = item.product?.name || 'Unknown';
        if (!productStats[name]) productStats[name] = { current: 0, prev: 0 };
        productStats[name].current += item.quantity;
      });
    });
    prevWeekOrders.forEach(o => {
      o.items?.forEach(item => {
        const name = item.product?.name || 'Unknown';
        if (!productStats[name]) productStats[name] = { current: 0, prev: 0 };
        productStats[name].prev += item.quantity;
      });
    });

    const topSellersWithTrends = Object.entries(productStats)
      .map(([name, stats]: [string, any]) => {
        const growth = stats.prev > 0 ? ((stats.current - stats.prev) / stats.prev * 100) : (stats.current > 0 ? 100 : 0);
        return {
          name,
          qty: stats.current,
          trend: growth >= 0 ? 'up' : 'down',
          growth: growth.toFixed(0)
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const currentTotal = currentWeekOrders.reduce((sum, o) => sum + o.total, 0);
    const prevTotal = prevWeekOrders.reduce((sum, o) => sum + o.total, 0);
    
    let growth = 0;
    if (prevTotal > 0) {
      growth = ((currentTotal - prevTotal) / prevTotal) * 100;
    } else if (currentTotal > 0) {
      growth = 100;
    }

    // Normalize for chart (0-100 scale for UI)
    const maxVal = Math.max(...chartData.map(d => d.value), 1000);
    const normalizedData = chartData.map(d => ({
      ...d,
      displayValue: Math.round((d.value / maxVal) * 100),
      rawPrice: d.value
    }));

    return {
      chartData: normalizedData,
      topSellers: topSellersWithTrends,
      currentTotal,
      prevTotal,
      growth: growth.toFixed(1),
      growthText: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs last week ${growth >= 0 ? '↑' : '↓'}`
    };
  }

  async getSellerAdvancedMetrics(sellerId: string) {
    const orders = await this.orderRepo.find({
      where: { sellerId },
      relations: ['items', 'items.product', 'buyer'],
    });

    const categories = await this.categoryRepo.find();
    const categoryMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});

    // 1. Category Revenue Split
    const catStats = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const catId = item.product?.categoryId || 'unclassified';
        const name = categoryMap[catId] || 'Others';
        if (!catStats[name]) catStats[name] = { revenue: 0, items: 0 };
        catStats[name].revenue += Number(item.price) * item.quantity;
        catStats[name].items += item.quantity;
      });
    });

    const categoryDistribution = Object.entries(catStats).map(([name, data]: [string, any]) => ({
      name,
      revenue: data.revenue,
      quantity: data.items,
    }));

    // 2. Customer Insights
    const customerMap = {};
    orders.forEach(o => {
      const bId = o.buyerId;
      if (!customerMap[bId]) customerMap[bId] = { name: o.buyer?.name || 'Guest User', count: 0, totalValue: 0 };
      customerMap[bId].count += 1;
      customerMap[bId].totalValue += Number(o.total);
    });

    const uniqueCustomers = Object.keys(customerMap).length;
    const repeatBuyers = Object.values(customerMap).filter((c: any) => c.count > 1).length;
    const topCustomers = Object.values(customerMap)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 3);

    // 3. Operational Efficiency
    const completedOrders = orders.filter(o => 
      o.status === OrderStatus.DELIVERED || o.status === OrderStatus.DISPATCHED
    );
    
    let totalProcessingTime = 0;
    completedOrders.forEach(o => {
      const start = new Date(o.placedAt).getTime();
      const end = new Date(o.updatedAt).getTime();
      totalProcessingTime += (end - start);
    });

    const avgProcessingHours = completedOrders.length > 0 
      ? (totalProcessingTime / (1000 * 60 * 60 * completedOrders.length)).toFixed(1)
      : '0';

    const deliverySuccessRate = orders.length > 0
      ? ((orders.filter(o => o.status === OrderStatus.DELIVERED).length / orders.length) * 100).toFixed(0)
      : '0';

    return {
      categoryDistribution: categoryDistribution.sort((a, b) => b.revenue - a.revenue),
      customerInsights: {
        totalUnique: uniqueCustomers,
        repeatRate: uniqueCustomers > 0 ? ((repeatBuyers / uniqueCustomers) * 100).toFixed(1) : '0',
        topCustomers,
      },
      efficiency: {
        avgProcessingHours,
        successRate: deliverySuccessRate,
        totalCompleted: completedOrders.length,
      }
    };
  }
}
