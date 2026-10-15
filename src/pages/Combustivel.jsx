import CrudPage from '../components/CrudPage';
import { data, decimal, moeda, numero } from '../lib/format';
import { TIPO_COMBUSTIVEL, rotulo } from '../lib/constants';
import { supabase } from '../lib/supabase';

const FIELDS = [
  { name: 'veiculo_id', label: 'Veículo', type: 'ref', required: true, refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  { name: 'data', label: 'Data', type: 'date', required: true },
  { name: 'km', label: 'Km no abastecimento', type: 'number', required: true },
  { name: 'tipo_combustivel', label: 'Combustível', type: 'select', options: TIPO_COMBUSTIVEL },
  { name: 'litros', label: 'Litros', type: 'number', step: '0.01', required: true },
  { name: 'valor_litro', label: 'Valor do litro (R$)', type: 'money', required: true },
  { name: 'posto', label: 'Posto' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', full: true },
];

// Calcula consumo (km/l) comparando com o abastecimento anterior do mesmo veículo
function comConsumo(rows) {
  const ordenado = [...rows].sort((a, b) => (a.veiculo_id === b.veiculo_id ? Number(a.km) - Number(b.km) : 0));
  const anterior = {};
  const consumo = {};
  for (const r of ordenado) {
    const ant = anterior[r.veiculo_id];
    if (ant && Number(r.km) > Number(ant.km) && Number(r.litros) > 0) {
      consumo[r.id] = (Number(r.km) - Number(ant.km)) / Number(r.litros);
    }
    anterior[r.veiculo_id] = r;
  }
  return rows.map((r) => ({ ...r, _consumo: consumo[r.id] ?? null }));
}

export default function Combustivel() {
  return (
    <CrudPage
      title="Controle de combustível"
      subtitle="Abastecimentos e consumo médio (km/l) por veículo"
      table="abastecimentos"
      select="*, veiculos(prefixo,placa)"
      orderBy="data"
      formTitle="abastecimento"
      fields={FIELDS}
      enrich={comConsumo}
      defaults={{ data: new Date().toISOString().slice(0, 10), tipo_combustivel: 'diesel_s10' }}
      searchKeys={[(r) => r.veiculos?.prefixo, 'posto']}
      filters={[{ key: 'tipo_combustivel', label: 'Combustível', options: TIPO_COMBUSTIVEL }]}
      columns={[
        { key: 'data', label: 'Data', render: (r) => data(r.data) },
        { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculos?.prefixo || '—' },
        { key: 'km', label: 'Km', render: (r) => numero(r.km) },
        { key: 'tipo_combustivel', label: 'Combustível', render: (r) => rotulo(TIPO_COMBUSTIVEL, r.tipo_combustivel) },
        { key: 'litros', label: 'Litros', render: (r) => decimal(r.litros) },
        { key: 'valor_litro', label: 'R$/L', render: (r) => moeda(r.valor_litro) },
        { key: 'valor_total', label: 'Total', render: (r) => moeda(r.valor_total) },
        { key: 'consumo', label: 'km/L', render: (r) => (r._consumo ? decimal(r._consumo) : '—') },
      ]}
      toPayload={(f) => {
        const { veiculos, _consumo, ...rest } = f;
        return {
          ...rest,
          km: Number(rest.km),
          litros: Number(rest.litros),
          valor_litro: Number(rest.valor_litro),
        };
      }}
      onSaved={async (row) => {
        const { data: v } = await supabase.from('veiculos').select('km_atual').eq('id', row.veiculo_id).single();
        if (v && Number(row.km) > (v.km_atual ?? 0)) await supabase.from('veiculos').update({ km_atual: Number(row.km) }).eq('id', row.veiculo_id);
      }}
    />
  );
}
