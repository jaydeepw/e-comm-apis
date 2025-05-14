import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { SellersModule } from './sellers/sellers.module';
import { PaymentsModule } from './payments/payments.module';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'ecommerce_db',
      entities: [User, Product, Order, OrderItem, Payment],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: true,
      autoLoadEntities: true,
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    SellersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
