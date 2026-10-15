import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { data, moeda, numero } from '../lib/format';
import { STATUS_VEICULO, TIPO_COMBUSTIVEL, UF, rotulo } from '../lib/constants';

// Campos conforme planilha MAMUTE_FROTAS ("TELA CADASTRO DO VEÍCULO") + km_atual (premissa)
const FIELDS = [
  { name: 'prefixo', label: 'Prefixo', required: true, uppercase: true, maxLength: 20 },
  { name: 'placa', label: 'Placa', uppercase: true, maxLength: 8, help: 'Formato antigo ou Mercosul' },
  { name: 'nome_bem', label: 'Nome do bem', full: false },
  { name: 'familia', label: 'Família / segmento' },
  { name: 'marca', label: 'Marca' },
  { name: 'modelo', label: 'Modelo' },
  { name: 'ano_fabricacao', label: 'Ano de fabricação', type: 'number', maxLength: 4 },
  { name: 'ano_modelo', label: 'Ano do modelo', type: 'number', maxLength: 4 },
  { name: 'chassi', label: 'Chassi / série', uppercase: true, maxLength: 30 },
  { name: 'numero_motor', label: 'Número do motor' },
  { name: 'cor', label: 'Cor' },
  { name: 'tipo_combustivel', label: 'Tipo de combustível', type: 'select', options: TIPO_COMBUSTIVEL },
  { name: 'centro_custo', label: 'Centro de custo' },
  { name: 'peso_total_bruto', label: 'Peso total bruto (kg)', type: 'money' },
  { name: 'seguro', label: 'Seguro', help: 'Apólice ou seguradora' },
  { name: 'rastreador', label: 'Rastreador' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_VEICULO, required: true },
  { name: 'renavam', label: 'RENAVAM' },
  { name: 'uf_emplacamento', label: 'UF de emplacamento', type: 'select', options: UF.map((u) => [u, u]) },
  { name: 'fornecedor', label: 'Fornecedor', full: false },
  { name: 'valor_compra', label: 'Valor da compra (R$)', type: 'money' },
  { name: 'numero_nf_compra', label: 'Nº da NF de compra' },
  { name: 'km_atual', label: 'Km atual (odômetro)', type: 'number', help: 'Usado nos vencimentos da preventiva e no consumo de combustível' },
];

export default function CadVeiculos() {
  return (
    <CrudPage
      title="Cadastro de veículos"
      subtitle="Dados do bem conforme planilha de frota MAMUTE"
      table="veiculos"
      orderBy="prefixo"
      ascending
      wide
      formTitle="veículo"
      fields={FIELDS}
      defaults={{ status: 'ativo', km_atual: 0 }}
      searchKeys={['prefixo', 'placa', 'modelo', 'marca', 'chassi', 'centro_custo']}
      filters={[{ key: 'status', label: 'Status', options: STATUS_VEICULO }]}
      columns={[
        { key: 'prefixo', label: 'Prefixo', render: (r) => <strong>{r.prefixo}</strong> },
        { key: 'placa', label: 'Placa' },
        { key: 'marca', label: 'Marca / modelo', render: (r) => [r.marca, r.modelo].filter(Boolean).join(' ') || '—' },
        { key: 'familia', label: 'Família' },
        { key: 'km_atual', label: 'Km', render: (r) => numero(r.km_atual) },
        { key: 'centro_custo', label: 'Centro de custo' },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'ativo' ? 'success' : r.status === 'baixado' ? 'danger' : 'warning'}>{rotulo(STATUS_VEICULO, r.status)}</Badge> },
      ]}
      toPayload={(f) => ({
        ...f,
        ano_fabricacao: f.ano_fabricacao === '' ? null : Number(f.ano_fabricacao),
        ano_modelo: f.ano_modelo === '' ? null : Number(f.ano_modelo),
        km_atual: Number(f.km_atual || 0),
        peso_total_bruto: f.peso_total_bruto === '' ? null : Number(f.peso_total_bruto),
        valor_compra: f.valor_compra === '' ? null : Number(f.valor_compra),
        updated_at: new Date().toISOString(),
      })}
    />
  );
}
