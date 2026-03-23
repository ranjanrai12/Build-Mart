import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum QuoteStatus {
  PENDING = 'Pending',
  RESPONDED = 'Responded',
  EXPIRED = 'Expired',
  ACCEPTED = 'Accepted',
  DECLINED = 'Declined',
  REJECTED_BY_BUYER = 'Rejected by Buyer',
}

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  buyer: User;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'simple-enum',
    enum: QuoteStatus,
    default: QuoteStatus.PENDING,
  })
  status: QuoteStatus;

  @Column({ type: 'float', nullable: true })
  offeredPrice: number;

  @Column({ type: 'text', nullable: true })
  sellerNotes: string;

  @Column({ type: 'datetime', nullable: true })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;
}
