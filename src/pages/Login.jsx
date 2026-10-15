import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase, configOk } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Alert, Button } from '../components/ui';
import logoCompleta from '../assets/logo-completa.png';
import { mensagemErro } from '../lib/format';

export default function Login() {
  const { session, carregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!carregando && session) return <Navigate to="/" replace />;

  const entrar = async (e) => {
    e.preventDefault();
    setErro('');
    if (!email || !senha) { setErro('Informe e-mail e senha.'); return; }
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) setErro(error.message.includes('Invalid login') ? 'E-mail ou senha inválidos.' : mensagemErro(error));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logoCompleta} alt="MAMUTE – Gestão de Frotas" className="login-logo" />
        <h1 className="sr-only">Entrar no MAMUTE</h1>
        {!configOk && (
          <Alert>Sistema não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja o README).</Alert>
        )}
        <Alert>{erro}</Alert>
        <form onSubmit={entrar} className="login-form" noValidate>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input id="senha" className="input" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <Button type="submit" disabled={enviando || !configOk} className="btn-block">{enviando ? 'Entrando…' : 'Entrar'}</Button>
        </form>
        <p className="muted small-text">Acesso restrito. Contas são criadas pelo administrador do sistema.</p>
      </div>
    </div>
  );
}
