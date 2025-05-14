import { IsNotEmpty, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '../../entities/payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
