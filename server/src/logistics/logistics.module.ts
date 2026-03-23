import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { ShippingProvider } from './entities/shipping-provider.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShippingProvider,
      Shipment,
      ShipmentUpdate,
      Order,
    ]),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
