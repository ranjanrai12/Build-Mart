import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // Hide password by default
  password: string;

  @Column({
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  businessDescription: string;

  @Column({ nullable: true })
  deliveryRange: string;

  @Column({ nullable: true })
  since: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isStoreOpen: boolean;

  @Column({ nullable: true })
  claimedBy: string; // The ID of the Buyer who claimed this business

  @Column({
    type: 'text',
    default: 'Unclaimed',
  })
  claimStatus: 'Unclaimed' | 'Pending' | 'Verified' | 'Rejected';

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  bannerImage: string;

  @Column({ type: 'simple-json', nullable: true })
  operatingHours: { open: string; close: string; days: string[] };

  @Column({ type: 'simple-json', nullable: true })
  coordinates: { lat: number; lng: number };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
