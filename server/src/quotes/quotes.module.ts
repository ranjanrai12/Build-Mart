import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuoteRequest } from './entities/quote-request.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';

import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteRequest, Product, User]),
    OrdersModule,
    NotificationsModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
