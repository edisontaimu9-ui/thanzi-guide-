import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getPushPermissionState,
  isPushSubscribed,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush
} from '@/lib/push';

export function usePushNotifications() {
  const { user } = useAuth();
  const [supported] = useState(pushSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    isPushSubscribed().then(setSubscribed);
  }, [supported]);

  const enable = useCallback(async () => {
    if (!user) return;
    setStatus('working');
    setError(null);
    try {
      await subscribeToPush(user.$id);
      setSubscribed(true);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications.');
      setStatus('error');
    }
  }, [user]);

  const disable = useCallback(async () => {
    setStatus('working');
    setError(null);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable notifications.');
      setStatus('error');
    }
  }, []);

  return {
    supported,
    subscribed,
    status,
    error,
    permission: getPushPermissionState,
    enable,
    disable
  };
}
