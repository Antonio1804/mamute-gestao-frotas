import CrudPage from '../components/CrudPage';
import { Badge } from '../components/ui';
import { decimal, moeda } from '../lib/format';
import { CATEGORIA_PRODUTO } from '../lib/constants';

const FIELDS = [
  { name: 'codigo', label: 'Código', uppercase: true, help: 'Código interno ou do fabricante' },
  { name: 'descricao', label: 'Descrição', required: true, full: true },
  { name: 'categoria', label: 'Categoria', type: 'select', options: CATEGORIA_PRODUTO.map((c) => [c, c]) },
  { name: 'unidade', label: 'Unidade', required: true, placeholder: 'un, L, kg…' },
  { name: 'valor_unitario', label: 'Valor unitário (R$)', type: 'money' },
  { name: 'estoque_atual', label: 'Estoque atual', type: 'number', step: 'any' },
  { name: 'estoque_minimo', label: 'Estoque mínimo', type: 'number', step: 'any' },
  { name: 'fornecedor', label: 'Fornecedor' },
];

export default function CadProdutos() {
  return (
    <CrudPage
      title="Cadastro de produtos"
      subtitle="Peças, lubrificantes e insumos utilizados na manutenção"
      table="produtos"
      orderBy="descricao"
      ascending
      formTitle="produto"
      fields={FIELDS}
      defaults={{ unidade: 'un', estoque_atual: 0, estoque_minimo: 0 }}
      searchKeys={['codigo', 'descricao', 'categoria', 'fornecedor']}
      columns={[
        { key: 'codigo', label: 'Código' },
        { key: 'descricao', label: 'Descrição', render: (r) => <strong>{r.descricao}</strong> },
        { key: 'categoria', label: 'Categoria' },
        { key: 'estoque_atual', label: 'Estoque', render: (r) => `${decimal(r.estoque_atual, 0)} ${r.unidade}` },
        { key: 'valor_unitario', label: 'Valor unit.', render: (r) => moeda(r.valor_unitario) },
        {
          key: 'alerta',
          label: 'Situação',
          render: (r) => (Number(r.estoque_atual) <= Number(r.estoque_minimo)
            ? <Badge tone="danger">Abaixo do mínimo</Badge>
            : <Badge tone="success">OK</Badge>),
        },
      ]}
      toPayload={(f) => ({
        ...f,
        estoque_atual: Number(f.estoque_atual || 0),
        estoque_minimo: Number(f.estoque_minimo || 0),
        valor_unitario: f.valor_unitario === '' ? null : Number(f.valor_unitario),
      })}
    />
  );
}
