import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Order } from '../entities/order.entity';
import { MockStripeService } from './services/mock-stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockStripeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
