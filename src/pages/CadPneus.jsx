import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { moeda } from '../lib/format';
import { APLICACAO_PNEU, CONSTRUCAO_PNEU, POSICAO_PNEU, STATUS_PNEU, TIPO_PNEU, rotulo } from '../lib/constants';

// Campos conforme planilha MAMUTE_FROTAS ("TELA CADASTRO DO PNEU") + fogo/dot (usados no parecer) + vínculo
const FIELDS = [
  { name: 'marca', label: 'Marca', required: true },
  { name: 'modelo', label: 'Modelo', required: true },
  { name: 'aplicacao', label: 'Aplicação', type: 'select', options: APLICACAO_PNEU },
  { name: 'desenho', label: 'Desenho' },
  { name: 'construcao', label: 'Construção', type: 'select', options: CONSTRUCAO_PNEU },
  { name: 'tipo', label: 'Tipo', type: 'select', options: TIPO_PNEU },
  { name: 'aro', label: 'Aro', placeholder: 'Ex.: 22,5' },
  { name: 'medida', label: 'Medida', required: true, placeholder: 'Ex.: 295/80 R22,5' },
  { name: 'profundidade_sulco', label: 'Profundidade do sulco (mm)', type: 'money' },
  { name: 'lonagem', label: 'Lonagem / camadas', placeholder: 'Ex.: 16 PR' },
  { name: 'indice_carga_simples', label: 'Índice de carga (rodado simples)' },
  { name: 'indice_carga_duplo', label: 'Índice de carga (rodado duplo)' },
  { name: 'fogo', label: 'Nº de fogo', help: 'Número de série gravado no pneu' },
  { name: 'dot', label: 'DOT', help: 'Semana/ano de fabricação (ex.: 1925 = semana 19 de 2025)' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_PNEU, required: true },
  { name: 'fornecedor', label: 'Fornecedor' },
  { name: 'numero_nf', label: 'Número da NF' },
  { name: 'valor_compra', label: 'Valor de compra (R$)', type: 'money' },
  { name: 'veiculo_id', label: 'Veículo atual', type: 'ref', refTable: 'veiculos', refLabel: { key: 'prefixo', fn: (r) => `${r.prefixo} – ${r.placa || 'sem placa'}` } },
  { name: 'posicao', label: 'Posição no veículo', type: 'select', options: POSICAO_PNEU.map((p) => [p, p]) },
];

export default function CadPneus() {
  return (
    <CrudPage
      title="Cadastro de pneus"
      subtitle="Especificações gerais, de compra e de capacidade de carga"
      table="pneus"
      select="*, veiculos(prefixo,placa)"
      orderBy="marca"
      ascending
      wide
      formTitle="pneu"
      fields={FIELDS}
      defaults={{ status: 'novo' }}
      searchKeys={['marca', 'modelo', 'medida', 'fogo', 'dot', (r) => r.veiculos?.prefixo]}
      filters={[{ key: 'status', label: 'Status', options: STATUS_PNEU }]}
      columns={[
        { key: 'marca', label: 'Marca / modelo', render: (r) => <><strong>{r.marca}</strong> {r.modelo}</> },
        { key: 'medida', label: 'Medida' },
        { key: 'fogo', label: 'Fogo' },
        { key: 'profundidade_sulco', label: 'Sulco (mm)' },
        { key: 'veiculo', label: 'Veículo / posição', render: (r) => (r.veiculos ? `${r.veiculos.prefixo} · ${r.posicao || '—'}` : '—') },
        { key: 'valor_compra', label: 'Valor', render: (r) => moeda(r.valor_compra) },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'em_uso' ? 'success' : 'neutral'}>{rotulo(STATUS_PNEU, r.status)}</Badge> },
      ]}
      toPayload={(f) => {
        const { veiculos, ...rest } = f; // remove relação embutida
        return {
          ...rest,
          profundidade_sulco: rest.profundidade_sulco === '' ? null : Number(rest.profundidade_sulco),
          valor_compra: rest.valor_compra === '' ? null : Number(rest.valor_compra),
          updated_at: new Date().toISOString(),
        };
      }}
    />
  );
}
