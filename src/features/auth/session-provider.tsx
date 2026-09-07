import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { clearProtectedQueryCache } from '@/lib/query/client';
import { supabase } from '@/lib/supabase/client';

type ProfileBootstrap = {
  id: string;
  locale: string;
  timezone: string | null;
  onboarding_completed_at: string | null;
};

type BootstrapState =
  | { status: 'loading'; session: Session | null; profile: null; error: null }
  | { status: 'signed-out'; session: null; profile: null; error: null }
  | { status: 'onboarding'; session: Session; profile: ProfileBootstrap; error: null }
  | { status: 'ready'; session: Session; profile: ProfileBootstrap; error: null }
  | { status: 'error'; session: Session | null; profile: null; error: string };

type SessionContextValue = BootstrapState & {
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchProfile(userId: string): Promise<ProfileBootstrap> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, locale, timezone, onboarding_completed_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as ProfileBootstrap;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<BootstrapState>({
    status: 'loading',
    session: null,
    profile: null,
    error: null,
  });
  const lastUserIdRef = useRef<string | null>(null);

  const bootstrap = useCallback(async (session: Session | null) => {
    const nextUserId = session?.user.id ?? null;
    if (lastUserIdRef.current !== nextUserId) {
      await clearProtectedQueryCache();
      lastUserIdRef.current = nextUserId;
    }

    if (!session) {
      setState({ status: 'signed-out', session: null, profile: null, error: null });
      return;
    }

    try {
      const profile = await fetchProfile(session.user.id);
      setState({
        status: profile.onboarding_completed_at ? 'ready' : 'onboarding',
        session,
        profile,
        error: null,
      });
    } catch {
      setState({
        status: 'error',
        session,
        profile: null,
        error: 'Profil yüklenemedi. Bağlantını kontrol edip tekrar dene.',
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void bootstrap(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void bootstrap(session);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [bootstrap]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await bootstrap(data.session);
  }, [bootstrap]);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, refreshProfile }),
    [state, refreshProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionBootstrap() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSessionBootstrap must be used inside SessionProvider');
  return value;
}
