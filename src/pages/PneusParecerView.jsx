// Visualização para impressão/PDF, espelhando o layout do modelo MAMUTE_TEMPLETE
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { data, mensagemErro } from '../lib/format';
import { DECISAO_PERDA, PARECER_FINAL, rotulo } from '../lib/constants';
import { Alert, Badge, Button, Loading, PageHeader } from '../components/ui';
import logoIcone from '../assets/logo-icone.png';
import { FOTOS } from './PneusParecerForm';

const Campo = ({ label, value }) => (
  <div className="doc-campo"><span>{label}</span><strong>{value || '—'}</strong></div>
);

export default function PneusParecerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [urls, setUrls] = useState({});
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: row, error } = await supabase.from('pareceres_pneu').select('*').eq('id', id).single();
      if (error) setErro(mensagemErro(error));
      setP(row || null);
      if (row?.fotos) {
        const u = {};
        for (const [k, path] of Object.entries(row.fotos)) {
          if (!path) continue;
          const { data: s } = await supabase.storage.from('vistorias').createSignedUrl(path, 3600);
          if (s) u[k] = s.signedUrl;
        }
        setUrls(u);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!p) return <Alert>{erro || 'Parecer não encontrado.'}</Alert>;

  const numeroFmt = String(p.numero).padStart(6, '0');
  const marcado = (ativo) => (ativo ? '☒' : '☐');

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={`Parecer Nº ${numeroFmt}`}
          subtitle={<><Badge tone={p.status === 'emitido' ? 'success' : 'warning'}>{p.status === 'emitido' ? 'Emitido' : 'Rascunho'}</Badge></>}
          actions={
            <>
              <Button variant="ghost" onClick={() => navigate('/pneus/pareceres')}>Voltar</Button>
              <Link className="btn btn-ghost" to={`/pneus/pareceres/${id}/editar`}>Editar</Link>
              <Button onClick={() => window.print()}>Imprimir / salvar PDF</Button>
            </>
          }
        />
        {p.status !== 'emitido' && <Alert type="warning">Este parecer é um rascunho. Emita-o após concluir a análise.</Alert>}
      </div>

      <article className="doc">
        <header className="doc-head">
          <img src={logoIcone} alt="MAMUTE" className="doc-logo" />
          <div>
            <h1>PARECER TÉCNICO DE ANÁLISE DE PNEUS</h1>
          </div>
          <div className="doc-meta">
            <div><span>DATA</span><strong>{data(p.data)}</strong></div>
            <div><span>Nº</span><strong>{numeroFmt}</strong></div>
          </div>
        </header>

        <section className="doc-section">
          <h2>DADOS DO VEÍCULO</h2>
          <div className="doc-grid-3">
            <Campo label="Modelo" value={p.veiculo_modelo} />
            <Campo label="Placa" value={p.veiculo_placa} />
            <Campo label="Marca" value={p.veiculo_marca} />
            <Campo label="KM" value={p.veiculo_km != null ? Number(p.veiculo_km).toLocaleString('pt-BR') : '—'} />
            <Campo label="Ano" value={p.veiculo_ano} />
            <Campo label="Segmento" value={p.veiculo_segmento} />
          </div>
        </section>

        <section className="doc-section">
          <h2>FOTOGRAFIAS</h2>
          <div className="doc-photos">
            {FOTOS.map((f) => (
              <figure key={f.key}>
                {urls[f.key] ? <img src={urls[f.key]} alt={f.titulo} /> : <div className="photo-empty">Sem imagem</div>}
                <figcaption>{f.titulo}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="doc-section">
          <h2>DADOS DO PNEU</h2>
          <div className="doc-grid-3">
            <Campo label="Marca" value={p.pneu_marca} />
            <Campo label="Modelo" value={p.pneu_modelo} />
            <Campo label="Medida" value={p.pneu_medida} />
            <Campo label="Fogo" value={p.pneu_fogo} />
            <Campo label="DOT" value={p.pneu_dot} />
            <Campo label="Status" value={p.pneu_status} />
          </div>
        </section>

        <section className="doc-section">
          <h2>DADOS DA AVARIA</h2>
          <div className="doc-grid-2">
            <Campo label="Tipo de avaria" value={p.tipo_avaria} />
            <Campo label="Área do pneu" value={p.area_pneu} />
            <Campo label="Provável causa" value={p.provavel_causa} />
            <Campo label="Fonte técnica" value={p.fonte_tecnica} />
          </div>
        </section>

        <section className="doc-section">
          <h2>ANÁLISE TÉCNICA</h2>
          <p className="doc-text">{p.analise_tecnica || '—'}</p>
        </section>

        <section className="doc-section">
          <h2>CONCLUSÃO TÉCNICA</h2>
          <p className="doc-text">{p.conclusao_tecnica || '—'}</p>
        </section>

        <section className="doc-section">
          <h2>PARECER FINAL</h2>
          <ul className="doc-checks">
            {PARECER_FINAL.map(([v, l]) => (
              <li key={v} className={p.parecer_final === v ? 'checked' : ''}>{marcado(p.parecer_final === v)} {l}</li>
            ))}
          </ul>
        </section>

        <section className="doc-section">
          <h2>PERDA (PREJUÍZO)</h2>
          <ul className="doc-checks inline">
            {DECISAO_PERDA.map(([v, l]) => (
              <li key={v} className={p.decisao_perda === v ? 'checked' : ''}>{marcado(p.decisao_perda === v)} {l}</li>
            ))}
          </ul>
        </section>

        <footer className="doc-foot">
          MAMUTE – Gestão de Frotas · Parecer emitido em {data(p.data)} · Documento gerado pelo sistema
        </footer>
      </article>
    </>
  );
}
