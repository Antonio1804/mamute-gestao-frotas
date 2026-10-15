import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { data, moeda } from '../lib/format';
import { STATUS_CORRETIVA, rotulo } from '../lib/constants';
import { supabase } from '../lib/supabase';

const FIELDS = [
  { name: 'veiculo_id', label: 'Veículo', type: 'ref', required: true, refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  { name: 'data_abertura', label: 'Data de abertura', type: 'date', required: true },
  { name: 'km', label: 'Km na abertura', type: 'number' },
  { name: 'sistema', label: 'Sistema / componente', placeholder: 'Ex.: Freios, motor, elétrica' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_CORRETIVA, required: true },
  { name: 'descricao_defeito', label: 'Defeito relatado', type: 'textarea', required: true, full: true },
  { name: 'oficina', label: 'Oficina / responsável' },
  { name: 'data_inicio', label: 'Início do serviço', type: 'date' },
  { name: 'data_conclusao', label: 'Conclusão', type: 'date' },
  { name: 'custo_pecas', label: 'Custo de peças (R$)', type: 'money' },
  { name: 'custo_servicos', label: 'Custo de serviços (R$)', type: 'money' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', full: true },
];

export default function ManutCorretiva() {
  return (
    <CrudPage
      title="Manutenção corretiva"
      subtitle="Ordens de serviço abertas para correção de falhas"
      table="manutencoes_corretivas"
      select="*, veiculos(prefixo,placa)"
      orderBy="numero"
      formTitle="ordem de serviço"
      fields={FIELDS}
      defaults={{ status: 'aberta', custo_pecas: 0, custo_servicos: 0, data_abertura: new Date().toISOString().slice(0, 10) }}
      searchKeys={[(r) => r.veiculos?.prefixo, (r) => String(r.numero), 'descricao_defeito', 'oficina', 'sistema']}
      filters={[{ key: 'status', label: 'Status', options: STATUS_CORRETIVA }]}
      columns={[
        { key: 'numero', label: 'OS', render: (r) => <strong>{String(r.numero).padStart(5, '0')}</strong> },
        { key: 'data_abertura', label: 'Abertura', render: (r) => data(r.data_abertura) },
        { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculos?.prefixo || '—' },
        { key: 'descricao_defeito', label: 'Defeito', render: (r) => <span className="clamp">{r.descricao_defeito}</span> },
        { key: 'total', label: 'Custo total', render: (r) => moeda(Number(r.custo_pecas || 0) + Number(r.custo_servicos || 0)) },
        {
          key: 'status', label: 'Status',
          render: (r) => <Badge tone={r.status === 'concluida' ? 'success' : r.status === 'cancelada' ? 'neutral' : r.status === 'aberta' ? 'danger' : 'warning'}>{rotulo(STATUS_CORRETIVA, r.status)}</Badge>,
        },
      ]}
      toPayload={(f) => {
        const { veiculos, ...rest } = f;
        return {
          ...rest,
          km: rest.km === '' ? null : Number(rest.km),
          custo_pecas: Number(rest.custo_pecas || 0),
          custo_servicos: Number(rest.custo_servicos || 0),
        };
      }}
      onSaved={async (row) => {
        if (row.km && row.veiculo_id) {
          const { data: v } = await supabase.from('veiculos').select('km_atual').eq('id', row.veiculo_id).single();
          if (v && Number(row.km) > (v.km_atual ?? 0)) await supabase.from('veiculos').update({ km_atual: Number(row.km) }).eq('id', row.veiculo_id);
        }
      }}
    />
  );
}
