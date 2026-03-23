import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('seller/revenue-metrics')
  async getRevenueMetrics(@Request() req: any) {
    return this.ordersService.getSellerRevenueMetrics(req.user.id);
  }

  @Get('seller/advanced-metrics')
  async getAdvancedMetrics(@Request() req: any) {
    return this.ordersService.getSellerAdvancedMetrics(req.user.id);
  }

  @Post()
  create(@Body() orderData: any, @Request() req: any) {
    return this.ordersService.createOrders(req.user.id, orderData);
  }

  @Get('buyer')
  getBuyerOrders(@Request() req: any) {
    return this.ordersService.getBuyerOrders(req.user.id);
  }

  @Get('seller')
  getSellerOrders(@Request() req: any) {
    return this.ordersService.getSellerOrders(req.user.id);
  }

  @Get(':id')
  getOrderDetails(@Param('id') id: string) {
    return this.ordersService.getOrderDetails(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateOrderStatus(id, status);
  }
}
