import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { data, decimal, numero } from '../lib/format';
import { CONDICAO_VISTORIA, POSICAO_PNEU, rotulo } from '../lib/constants';
import { supabase } from '../lib/supabase';

const FIELDS = [
  { name: 'data', label: 'Data da vistoria', type: 'date', required: true },
  { name: 'veiculo_id', label: 'Veículo', type: 'ref', required: true, refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  {
    name: 'pneu_id', label: 'Pneu', type: 'ref', required: true, refTable: 'pneus',
    refLabel: { key: 'marca', fn: (r) => `${r.marca} ${r.modelo} · ${r.medida}${r.fogo ? ` · fogo ${r.fogo}` : ''}` },
    refFilter: (r, form) => !form.veiculo_id || r.veiculo_id === form.veiculo_id || !r.veiculo_id,
    help: 'Mostra pneus do veículo selecionado e os sem veículo',
  },
  { name: 'posicao', label: 'Posição', type: 'select', options: POSICAO_PNEU.map((p) => [p, p]) },
  { name: 'km', label: 'Km do veículo', type: 'number' },
  { name: 'sulco_mm', label: 'Profundidade do sulco (mm)', type: 'money', help: 'Atualiza o cadastro do pneu' },
  { name: 'condicao', label: 'Condição', type: 'radio', options: CONDICAO_VISTORIA, required: true, full: true },
  { name: 'observacoes', label: 'Observações', type: 'textarea', full: true },
];

export default function PneusVistorias() {
  return (
    <CrudPage
      title="Vistorias de pneus"
      subtitle="Inspeções periódicas. Quando houver avaria, emita o parecer técnico."
      table="vistorias_pneu"
      select="*, veiculos(prefixo,placa), pneus(marca,modelo,medida,fogo)"
      orderBy="data"
      formTitle="vistoria"
      fields={FIELDS}
      defaults={{ data: new Date().toISOString().slice(0, 10), condicao: 'boa' }}
      searchKeys={[(r) => r.veiculos?.prefixo, (r) => r.pneus?.marca, (r) => r.pneus?.fogo, 'observacoes']}
      filters={[{ key: 'condicao', label: 'Condição', options: CONDICAO_VISTORIA }]}
      columns={[
        { key: 'data', label: 'Data', render: (r) => data(r.data) },
        { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculos?.prefixo || '—' },
        { key: 'pneu', label: 'Pneu', render: (r) => (r.pneus ? `${r.pneus.marca} ${r.pneus.medida} · fogo ${r.pneus.fogo || '—'}` : '—') },
        { key: 'posicao', label: 'Posição' },
        { key: 'sulco_mm', label: 'Sulco (mm)', render: (r) => decimal(r.sulco_mm) },
        { key: 'condicao', label: 'Condição', render: (r) => <Badge tone={r.condicao === 'boa' ? 'success' : r.condicao === 'atencao' ? 'warning' : 'danger'}>{rotulo(CONDICAO_VISTORIA, r.condicao)}</Badge> },
      ]}
      toPayload={(f) => {
        const { veiculos, pneus, ...rest } = f;
        return {
          ...rest,
          km: rest.km === '' ? null : Number(rest.km),
          sulco_mm: rest.sulco_mm === '' ? null : Number(rest.sulco_mm),
        };
      }}
      onSaved={async (row) => {
        // Mantém o cadastro do pneu e o odômetro do veículo atualizados
        if (row.sulco_mm !== null && row.sulco_mm !== '' && row.pneu_id) {
          await supabase.from('pneus').update({ profundidade_sulco: Number(row.sulco_mm) }).eq('id', row.pneu_id);
        }
        if (row.km && row.veiculo_id) {
          const { data: v } = await supabase.from('veiculos').select('km_atual').eq('id', row.veiculo_id).single();
          if (v && Number(row.km) > (v.km_atual ?? 0)) {
            await supabase.from('veiculos').update({ km_atual: Number(row.km) }).eq('id', row.veiculo_id);
          }
        }
      }}
    />
  );
}
