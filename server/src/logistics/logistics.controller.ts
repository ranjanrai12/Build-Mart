import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShipmentStatus } from './entities/shipment.entity';

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('providers')
  async getProviders() {
    return this.logisticsService.getAllProviders();
  }

  @Post('ship')
  async shipOrder(@Body() body: { orderId: string, providerId: string }) {
    return this.logisticsService.assignShipment(body.orderId, body.providerId);
  }

  @Get('track/order/:orderId')
  async trackByOrder(@Param('orderId') orderId: string) {
    return this.logisticsService.getShipmentByOrder(orderId);
  }

  @Get(':shipmentId/history')
  async getShipmentHistory(@Param('shipmentId') shipmentId: string) {
    return this.logisticsService.getShipmentHistory(shipmentId);
  }

  @Patch('track/update')
  async updateTracking(@Body() body: { trackingNumber: string, status: ShipmentStatus, location?: string, message?: string }) {
    return this.logisticsService.updateShipmentStatus(body.trackingNumber, body.status, body.location, body.message);
  }

  @Post(':trackingNumber/simulate')
  async simulate(@Param('trackingNumber') trackingNumber: string) {
    return this.logisticsService.simulateFulfillment(trackingNumber);
  }
}
