import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
