// Monta o snapshot do parecer a partir de veículo, pneu e vistoria
export function snapshotParecer({ veiculo, pneu }) {
  return {
    veiculo_placa: veiculo?.placa ?? null,
    veiculo_marca: veiculo?.marca ?? null,
    veiculo_modelo: veiculo?.modelo ?? null,
    veiculo_ano: veiculo?.ano_modelo ?? null,
    veiculo_segmento: veiculo?.familia ?? null,
    veiculo_km: veiculo?.km_atual ?? null,
    pneu_marca: pneu?.marca ?? null,
    pneu_modelo: pneu?.modelo ?? null,
    pneu_medida: pneu?.medida ?? null,
    pneu_fogo: pneu?.fogo ?? null,
    pneu_dot: pneu?.dot ?? null,
    pneu_status: pneu?.status ?? null,
  };
}

// Textos-padrão sugeridos (o técnico pode editar livremente)
export const ANALISE_PADRAO =
  'Após inspeção visual do pneu, foi constatado {avaria}, compatível com {causa}. Não foram identificados indícios de defeito de fabricação ou falha de manutenção.';

export const CONCLUSAO_PADRAO =
  'Conclui-se que a avaria é compatível com {causa}, conforme recomendações técnicas do fabricante.';
