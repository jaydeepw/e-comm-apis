import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentMethod } from '../entities/payment.entity';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the first product to determine the seller
      const firstProduct = await this.productRepository.findOne({
        where: { id: createOrderDto.orderItems[0].productId },
      });

      if (!firstProduct) {
        throw new NotFoundException(
          `Product with ID ${createOrderDto.orderItems[0].productId} not found`,
        );
      }

      // Create the order
      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        sellerId: firstProduct.sellerId,
        shippingAddress: createOrderDto.shippingAddress,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: 0,
      });

      // Save the order first to get the ID
      const savedOrder = await queryRunner.manager.save(order);
      let totalAmount = 0;

      // Process each order item
      for (const item of createOrderDto.orderItems) {
        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        // Verify all products are from the same seller
        if (product.sellerId !== firstProduct.sellerId) {
          throw new BadRequestException(
            'All products in an order must be from the same seller',
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for product ${product.name}`,
          );
        }

        // Create order item
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: product.price * item.quantity,
        });

        // Update product stock
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // Save order item
        await queryRunner.manager.save(orderItem);
        totalAmount += orderItem.totalPrice;
      }

      // Update order with total amount
      savedOrder.totalAmount = totalAmount;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ['user', 'orderItems'],
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId },
      relations: ['orderItems'],
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    order.paymentStatus = paymentStatus;
    return await this.orderRepository.save(order);
  }

  async initiatePayment(orderId: string): Promise<any> {
    const order = await this.findOne(orderId);

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new Error('Payment has already been initiated for this order');
    }

    return await this.paymentsService.createPaymentIntent({
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: PaymentMethod.CREDIT_CARD, // Default payment method
    });
  }

  async confirmPayment(
    orderId: string,
    paymentIntentId: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    const payment = await this.paymentsService.confirmPayment(paymentIntentId);

    if (payment.status === PaymentStatus.COMPLETED) {
      order.status = OrderStatus.PROCESSING;
      return await this.orderRepository.save(order);
    }

    return order;
  }
}
