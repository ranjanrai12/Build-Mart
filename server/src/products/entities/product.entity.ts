import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  categoryId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column()
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  inStock: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column({ type: 'simple-json', nullable: true })
  pricingTiers: { minQty: number; price: number }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
