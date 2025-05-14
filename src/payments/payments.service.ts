import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Order } from '../entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockStripeService } from './services/mock-stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly stripeService: MockStripeService,
  ) {}

  async createPaymentIntent(
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${createPaymentDto.orderId} not found`,
      );
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Payment for this order has already been completed',
      );
    }

    try {
      // Create a payment intent with mock Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: Math.round(createPaymentDto.amount * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          orderId: order.id,
        },
      });

      // Create payment record in our database
      const payment = this.paymentRepository.create({
        orderId: order.id,
        amount: createPaymentDto.amount,
        paymentMethod: createPaymentDto.paymentMethod,
        status: PaymentStatus.PENDING,
        paymentIntentId: paymentIntent.id,
        paymentDetails: {
          clientSecret: paymentIntent.client_secret,
        },
      });

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentIntentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with intent ID ${paymentIntentId} not found`,
      );
    }

    try {
      const paymentIntent =
        await this.stripeService.retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = paymentIntent.id;

        // Update order payment status
        const order = payment.order;
        order.paymentStatus = PaymentStatus.COMPLETED;
        await this.orderRepository.save(order);
      } else if (paymentIntent.status === 'failed') {
        payment.status = PaymentStatus.FAILED;
        payment.errorMessage =
          paymentIntent.last_payment_error?.message || 'Payment failed';
      }

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    try {
      const refund = await this.stripeService.createRefund({
        payment_intent: payment.paymentIntentId,
      });

      if (refund.status === 'succeeded') {
        payment.status = PaymentStatus.REFUNDED;

        // Update order payment status
        const order = payment.order;
        order.paymentStatus = PaymentStatus.REFUNDED;
        await this.orderRepository.save(order);
      }

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['order'],
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByOrder(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }
}
