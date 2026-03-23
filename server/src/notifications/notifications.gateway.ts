import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Simple in-memory map of userId to socketId
  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    // Expect the client to pass their userId in the query string when connecting
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);
      
      // Also join a room specifically for this user
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Method to push an event to a specific user
  sendNotificationToUser(userId: string, eventName: string, data: any) {
    this.server.to(userId).emit(eventName, data);
  }
}
