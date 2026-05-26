import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('domain.event')
  handleDomainEvent(event: any) {
    if (event.businessId) {
      this.server.emit(`business:${event.businessId}`, {
        type: event.eventType,
        payload: event.payload,
        timestamp: event.createdAt,
      });
    }
    this.server.emit('event', {
      type: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      timestamp: event.createdAt,
    });
  }
}
