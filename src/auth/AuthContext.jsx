import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!supabase) { setCarregando(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) { setPerfil(null); return; }
    supabase
      .from('perfis')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPerfil(data));
  }, [session]);

  const sair = () => supabase?.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, perfil, carregando, sair, isAdmin: perfil?.perfil === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
