import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { ShippingProvider } from './shipping-provider.entity';

export enum ShipmentStatus {
  PICKED_UP = 'Picked Up',
  IN_TRANSIT = 'In Transit',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  DELAYED = 'Delayed',
  CANCELLED = 'Cancelled',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @OneToOne(() => Order)
  @JoinColumn()
  order: Order;

  @Column()
  providerId: string;

  @ManyToOne(() => ShippingProvider)
  provider: ShippingProvider;

  @Column({ unique: true })
  trackingNumber: string;

  @Column({
    type: 'simple-enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PICKED_UP,
  })
  status: ShipmentStatus;

  @Column({ type: 'text', nullable: true })
  currentLocation: string;

  @Column({ type: 'datetime', nullable: true })
  estimatedDelivery: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
