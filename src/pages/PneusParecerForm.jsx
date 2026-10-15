// Formulário de parecer técnico (estrutura do modelo MAMUTE_TEMPLETE)
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { hoje, mensagemErro } from '../lib/format';
import { ANALISE_PADRAO, CONCLUSAO_PADRAO, snapshotParecer } from '../lib/parecer';
import { DECISAO_PERDA, PARECER_FINAL } from '../lib/constants';
import { Alert, Button, Card, Loading, PageHeader } from '../components/ui';
import FormField from '../components/FormField';

export const FOTOS = [
  { key: 'foto1', titulo: 'Fotografia 1 – Visão geral da avaria' },
  { key: 'foto2', titulo: 'Fotografia 2 – Detalhe da avaria' },
  { key: 'foto3', titulo: 'Fotografia 3 – Identificação do pneu' },
  { key: 'foto4', titulo: 'Fotografia 4 – Posição no veículo' },
];

const AREAS = ['Banda de rodagem', 'Ombro', 'Flanco', 'Talão', 'Carcaça', 'Interna (liner)'];

const VAZIO = {
  data: hoje(), veiculo_id: '', pneu_id: '', vistoria_id: '', km: '', segmento: '',
  tipo_avaria: '', area_pneu: '', provavel_causa: '', fonte_tecnica: '',
  analise_tecnica: '', conclusao_tecnica: '', parecer_final: '', decisao_perda: '',
  status: 'rascunho',
};

const preencherTexto = (modelo, avaria, causa) =>
  modelo.replace('{avaria}', avaria || '[tipo de avaria]').replace('{causa}', causa || '[provável causa]');

export default function PneusParecerForm() {
  const { id } = useParams();
  const editando = id && id !== 'novo';
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({ ...VAZIO, id: crypto.randomUUID() }));
  const [fotos, setFotos] = useState({}); // { foto1: 'path' }
  const [previews, setPreviews] = useState({}); // { foto1: url }
  const [veiculos, setVeiculos] = useState([]);
  const [pneus, setPneus] = useState([]);
  const [vistorias, setVistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [numero, setNumero] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const [v, p, vi] = await Promise.all([
        supabase.from('veiculos').select('*').order('prefixo'),
        supabase.from('pneus').select('*').order('marca'),
        supabase.from('vistorias_pneu').select('id,data,pneu_id,veiculo_id,condicao').order('data', { ascending: false }),
      ]);
      setVeiculos(v.data || []);
      setPneus(p.data || []);
      setVistorias(vi.data || []);
      if (editando) {
        const { data: row, error } = await supabase.from('pareceres_pneu').select('*').eq('id', id).single();
        if (error) setMsg(mensagemErro(error));
        if (row) {
          setNumero(row.numero);
          const { id: _i, numero: _n, created_at, updated_at, created_by, fotos: fo, ...rest } = row;
          setForm({ ...VAZIO, ...rest, id: row.id, data: row.data, km: row.veiculo_km ?? '' });
          setFotos(fo || {});
          const urls = {};
          for (const [k, path] of Object.entries(fo || {})) {
            if (!path) continue;
            const { data: s } = await supabase.storage.from('vistorias').createSignedUrl(path, 3600);
            if (s) urls[k] = s.signedUrl;
          }
          setPreviews(urls);
        }
      }
      setLoading(false);
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (campo) => (valor) => setForm((s) => ({ ...s, [campo]: valor }));

  const veiculo = useMemo(() => veiculos.find((v) => v.id === form.veiculo_id), [veiculos, form.veiculo_id]);
  const pneu = useMemo(() => pneus.find((p) => p.id === form.pneu_id), [pneus, form.pneu_id]);
  const vistoriasDoPneu = vistorias.filter((v) => !form.pneu_id || v.pneu_id === form.pneu_id);

  // Preenche dados do veículo/pneu ao escolher
  const escolherVeiculo = (vid) => {
    const v = veiculos.find((x) => x.id === vid);
    setForm((s) => ({ ...s, veiculo_id: vid, km: v?.km_atual ?? s.km, segmento: v?.familia || s.segmento }));
  };

  const enviarFoto = async (chave, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Selecione um arquivo de imagem.'); return; }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const caminho = `pareceres/${form.id}/${chave}-${Date.now()}.${ext}`;
    setMsg('Enviando foto…');
    const { error } = await supabase.storage.from('vistorias').upload(caminho, file, { upsert: false, contentType: file.type });
    if (error) { setMsg(mensagemErro(error)); return; }
    const { data: s } = await supabase.storage.from('vistorias').createSignedUrl(caminho, 3600);
    setFotos((f) => ({ ...f, [chave]: caminho }));
    setPreviews((p) => ({ ...p, [chave]: s?.signedUrl || URL.createObjectURL(file) }));
    setMsg('');
  };

  const removerFoto = (chave) => {
    setFotos((f) => ({ ...f, [chave]: null }));
    setPreviews((p) => ({ ...p, [chave]: null }));
  };

  const validar = (emitir) => {
    const e = {};
    if (!form.veiculo_id) e.veiculo_id = 'Selecione o veículo.';
    if (!form.pneu_id) e.pneu_id = 'Selecione o pneu.';
    if (!form.data) e.data = 'Informe a data.';
    if (!form.tipo_avaria) e.tipo_avaria = 'Informe o tipo de avaria.';
    if (emitir) {
      if (!form.analise_tecnica) e.analise_tecnica = 'Obrigatório para emitir.';
      if (!form.conclusao_tecnica) e.conclusao_tecnica = 'Obrigatório para emitir.';
      if (!form.parecer_final) e.parecer_final = 'Selecione o parecer final.';
      if (!form.decisao_perda) e.decisao_perda = 'Selecione a decisão sobre perda.';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvar = async (emitir) => {
    if (!validar(emitir)) { setMsg('Revise os campos destacados.'); return; }
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        id: form.id,
        data: form.data,
        vistoria_id: form.vistoria_id || null,
        veiculo_id: form.veiculo_id,
        pneu_id: form.pneu_id,
        ...snapshotParecer({ veiculo: { ...veiculo, km_atual: form.km || veiculo?.km_atual }, pneu }),
        tipo_avaria: form.tipo_avaria || null,
        area_pneu: form.area_pneu || null,
        provavel_causa: form.provavel_causa || null,
        fonte_tecnica: form.fonte_tecnica || null,
        analise_tecnica: form.analise_tecnica || null,
        conclusao_tecnica: form.conclusao_tecnica || null,
        parecer_final: form.parecer_final || null,
        decisao_perda: form.decisao_perda || null,
        fotos,
        status: emitir ? 'emitido' : 'rascunho',
        updated_at: new Date().toISOString(),
      };
      if (editando) {
        const { error } = await supabase.from('pareceres_pneu').update(payload).eq('id', id);
        if (error) throw error;
        navigate(`/pneus/pareceres/${id}`);
      } else {
        const { error } = await supabase.from('pareceres_pneu').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
        if (error) throw error;
        navigate(`/pneus/pareceres/${form.id}`);
      }
    } catch (err) {
      setMsg(mensagemErro(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <PageHeader
        title={editando ? `Editar parecer${numero ? ` Nº ${String(numero).padStart(6, '0')}` : ''}` : 'Novo parecer técnico'}
        subtitle="Preencha as seções na ordem do modelo. Rascunhos podem ser salvos a qualquer momento."
        actions={<Button variant="ghost" onClick={() => navigate('/pneus/pareceres')}>Voltar à lista</Button>}
      />
      <Alert>{msg}</Alert>

      <Card title="1. Dados do veículo">
        <div className="form-grid">
          <FormField field={{ name: 'veiculo_id', label: 'Veículo (placa / prefixo)', type: 'select', required: true, options: veiculos.map((v) => [v.id, `${v.prefixo} – ${v.placa || 'sem placa'} · ${v.marca || ''} ${v.modelo || ''}`]) }}
            value={form.veiculo_id} error={erros.veiculo_id} onChange={escolherVeiculo} />
          <FormField field={{ name: 'km', label: 'Km', type: 'number' }} value={form.km} onChange={set('km')} />
          <FormField field={{ name: 'segmento', label: 'Segmento', placeholder: 'Ex.: Ração' }} value={form.segmento} onChange={set('segmento')} />
          <FormField field={{ name: 'data', label: 'Data do parecer', type: 'date', required: true }} value={form.data} error={erros.data} onChange={set('data')} />
          {veiculo && (
            <p className="muted full">{veiculo.marca} {veiculo.modelo} · {veiculo.ano_modelo} · placa {veiculo.placa || '—'}</p>
          )}
        </div>
      </Card>

      <Card title="2. Identificação do pneu e vistoria">
        <div className="form-grid">
          <FormField field={{ name: 'pneu_id', label: 'Pneu (marca · modelo · medida · fogo)', type: 'select', required: true, full: true, options: pneus.map((p) => [p.id, `${p.marca} ${p.modelo} · ${p.medida} · fogo ${p.fogo || '—'}`]) }}
            value={form.pneu_id} error={erros.pneu_id} onChange={set('pneu_id')} />
          <FormField field={{ name: 'vistoria_id', label: 'Vistoria de origem (opcional)', type: 'select', full: true, options: vistoriasDoPneu.map((v) => [v.id, `${new Date(v.data + 'T00:00').toLocaleDateString('pt-BR')} · ${v.condicao}`]) }}
            value={form.vistoria_id} onChange={set('vistoria_id')} />
          {pneu && (
            <p className="muted full">Fogo {pneu.fogo || '—'} · DOT {pneu.dot || '—'} · status {pneu.status}</p>
          )}
        </div>
      </Card>

      <Card title="3. Fotografias">
        <div className="photo-grid">
          {FOTOS.map((f) => (
            <div className="photo-slot" key={f.key}>
              <span className="photo-title">{f.titulo}</span>
              {previews[f.key] ? (
                <img src={previews[f.key]} alt={f.titulo} />
              ) : (
                <div className="photo-empty">Sem imagem</div>
              )}
              <div className="photo-actions">
                <label className="btn btn-ghost btn-sm">
                  {previews[f.key] ? 'Trocar' : 'Anexar'}
                  <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => enviarFoto(f.key, e.target.files?.[0])} />
                </label>
                {previews[f.key] && <Button variant="ghost" small onClick={() => removerFoto(f.key)}>Remover</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="4. Dados da avaria">
        <div className="form-grid">
          <FormField field={{ name: 'tipo_avaria', label: 'Tipo de avaria', required: true, placeholder: 'Ex.: Corte na banda de rodagem' }} value={form.tipo_avaria} error={erros.tipo_avaria} onChange={set('tipo_avaria')} />
          <FormField field={{ name: 'area_pneu', label: 'Área do pneu', type: 'select', options: AREAS.map((a) => [a, a]) }} value={form.area_pneu} onChange={set('area_pneu')} />
          <FormField field={{ name: 'provavel_causa', label: 'Provável causa', full: true, placeholder: 'Ex.: Contato com objeto cortante ou perfurante durante a operação' }} value={form.provavel_causa} onChange={set('provavel_causa')} />
          <FormField field={{ name: 'fonte_tecnica', label: 'Fonte técnica', full: true, placeholder: 'Ex.: Manual do fabricante, norma ou catálogo técnico utilizado', help: 'Informe a referência técnica efetivamente consultada' }} value={form.fonte_tecnica} onChange={set('fonte_tecnica')} />
        </div>
      </Card>

      <Card title="5. Análise técnica"
        actions={<Button variant="ghost" small onClick={() => setForm((s) => ({ ...s, analise_tecnica: preencherTexto(ANALISE_PADRAO, s.tipo_avaria, s.provavel_causa) }))}>Usar texto-base</Button>}>
        <FormField field={{ name: 'analise_tecnica', label: 'Descrição da análise', type: 'textarea', rows: 5, full: true }} value={form.analise_tecnica} error={erros.analise_tecnica} onChange={set('analise_tecnica')} />
      </Card>

      <Card title="6. Conclusão técnica"
        actions={<Button variant="ghost" small onClick={() => setForm((s) => ({ ...s, conclusao_tecnica: preencherTexto(CONCLUSAO_PADRAO, s.tipo_avaria, s.provavel_causa) }))}>Usar texto-base</Button>}>
        <FormField field={{ name: 'conclusao_tecnica', label: 'Conclusão', type: 'textarea', rows: 4, full: true }} value={form.conclusao_tecnica} error={erros.conclusao_tecnica} onChange={set('conclusao_tecnica')} />
      </Card>

      <Card title="7. Parecer final">
        <FormField field={{ name: 'parecer_final', label: 'Selecione uma opção', type: 'radio', options: PARECER_FINAL, required: true, full: true }} value={form.parecer_final} error={erros.parecer_final} onChange={set('parecer_final')} />
      </Card>

      <Card title="8. Perda (prejuízo)">
        <FormField field={{ name: 'decisao_perda', label: 'Decisão', type: 'radio', options: DECISAO_PERDA, required: true, full: true }} value={form.decisao_perda} error={erros.decisao_perda} onChange={set('decisao_perda')} />
      </Card>

      <div className="form-actions sticky-actions">
        <Button variant="ghost" onClick={() => navigate('/pneus/pareceres')}>Cancelar</Button>
        <Button variant="secondary" disabled={saving} onClick={() => salvar(false)}>Salvar rascunho</Button>
        <Button disabled={saving} onClick={() => salvar(true)}>{saving ? 'Salvando…' : 'Emitir parecer'}</Button>
      </div>
    </>
  );
}
