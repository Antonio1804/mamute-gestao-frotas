import { useCallback, useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { Alert, Badge, Card, Loading, PageHeader, Empty } from '../components/ui';
import { data, decimal, moeda, mensagemErro, numero } from '../lib/format';
import { calcularVencimentos } from '../lib/preventiva';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: 'painel', label: 'Painel de vencimentos' },
  { id: 'registros', label: 'Registros' },
  { id: 'planos', label: 'Planos' },
];

const STATUS_LABEL = {
  vencido: ['danger', 'Vencido'],
  sem_registro: ['warning', 'Sem registro'],
  a_vencer: ['warning', 'A vencer'],
  em_dia: ['success', 'Em dia'],
};

function Painel() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [v, p, r] = await Promise.all([
      supabase.from('veiculos').select('id,prefixo,placa,km_atual').eq('status', 'ativo').order('prefixo'),
      supabase.from('planos_preventiva').select('*').order('nome'),
      supabase.from('manutencoes_preventivas').select('*'),
    ]);
    const err = v.error || p.error || r.error;
    if (err) setError(mensagemErro(err));
    setLinhas(calcularVencimentos({ veiculos: v.data || [], planos: p.data || [], registros: r.data || [] }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  return (
    <Card title="Vencimentos por veículo e plano" actions={<span className="muted">Considera o que vencer primeiro (km ou data)</span>}>
      <Alert>{error}</Alert>
      {linhas.length === 0 ? <Empty>Cadastre veículos ativos e planos de preventiva para ver o painel.</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Veículo</th><th>Plano</th><th>Última execução</th><th>Próxima (km)</th><th>Falta (km)</th><th>Próxima (data)</th><th>Falta (dias)</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const [tone, label] = STATUS_LABEL[l.status];
                return (
                  <tr key={`${l.veiculo.id}-${l.plano.id}`}>
                    <td data-label="Veículo"><strong>{l.veiculo.prefixo}</strong> <span className="muted">{l.veiculo.placa}</span></td>
                    <td data-label="Plano">{l.plano.nome}</td>
                    <td data-label="Última execução">{l.ultimo ? `${data(l.ultimo.data_realizada)} · ${numero(l.ultimo.km_realizado)} km` : '—'}</td>
                    <td data-label="Próxima (km)">{l.proximoKm !== null ? numero(l.proximoKm) : '—'}</td>
                    <td data-label="Falta (km)">{l.faltaKm !== null ? numero(l.faltaKm) : '—'}</td>
                    <td data-label="Próxima (data)">{l.proximaData ? data(l.proximaData) : '—'}</td>
                    <td data-label="Falta (dias)">{l.faltaDias !== null ? l.faltaDias : '—'}</td>
                    <td data-label="Situação"><Badge tone={tone}>{label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const PLANO_FIELDS = [
  { name: 'nome', label: 'Nome do plano', required: true, placeholder: 'Ex.: Troca de óleo do motor' },
  { name: 'intervalo_km', label: 'Intervalo (km)', type: 'number', help: 'Informe km, dias ou ambos' },
  { name: 'intervalo_dias', label: 'Intervalo (dias)', type: 'number' },
  { name: 'descricao', label: 'Descrição / itens do serviço', type: 'textarea', full: true },
];

const REG_FIELDS = [
  { name: 'veiculo_id', label: 'Veículo', type: 'ref', required: true, refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  { name: 'plano_id', label: 'Plano', type: 'ref', required: true, refTable: 'planos_preventiva', refLabel: { key: 'nome', fn: (r) => r.nome } },
  { name: 'data_realizada', label: 'Data de realização', type: 'date', required: true },
  { name: 'km_realizado', label: 'Km na realização', type: 'number', required: true },
  { name: 'oficina', label: 'Oficina / responsável' },
  { name: 'custo', label: 'Custo (R$)', type: 'money' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', full: true },
];

export default function ManutPreventiva() {
  const [aba, setAba] = useState('painel');
  return (
    <>
      <PageHeader title="Manutenção preventiva" subtitle="Planos por km ou por tempo, com registro das execuções" />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={aba === t.id} className={`tab ${aba === t.id ? 'active' : ''}`} onClick={() => setAba(t.id)}>{t.label}</button>
        ))}
      </div>

      {aba === 'painel' && <Painel />}

      {aba === 'registros' && (
        <CrudPage
          title="Registros de preventiva"
          table="manutencoes_preventivas"
          select="*, veiculos(prefixo,placa), planos_preventiva(nome,intervalo_km,intervalo_dias)"
          orderBy="data_realizada"
          formTitle="registro"
          fields={REG_FIELDS}
          defaults={{ data_realizada: new Date().toISOString().slice(0, 10), custo: 0 }}
          searchKeys={[(r) => r.veiculos?.prefixo, (r) => r.planos_preventiva?.nome, 'oficina']}
          columns={[
            { key: 'data_realizada', label: 'Data', render: (r) => data(r.data_realizada) },
            { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculos?.prefixo || '—' },
            { key: 'plano', label: 'Plano', render: (r) => r.planos_preventiva?.nome || '—' },
            { key: 'km_realizado', label: 'Km', render: (r) => numero(r.km_realizado) },
            { key: 'proxima_km', label: 'Próxima (km)', render: (r) => numero(r.proxima_km) },
            { key: 'proxima_data', label: 'Próxima (data)', render: (r) => data(r.proxima_data) },
            { key: 'custo', label: 'Custo', render: (r) => moeda(r.custo) },
          ]}
          beforeSave={async (payload) => {
            // Calcula a próxima execução a partir do plano escolhido
            const { data: plano } = await supabase.from('planos_preventiva').select('*').eq('id', payload.plano_id).single();
            const out = { ...payload, km_realizado: payload.km_realizado === '' ? null : Number(payload.km_realizado), custo: Number(payload.custo || 0) };
            if (plano) {
              out.proxima_km = plano.intervalo_km && out.km_realizado != null ? out.km_realizado + plano.intervalo_km : null;
              if (plano.intervalo_dias) {
                const d = new Date(`${payload.data_realizada}T00:00:00Z`);
                d.setUTCDate(d.getUTCDate() + plano.intervalo_dias);
                out.proxima_data = d.toISOString().slice(0, 10);
              } else out.proxima_data = null;
            }
            return out;
          }}
          onSaved={async (row) => {
            if (row.km_realizado && row.veiculo_id) {
              const { data: v } = await supabase.from('veiculos').select('km_atual').eq('id', row.veiculo_id).single();
              if (v && Number(row.km_realizado) > (v.km_atual ?? 0)) await supabase.from('veiculos').update({ km_atual: Number(row.km_realizado) }).eq('id', row.veiculo_id);
            }
          }}
        />
      )}

      {aba === 'planos' && (
        <CrudPage
          title="Planos de preventiva"
          table="planos_preventiva"
          orderBy="nome"
          ascending
          formTitle="plano"
          fields={PLANO_FIELDS}
          searchKeys={['nome', 'descricao']}
          columns={[
            { key: 'nome', label: 'Plano', render: (r) => <strong>{r.nome}</strong> },
            { key: 'intervalo_km', label: 'Intervalo (km)', render: (r) => numero(r.intervalo_km) },
            { key: 'intervalo_dias', label: 'Intervalo (dias)', render: (r) => r.intervalo_dias ?? '—' },
            { key: 'descricao', label: 'Descrição' },
          ]}
          toPayload={(f) => ({
            ...f,
            intervalo_km: f.intervalo_km === '' ? null : Number(f.intervalo_km),
            intervalo_dias: f.intervalo_dias === '' ? null : Number(f.intervalo_dias),
          })}
        />
      )}
    </>
  );
}
