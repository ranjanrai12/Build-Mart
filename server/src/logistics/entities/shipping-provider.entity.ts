import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shipping_providers')
export class ShippingProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ratePerKm: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  website: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
