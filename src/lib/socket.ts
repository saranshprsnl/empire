import { io, Socket } from 'socket.io-client';

// Simple interface mapping socket channels
interface ServerToClientEvents {
  'member:joined': (member: any) => void;
  'member:churned': (member: any) => void;
  'post:new': (post: any) => void;
  'post:reaction': (data: { postId: string; emoji: string; count: number }) => void;
  'payment:received': (payment: any) => void;
  'ai:insight': (insight: any) => void;
  'task:assigned': (task: any) => void;
  'notification': (notification: any) => void;
}

interface ClientToServerEvents {
  'post:create': (data: any) => void;
  'post:react': (data: { postId: string; emoji: string }) => void;
  'member:typing': (data: { channelId: string }) => void;
  'presence:update': (status: 'online' | 'away' | 'offline') => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Initializes and retrieves the singleton socket client instance.
 * Gracefully logs connection failures without crashing UI components.
 */
export function getSocket(tenantId?: string) {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      autoConnect: false,
      extraHeaders: tenantId ? { 'x-tenant-id': tenantId } : {},
    });

    socket.on('connect', () => {
      console.log('[Realtime Client] Connected to WebSocket channel');
    });

    socket.on('disconnect', () => {
      console.log('[Realtime Client] Disconnected from WebSocket channel');
    });
  }

  return socket;
}
