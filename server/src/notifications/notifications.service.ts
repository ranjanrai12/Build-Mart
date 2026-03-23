import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: {
    recipientId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedId?: string;
  }) {
    const notification = this.notificationRepo.create({
      ...data,
      isRead: false,
    });
    const savedNotification = await this.notificationRepo.save(notification);
    
    // Emit the notification via WebSockets
    this.notificationsGateway.sendNotificationToUser(data.recipientId, 'new_notification', savedNotification);

    return savedNotification;
  }

  async findAllByUser(userId: string) {
    return this.notificationRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string) {
    await this.notificationRepo.update(notificationId, { isRead: true });
    return this.notificationRepo.findOne({ where: { id: notificationId } });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update({ recipientId: userId }, { isRead: true });
    return { success: true };
  }
}
