import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from '../entities/payment.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  @Post('confirm')
  async confirmPayment(
    @Query('paymentIntentId') paymentIntentId: string,
  ): Promise<Payment> {
    return await this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Post(':id/refund')
  async refundPayment(@Param('id') id: string): Promise<Payment> {
    return await this.paymentsService.refundPayment(id);
  }

  @Get()
  async findAll(): Promise<Payment[]> {
    return await this.paymentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Payment> {
    return await this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string): Promise<Payment> {
    return await this.paymentsService.findByOrder(orderId);
  }
}
