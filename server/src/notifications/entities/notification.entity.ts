import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum NotificationType {
  QUOTE_COUNTER = 'QUOTE_COUNTER',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_DECLINED = 'QUOTE_DECLINED',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string;

  @ManyToOne(() => User)
  recipient: User;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ nullable: true })
  relatedId: string; // Quote ID or Order ID

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
