import { hoje, somaDias } from './format';

// Calcula o status de cada par (veículo × plano) a partir do último registro realizado.
// Vence por km (km_atual do veículo) ou por data, o que ocorrer primeiro.
export function calcularVencimentos({ veiculos, planos, registros }) {
  const hojeISO = hoje();
  const linhas = [];
  for (const v of veiculos) {
    for (const p of planos) {
      const ultimos = registros
        .filter((r) => r.veiculo_id === v.id && r.plano_id === p.id)
        .sort((a, b) => String(b.data_realizada).localeCompare(String(a.data_realizada)));
      const ult = ultimos[0];
      const linha = { veiculo: v, plano: p, ultimo: ult, proximoKm: null, faltaKm: null, proximaData: null, faltaDias: null, status: 'pendente' };

      if (!ult) {
        linha.status = 'sem_registro';
      } else {
        if (p.intervalo_km) {
          linha.proximoKm = (ult.km_realizado ?? 0) + p.intervalo_km;
          linha.faltaKm = linha.proximoKm - (v.km_atual ?? 0);
        }
        if (p.intervalo_dias) {
          linha.proximaData = somaDias(String(ult.data_realizada).slice(0, 10), p.intervalo_dias);
          linha.faltaDias = Math.round((Date.parse(linha.proximaData) - Date.parse(hojeISO)) / 86400000);
        }
        const vencido = (linha.faltaKm !== null && linha.faltaKm <= 0) || (linha.faltaDias !== null && linha.faltaDias <= 0);
        const aVencer =
          (linha.faltaKm !== null && linha.faltaKm <= Math.max(500, p.intervalo_km * 0.1)) ||
          (linha.faltaDias !== null && linha.faltaDias <= 15);
        linha.status = vencido ? 'vencido' : aVencer ? 'a_vencer' : 'em_dia';
      }
      linhas.push(linha);
    }
  }
  const ordem = { vencido: 0, sem_registro: 1, a_vencer: 2, em_dia: 3 };
  return linhas.sort((a, b) => ordem[a.status] - ordem[b.status]);
}
