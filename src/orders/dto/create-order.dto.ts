import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  sellerId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];
}
