import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export interface AlianzaProfile {
  id: string;
  email: string;
  nombre_empresa: string;
  logo_url?: string;
  ejecutivo_asignado?: string;
}

export function useAlianzasAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AlianzaProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.email!);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.email!);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(email: string) {
    const { data } = await supabase
      .from('alianza_invitations')
      .select('id, email, nombre_empresa, logo_url, ejecutivo_asignado')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }

  const signOut = () => supabase.auth.signOut();

  return { session, profile, loading, signOut };
}
