import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { moeda, decimal, mensagemErro, hoje } from '../lib/format';
import { calcularVencimentos } from '../lib/preventiva';
import { Alert, Card, PageHeader, Stat, Loading } from '../components/ui';

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        const inicioMes = hoje().slice(0, 7) + '-01';
        const [veic, pneus, corr, abertas, planos, regs, abast, pareceres, ven] = await Promise.all([
          supabase.from('veiculos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('pneus').select('id', { count: 'exact', head: true }),
          supabase.from('manutencoes_corretivas').select('id', { count: 'exact', head: true }).in('status', ['aberta', 'em_andamento']),
          supabase.from('manutencoes_corretivas').select('id', { count: 'exact', head: true }).eq('status', 'concluida').gte('data_conclusao', inicioMes),
          supabase.from('planos_preventiva').select('*'),
          supabase.from('manutencoes_preventivas').select('*'),
          supabase.from('abastecimentos').select('litros,valor_total,data').gte('data', inicioMes),
          supabase.from('pareceres_pneu').select('id', { count: 'exact', head: true }).eq('status', 'emitido'),
          supabase.from('veiculos').select('id,prefixo,placa,km_atual').eq('status', 'ativo'),
        ]);
        const erroAny = [veic, pneus, corr, abertas, planos, regs, abast, pareceres, ven].find((r) => r.error)?.error;
        if (erroAny) throw erroAny;
        const linhas = calcularVencimentos({ veiculos: ven.data || [], planos: planos.data || [], registros: regs.data || [] });
        setDados({
          veiculosAtivos: veic.count ?? 0,
          pneus: pneus.count ?? 0,
          corretivasAbertas: corr.count ?? 0,
          corretivasMes: abertas.count ?? 0,
          preventivasVencidas: linhas.filter((l) => l.status === 'vencido').length,
          preventivasSemRegistro: linhas.filter((l) => l.status === 'sem_registro').length,
          pareceres: pareceres.count ?? 0,
          litrosMes: (abast.data || []).reduce((s, r) => s + Number(r.litros || 0), 0),
          custoMes: (abast.data || []).reduce((s, r) => s + Number(r.valor_total || 0), 0),
        });
      } catch (e) {
        setErro(mensagemErro(e));
      }
    })();
  }, []);

  if (!supabase) return <Alert>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar os dados.</Alert>;
  if (erro) return <Alert>{erro}</Alert>;
  if (!dados) return <Loading />;

  return (
    <>
      <PageHeader title="Painel" subtitle="Visão geral da frota" />
      <div className="stats">
        <Link to="/cadastros/veiculos"><Stat label="Veículos ativos" value={dados.veiculosAtivos} /></Link>
        <Link to="/cadastros/pneus"><Stat label="Pneus cadastrados" value={dados.pneus} /></Link>
        <Link to="/manutencao/corretiva"><Stat label="OS corretivas abertas" value={dados.corretivasAbertas} tone={dados.corretivasAbertas ? 'warn' : undefined} /></Link>
        <Link to="/manutencao/preventiva"><Stat label="Preventivas vencidas" value={dados.preventivasVencidas} tone={dados.preventivasVencidas ? 'danger' : undefined} hint={`${dados.preventivasSemRegistro} sem registro`} /></Link>
        <Link to="/combustivel"><Stat label="Combustível no mês" value={moeda(dados.custoMes)} hint={`${decimal(dados.litrosMes, 0)} litros`} /></Link>
        <Link to="/pneus/pareceres"><Stat label="Pareceres emitidos" value={dados.pareceres} /></Link>
      </div>

      <Card title="Atalhos">
        <div className="shortcuts">
          <Link className="btn btn-secondary" to="/pneus/vistorias">Nova vistoria de pneu</Link>
          <Link className="btn btn-secondary" to="/pneus/pareceres/novo">Novo parecer técnico</Link>
          <Link className="btn btn-secondary" to="/manutencao/corretiva">Abrir OS corretiva</Link>
          <Link className="btn btn-secondary" to="/combustivel">Registrar abastecimento</Link>
          <Link className="btn btn-secondary" to="/mobilizacao">Registrar mobilização</Link>
        </div>
      </Card>
    </>
  );
}
