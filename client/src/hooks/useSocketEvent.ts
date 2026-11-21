import { useEffect, useEffectEvent } from 'react';
import { socket } from '@/services/socket';

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void): void {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    const listener = (payload: T) => onEvent(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}