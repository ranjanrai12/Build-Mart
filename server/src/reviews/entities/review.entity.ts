import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: true })
  product: Product;

  @ManyToOne(() => User, { nullable: true })
  seller: User;

  @ManyToOne(() => User)
  buyer: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ default: false })
  verifiedPurchase: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
