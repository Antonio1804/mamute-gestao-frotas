// Lista de pareceres técnicos (emitidos e rascunhos)
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { data, mensagemErro } from '../lib/format';
import { PARECER_FINAL, STATUS_PARECER, rotulo } from '../lib/constants';
import { Alert, Badge, Button, Card, Confirm, Empty, Loading, PageHeader } from '../components/ui';

export default function PneusPareceres() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data: d, error: err } = await supabase
      .from('pareceres_pneu')
      .select('*')
      .order('numero', { ascending: false });
    if (err) setError(mensagemErro(err));
    setRows(d || []);
    setLoading(false);
  };
  useEffect(() => { if (supabase) load(); }, []);

  const visiveis = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return rows.filter((r) => (!status || r.status === status) &&
      (!t || [r.numero, r.veiculo_placa, r.pneu_marca, r.pneu_modelo, r.pneu_fogo, r.tipo_avaria]
        .some((v) => String(v ?? '').toLowerCase().includes(t))));
  }, [rows, busca, status]);

  const excluir = async () => {
    const { error: err } = await supabase.from('pareceres_pneu').delete().eq('id', toDelete.id);
    setToDelete(null);
    if (err) setError(mensagemErro(err)); else load();
  };

  return (
    <>
      <PageHeader
        title="Pareceres técnicos de pneus"
        subtitle="Análise de avarias no padrão PARECER TÉCNICO DE ANÁLISE DE PNEUS"
        actions={<Button onClick={() => navigate('/pneus/pareceres/novo')}>+ Novo parecer</Button>}
      />
      <Alert>{error}</Alert>
      <Card>
        <div className="toolbar">
          <input className="input search" type="search" placeholder="Pesquisar por nº, placa, marca, fogo…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar pareceres" />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Status: todos</option>
            {STATUS_PARECER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {loading ? <Loading /> : visiveis.length === 0 ? <Empty>Nenhum parecer. Use “Novo parecer” para iniciar.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Nº</th><th>Data</th><th>Veículo</th><th>Pneu</th><th>Tipo de avaria</th><th>Parecer final</th><th>Status</th><th className="actions-col">Ações</th></tr>
              </thead>
              <tbody>
                {visiveis.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Nº"><strong>{String(r.numero).padStart(6, '0')}</strong></td>
                    <td data-label="Data">{data(r.data)}</td>
                    <td data-label="Veículo">{r.veiculo_placa || '—'} <span className="muted">{r.veiculo_modelo}</span></td>
                    <td data-label="Pneu">{r.pneu_marca} {r.pneu_modelo} <span className="muted">{r.pneu_medida}</span></td>
                    <td data-label="Tipo de avaria">{r.tipo_avaria || '—'}</td>
                    <td data-label="Parecer final">{rotulo(PARECER_FINAL, r.parecer_final)}</td>
                    <td data-label="Status"><Badge tone={r.status === 'emitido' ? 'success' : 'warning'}>{rotulo(STATUS_PARECER, r.status)}</Badge></td>
                    <td className="actions-col" data-label="Ações">
                      <Link className="btn btn-ghost btn-sm" to={`/pneus/pareceres/${r.id}`}>Visualizar / imprimir</Link>
                      <Link className="btn btn-ghost btn-sm" to={`/pneus/pareceres/${r.id}/editar`}>Editar</Link>
                      <Button variant="ghost" small className="text-danger" onClick={() => setToDelete(r)}>Excluir</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Confirm open={!!toDelete} message="Excluir este parecer técnico? As fotos anexadas também devem ser removidas do armazenamento." onCancel={() => setToDelete(null)} onConfirm={excluir} />
    </>
  );
}
