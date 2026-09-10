import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase/client';

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function createSessionFromUrl(url: string) {
  const normalized = url.includes('#') ? url.replace('#', '?') : url;
  const { queryParams } = Linking.parse(normalized);

  const accessToken = firstString(queryParams?.access_token);
  const refreshToken = firstString(queryParams?.refresh_token);
  const code = firstString(queryParams?.code);

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
}

export function AuthLinkBridge() {
  const url = Linking.useURL();
  const lastHandledUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url || lastHandledUrl.current === url) return;
    lastHandledUrl.current = url;
    void createSessionFromUrl(url).catch(() => {
      // Intentionally do not log redirect contents; auth callback URLs contain credentials.
    });
  }, [url]);

  return null;
}
