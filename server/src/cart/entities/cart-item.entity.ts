import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  name: string;

  @Column({ type: 'float' })
  price: number;

  @Column()
  unit: string;

  @Column()
  sellerId: string;

  @Column({ nullable: true })
  sellerName: string;

  @Column({ default: 1 })
  quantity: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
