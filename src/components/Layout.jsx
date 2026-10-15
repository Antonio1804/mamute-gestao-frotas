import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logoIcone from '../assets/logo-icone.png';
import logoCompleta from '../assets/logo-completa.png';

const MENU = [
  { to: '/', label: 'Painel', end: true },
  {
    grupo: 'Controle de pneus',
    itens: [
      { to: '/pneus/vistorias', label: 'Vistorias' },
      { to: '/pneus/pareceres', label: 'Pareceres técnicos' },
    ],
  },
  {
    grupo: 'Manutenção',
    itens: [
      { to: '/manutencao/corretiva', label: 'Corretiva' },
      { to: '/manutencao/preventiva', label: 'Preventiva' },
    ],
  },
  { to: '/mobilizacao', label: 'Mobilização / Desmobilização' },
  { to: '/combustivel', label: 'Combustível' },
  {
    grupo: 'Cadastros',
    itens: [
      { to: '/cadastros/veiculos', label: 'Veículos' },
      { to: '/cadastros/pneus', label: 'Pneus' },
      { to: '/cadastros/produtos', label: 'Produtos' },
    ],
  },
];

export default function Layout() {
  const { perfil, sair } = useAuth();
  const [aberto, setAberto] = useState(false);

  const fechar = () => setAberto(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn menu-toggle" onClick={() => setAberto((a) => !a)} aria-label="Abrir menu">
          ☰
        </button>
        <img src={logoIcone} alt="" className="topbar-logo" />
        <span className="topbar-title">MAMUTE</span>
        <div className="topbar-user">
          <span className="muted hide-sm">{perfil?.nome || perfil?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={sair}>Sair</button>
        </div>
      </header>

      <aside className={`sidebar ${aberto ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logoCompleta} alt="MAMUTE – Gestão de Frotas" />
        </div>
        <nav aria-label="Navegação principal">
          {MENU.map((item, idx) =>
            item.grupo ? (
              <div className="nav-group" key={idx}>
                <span className="nav-group-title">{item.grupo}</span>
                {item.itens.map((sub) => (
                  <NavLink key={sub.to} to={sub.to} className="nav-link nav-sub" onClick={fechar}>
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link" onClick={fechar}>
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-foot muted">MAMUTE · versão 1.0</div>
      </aside>

      {aberto && <div className="backdrop" onClick={fechar} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
