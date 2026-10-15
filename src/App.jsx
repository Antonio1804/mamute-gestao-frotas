import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadVeiculos from './pages/CadVeiculos';
import CadPneus from './pages/CadPneus';
import CadProdutos from './pages/CadProdutos';
import PneusVistorias from './pages/PneusVistorias';
import PneusPareceres from './pages/PneusPareceres';
import PneusParecerForm from './pages/PneusParecerForm';
import PneusParecerView from './pages/PneusParecerView';
import ManutCorretiva from './pages/ManutCorretiva';
import ManutPreventiva from './pages/ManutPreventiva';
import Mobilizacao from './pages/Mobilizacao';
import Combustivel from './pages/Combustivel';

function Protegido({ children }) {
  const { session, carregando } = useAuth();
  if (carregando) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protegido>
            <Layout />
          </Protegido>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pneus/vistorias" element={<PneusVistorias />} />
        <Route path="pneus/pareceres" element={<PneusPareceres />} />
        <Route path="pneus/pareceres/:id" element={<PneusParecerView />} />
        <Route path="pneus/pareceres/:id/editar" element={<PneusParecerForm />} />
        <Route path="pneus/pareceres/novo" element={<PneusParecerForm />} />
        <Route path="manutencao/corretiva" element={<ManutCorretiva />} />
        <Route path="manutencao/preventiva" element={<ManutPreventiva />} />
        <Route path="mobilizacao" element={<Mobilizacao />} />
        <Route path="combustivel" element={<Combustivel />} />
        <Route path="cadastros/veiculos" element={<CadVeiculos />} />
        <Route path="cadastros/pneus" element={<CadPneus />} />
        <Route path="cadastros/produtos" element={<CadProdutos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
