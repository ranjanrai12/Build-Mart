import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { SellersModule } from './sellers/sellers.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { QuotesModule } from './quotes/quotes.module';
import { CommonModule } from './common/common.module';
import { AddressesModule } from './addresses/addresses.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './cart/cart.module';
import { LogisticsModule } from './logistics/logistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './auth/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './products/entities/category.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { ShippingProvider } from './logistics/entities/shipping-provider.entity';
import { Shipment } from './logistics/entities/shipment.entity';
import { SeederService } from './common/seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: 'buildmart.db',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development!
      }),
    }),
    TypeOrmModule.forFeature([User, Product, Category, CartItem, ShippingProvider, Shipment]),
    AuthModule, 
    ProductsModule, 
    SellersModule, 
    OrdersModule, 
    ReviewsModule,
    QuotesModule, 
    AddressesModule,
    WishlistModule,
    CartModule,
    LogisticsModule,
    NotificationsModule,
    CommonModule
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}
