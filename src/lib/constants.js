// Listas de opções usadas nos formulários e filtros (rótulos em pt-BR)

export const STATUS_VEICULO = [
  ['ativo', 'Ativo'],
  ['manutencao', 'Em manutenção'],
  ['mobilizado', 'Mobilizado'],
  ['desmobilizado', 'Desmobilizado'],
  ['baixado', 'Baixado'],
];

export const TIPO_COMBUSTIVEL = [
  ['diesel_s10', 'Diesel S10'],
  ['diesel_s500', 'Diesel S500'],
  ['gasolina', 'Gasolina'],
  ['etanol', 'Etanol'],
  ['gnv', 'GNV'],
  ['eletrico', 'Elétrico'],
];

export const UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export const STATUS_PNEU = [
  ['novo', 'Novo'],
  ['em_uso', 'Em uso'],
  ['recapado', 'Recapado'],
  ['sucateado', 'Sucateado'],
  ['baixado', 'Baixado'],
];

export const CONSTRUCAO_PNEU = [['radial', 'Radial'], ['diagonal', 'Diagonal'], ['convencional', 'Convencional']];
export const TIPO_PNEU = [['direcional', 'Direcional'], ['tracao', 'Tração'], ['livre', 'Livre'], ['misto', 'Misto']];
export const APLICACAO_PNEU = [['direcional', 'Direcional'], ['tracao', 'Tração'], ['reboque', 'Reboque'], ['carga_geral', 'Carga geral']];
export const POSICAO_PNEU = ['DE', 'DD', 'TE1', 'TE2', 'TD1', 'TD2', 'ESTEPE', 'ALMOXARIFADO'];

export const CONDICAO_VISTORIA = [['boa', 'Boa'], ['atencao', 'Atenção'], ['critica', 'Crítica']];

// Parecer técnico (conforme modelo MAMUTE_TEMPLETE)
export const PARECER_FINAL = [
  ['garantia_fabricacao', 'Garantia de fabricação'],
  ['dano_acidental', 'Dano acidental'],
  ['necessita_investigacao', 'Necessita investigação'],
  ['falha_operacional', 'Falha operacional'],
  ['desgaste_natural', 'Desgaste natural'],
  ['falha_manutencao', 'Falha de manutenção'],
  ['improcedente', 'Improcedente'],
];

export const DECISAO_PERDA = [['aprovado', 'Aprovado'], ['nao_aprovado', 'Não aprovado'], ['arquivar', 'Arquivar']];

export const STATUS_PARECER = [['rascunho', 'Rascunho'], ['emitido', 'Emitido']];

export const STATUS_CORRETIVA = [
  ['aberta', 'Aberta'],
  ['em_andamento', 'Em andamento'],
  ['concluida', 'Concluída'],
  ['cancelada', 'Cancelada'],
];

export const TIPO_MOBILIZACAO = [['mobilizacao', 'Mobilização'], ['desmobilizacao', 'Desmobilização']];

export const CATEGORIA_PRODUTO = ['Peças', 'Lubrificantes', 'Pneus', 'Filtros', 'Elétrica', 'Outros'];

export const rotulo = (lista, valor) => {
  const item = lista.find((i) => (Array.isArray(i) ? i[0] : i) === valor);
  return item ? (Array.isArray(item) ? item[1] : item) : valor || '—';
};
