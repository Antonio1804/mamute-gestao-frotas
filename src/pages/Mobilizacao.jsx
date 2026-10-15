import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { data, numero } from '../lib/format';
import { TIPO_MOBILIZACAO, rotulo } from '../lib/constants';
import { supabase } from '../lib/supabase';

const FIELDS = [
  { name: 'veiculo_id', label: 'Veículo', type: 'ref', required: true, refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  { name: 'tipo', label: 'Operação', type: 'radio', options: TIPO_MOBILIZACAO, required: true, full: true },
  { name: 'data', label: 'Data', type: 'date', required: true },
  { name: 'km', label: 'Km na operação', type: 'number' },
  { name: 'origem', label: 'Origem' },
  { name: 'destino', label: 'Destino / obra' },
  { name: 'centro_custo', label: 'Centro de custo' },
  { name: 'responsavel', label: 'Responsável' },
  { name: 'motivo', label: 'Motivo' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', full: true },
];

export default function Mobilizacao() {
  return (
    <CrudPage
      title="Mobilização e desmobilização"
      subtitle="Registro de deslocamento de veículos entre obras, contratos ou centros de custo"
      table="mobilizacoes"
      select="*, veiculos(prefixo,placa)"
      orderBy="data"
      formTitle="operação"
      fields={FIELDS}
      defaults={{ tipo: 'mobilizacao', data: new Date().toISOString().slice(0, 10) }}
      searchKeys={[(r) => r.veiculos?.prefixo, 'origem', 'destino', 'centro_custo', 'responsavel']}
      filters={[{ key: 'tipo', label: 'Operação', options: TIPO_MOBILIZACAO }]}
      columns={[
        { key: 'data', label: 'Data', render: (r) => data(r.data) },
        { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculos?.prefixo || '—' },
        { key: 'tipo', label: 'Operação', render: (r) => <Badge tone={r.tipo === 'mobilizacao' ? 'success' : 'warning'}>{rotulo(TIPO_MOBILIZACAO, r.tipo)}</Badge> },
        { key: 'origem', label: 'Origem' },
        { key: 'destino', label: 'Destino' },
        { key: 'km', label: 'Km', render: (r) => numero(r.km) },
        { key: 'centro_custo', label: 'Centro de custo' },
      ]}
      toPayload={(f) => {
        const { veiculos, ...rest } = f;
        return { ...rest, km: rest.km === '' ? null : Number(rest.km) };
      }}
      onSaved={async (row) => {
        // Atualiza a situação do veículo conforme a operação registrada
        const status = row.tipo === 'mobilizacao' ? 'mobilizado' : 'desmobilizado';
        const updates = { status, updated_at: new Date().toISOString() };
        if (row.km) {
          const { data: v } = await supabase.from('veiculos').select('km_atual').eq('id', row.veiculo_id).single();
          if (v && Number(row.km) > (v.km_atual ?? 0)) updates.km_atual = Number(row.km);
        }
        await supabase.from('veiculos').update(updates).eq('id', row.veiculo_id);
      }}
    />
  );
}
