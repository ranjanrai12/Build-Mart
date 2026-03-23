import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PLACED = 'Placed',
  CONFIRMED = 'Confirmed',
  PACKED = 'Packed',
  DISPATCHED = 'Dispatched',
  DELIVERED = 'Delivered',
  REJECTED = 'Rejected',
}

export enum PaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  REFUNDED = 'Refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  buyerId: string;

  @ManyToOne(() => User)
  buyer: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => User)
  seller: User;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ unique: true, nullable: true })
  orderNumber: string;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PLACED,
  })
  status: OrderStatus;

  @Column({ type: 'text' })
  address: string;

  @Column({ default: 'Pay on Delivery' })
  paymentMethod: string;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'simple-json', nullable: true })
  paymentDetails: any;

  @CreateDateColumn()
  placedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
