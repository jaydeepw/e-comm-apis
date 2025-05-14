import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.ordersService.create(createOrderDto);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return await this.ordersService.findAll();
  }

  @Get('user/:userId')
  async findUserOrders(@Param('userId') userId: string): Promise<Order[]> {
    return await this.ordersService.findUserOrders(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Order> {
    return await this.ordersService.findOne(id);
  }

  @Post(':id/pay')
  async initiatePayment(@Param('id') id: string) {
    return await this.ordersService.initiatePayment(id);
  }

  @Post(':id/confirm-payment')
  async confirmPayment(
    @Param('id') id: string,
    @Query('paymentIntentId') paymentIntentId: string,
  ) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment intent ID is required');
    }
    return await this.ordersService.confirmPayment(id, paymentIntentId);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: OrderStatus,
    @Query('paymentStatus') paymentStatus: PaymentStatus,
  ): Promise<Order> {
    return await this.ordersService.updateStatus(id, status, paymentStatus);
  }
}
