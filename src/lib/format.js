const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUM = new Intl.NumberFormat('pt-BR');
const DEC = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const moeda = (v) => (v === null || v === undefined || v === '' ? '—' : BRL.format(Number(v)));
export const numero = (v) => (v === null || v === undefined || v === '' ? '—' : NUM.format(Number(v)));
export const decimal = (v, casas = 2) =>
  v === null || v === undefined || v === '' || Number.isNaN(Number(v))
    ? '—'
    : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(Number(v));

// Datas vindas do Postgres como 'YYYY-MM-DD' são tratadas como data local (evita deslocamento de fuso)
export function data(v) {
  if (!v) return '—';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export const hoje = () => new Date().toISOString().slice(0, 10);

export function somaDias(isoDate, dias) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

// Converte entrada textual pt-BR ("1.234,56") em número
export function parseNumero(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export function mensagemErro(err) {
  const m = (err && (err.message || err.error_description || err.details)) || 'Erro inesperado.';
  if (/duplicate key|unique/i.test(m)) return 'Já existe um registro com estes dados únicos (ex.: prefixo ou placa).';
  if (/row-level security|permission denied/i.test(m)) return 'Sem permissão para esta operação. Verifique seu acesso.';
  if (/violates check constraint/i.test(m)) return 'Algum valor informado está fora das opções permitidas.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Falha de conexão com o Supabase. Verifique sua internet e a configuração.';
  return m;
}
