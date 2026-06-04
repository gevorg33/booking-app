'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(`${WS_BASE}/events`, { transports: ['websocket', 'polling'] });
  }
  return sharedSocket;
}

/** Subscribe to operational events for a business (appointment.created, availability.updated). */
export function useOperationalEvents(
  businessId: string | undefined,
  onEvent: (type: string, payload: unknown) => void,
) {
  useEffect(() => {
    if (!businessId) return;

    const socket = getSocket();
    const channel = `business:${businessId}`;

    const handler = (msg: { type: string; payload: unknown }) => {
      onEvent(msg.type, msg.payload);
    };

    socket.on(channel, handler);
    return () => {
      socket.off(channel, handler);
    };
  }, [businessId, onEvent]);
}
