import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingProvider } from './entities/shipping-provider.entity';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(ShippingProvider)
    private providerRepo: Repository<ShippingProvider>,
    @InjectRepository(Shipment)
    private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentUpdate)
    private updateRepo: Repository<ShipmentUpdate>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async getAllProviders(): Promise<ShippingProvider[]> {
    const providers = await this.providerRepo.find({ where: { isActive: true } });
    if (providers.length === 0) {
      return this.seedProviders();
    }
    return providers;
  }

  async seedProviders(): Promise<ShippingProvider[]> {
    const defaults = [
      { name: 'BlueDart Express', baseRate: 150, ratePerKm: 12 },
      { name: 'Delhivery Pro', baseRate: 100, ratePerKm: 8 },
      { name: 'BuildMart Logistics (Direct)', baseRate: 0, ratePerKm: 5 },
    ];
    for (const d of defaults) {
      const p = this.providerRepo.create(d);
      await this.providerRepo.save(p);
    }
    return this.providerRepo.find();
  }

  async assignShipment(orderId: string, providerId: string): Promise<Shipment> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const trackingNumber = `BM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + 3);

    const shipment = this.shipmentRepo.create({
      orderId,
      providerId,
      trackingNumber,
      status: ShipmentStatus.PICKED_UP,
      estimatedDelivery: estDate,
      currentLocation: 'Merchant Warehouse',
    });

    const saved = await this.shipmentRepo.save(shipment);

    // Record History
    await this.updateRepo.save({
      shipmentId: saved.id,
      status: ShipmentStatus.PICKED_UP,
      location: 'Merchant Warehouse',
      message: 'Package has been picked up from the merchant warehouse.',
    });

    // Automatically update order status to DISPATCHED
    order.status = OrderStatus.DISPATCHED;
    await this.orderRepo.save(order);

    return saved;
  }

  async getShipmentByOrder(orderId: string): Promise<Shipment | null> {
    const shipment = await this.shipmentRepo.findOne({ 
      where: { orderId },
      relations: ['provider']
    });
    return shipment;
  }

  async getShipmentHistory(shipmentId: string): Promise<ShipmentUpdate[]> {
    return this.updateRepo.find({
      where: { shipmentId },
      order: { timestamp: 'DESC' },
    });
  }

  async updateShipmentStatus(trackingNumber: string, status: ShipmentStatus, location?: string, message?: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({ 
      where: { trackingNumber },
      relations: ['order']
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    shipment.status = status;
    if (location) shipment.currentLocation = location;
    
    // Add history update
    await this.updateRepo.save({
      shipmentId: shipment.id,
      status,
      location: location || shipment.currentLocation,
      message: message || `Shipment status updated to ${status}`,
    });

    if (status === ShipmentStatus.DELIVERED) {
      const order = await this.orderRepo.findOne({ where: { id: shipment.orderId } });
      if (order) {
        order.status = OrderStatus.DELIVERED;
        await this.orderRepo.save(order);
      }
    }

    return this.shipmentRepo.save(shipment);
  }

  async simulateFulfillment(trackingNumber: string): Promise<void> {
    const shipment = await this.shipmentRepo.findOne({ where: { trackingNumber } });
    if (!shipment) return;

    const statuses = [
      { status: ShipmentStatus.IN_TRANSIT, location: 'Regional Hub', message: 'Package arrived at regional sorting facility.' },
      { status: ShipmentStatus.IN_TRANSIT, location: 'City Center', message: 'Package departed for the delivery center.' },
      { status: ShipmentStatus.OUT_FOR_DELIVERY, location: 'Local Hub', message: 'Package is out with the delivery executive.' },
      { status: ShipmentStatus.DELIVERED, location: 'Buyer Location', message: 'Handed over to recipient.' },
    ];

    let currentIdx = statuses.findIndex(s => s.status === shipment.status);
    if (currentIdx === -1) currentIdx = 0;
    else currentIdx++;

    if (currentIdx < statuses.length) {
      const next = statuses[currentIdx];
      await this.updateShipmentStatus(trackingNumber, next.status, next.location, next.message);
    }
  }
}
