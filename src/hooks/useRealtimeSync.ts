import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeClient, type RealtimeEvent } from '@/services/realtime-client';
import { ApiService } from '@/services/api-service';

let sharedClient: RealtimeClient | null = null;
let sharedClientUsers = 0;

export function useRealtimeSync(filters?: {
  fiscalYear?: number;
  month?: number;
  dept?: string;
  category?: string;
}) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  const stableFilters = useMemo(() => filters ?? {}, [filters?.fiscalYear, filters?.month, filters?.dept, filters?.category]);

  useEffect(() => {
    // React StrictMode mounts/unmounts effects twice in dev.
    // Use a shared client with ref-counting to prevent noisy connect-close before open.
    if (!sharedClient) {
      sharedClient = new RealtimeClient({
        onEvent: (evt) => {
          if (evt?.type === 'api_change') {
            ApiService.clearCache();
          }
          setLastEvent(evt);
        },
        onStatus: (s) => setStatus(s),
      });
      sharedClient.connect();
    }

    sharedClientUsers += 1;
    clientRef.current = sharedClient;

    return () => {
      sharedClientUsers -= 1;
      clientRef.current = null;

      if (sharedClientUsers <= 0) {
        sharedClient?.close();
        sharedClient = null;
        sharedClientUsers = 0;
      }
    };
  }, []);

  useEffect(() => {
    clientRef.current?.subscribe(stableFilters);
  }, [stableFilters]);

  return { status, lastEvent };
}

