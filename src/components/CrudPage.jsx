// Tela genérica de listagem + formulário + exclusão, usada pelos cadastros e rotinas simples.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { mensagemErro } from '../lib/format';
import { Alert, Button, Card, Confirm, Empty, Loading, Modal, PageHeader } from './ui';
import FormField from './FormField';

export default function CrudPage({
  title,
  subtitle,
  table,
  select = '*',
  orderBy = 'created_at',
  ascending = false,
  columns,
  fields,
  searchKeys = [],
  defaults = {},
  toPayload,
  filters = [],
  onSaved,
  beforeSave,
  rowActions,
  canCreate = true,
  canDelete = true,
  readOnlyFields = [],
  formTitle = 'Registro',
  wide = false,
  enrich,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroValores, setFiltroValores] = useState({});
  const [editing, setEditing] = useState(null); // null | {} (novo) | row
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending });
    if (err) setError(mensagemErro(err));
    setRows(enrich ? enrich(data || []) : data || []);
    setLoading(false);
  }, [table, select, orderBy, ascending, enrich]);

  useEffect(() => { load(); }, [load]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return rows.filter((r) => {
      for (const f of filters) {
        const v = filtroValores[f.key];
        if (v && String(r[f.key] ?? '') !== v) return false;
      }
      if (!termo) return true;
      return searchKeys.some((k) => {
        const val = typeof k === 'function' ? k(r) : r[k];
        return String(val ?? '').toLowerCase().includes(termo);
      });
    });
  }, [rows, busca, filtroValores, filters, searchKeys]);

  const abrirNovo = () => {
    setForm({ ...defaults });
    setFormErrors({});
    setEditing({});
  };

  const abrirEdicao = (row) => {
    const f = {};
    fields.forEach((fd) => { f[fd.name] = row[fd.name] ?? ''; });
    setForm({ ...defaults, ...row, ...f });
    setFormErrors({});
    setEditing(row);
  };

  const validar = () => {
    const erros = {};
    fields.forEach((fd) => {
      const v = form[fd.name];
      if (fd.required && (v === '' || v === null || v === undefined)) erros[fd.name] = 'Campo obrigatório.';
      if (fd.type === 'number' && v !== '' && v !== null && Number.isNaN(Number(v))) erros[fd.name] = 'Informe um número válido.';
    });
    setFormErrors(erros);
    return Object.keys(erros).length === 0;
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setError('');
    try {
      let payload = toPayload ? toPayload(form) : form;
      if (beforeSave) payload = await beforeSave(payload, editing?.id ? editing : null);
      const campos = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (k === 'id' || k.startsWith('_')) return;
        // relações embutidas (ex.: veiculos: {...}) não são colunas
        if (v && typeof v === 'object' && !Array.isArray(v)) return;
        campos[k] = v === '' ? null : v;
      });
      if (editing && editing.id) {
        const { error: err } = await supabase.from(table).update(campos).eq('id', editing.id);
        if (err) throw err;
      } else {
        const { data: ins, error: err } = await supabase.from(table).insert(campos).select().single();
        if (err) throw err;
        if (onSaved) await onSaved(ins, 'insert');
      }
      if (editing && editing.id && onSaved) await onSaved({ ...editing, ...campos }, 'update');
      setEditing(null);
      setNotice('Registro salvo com sucesso.');
      setTimeout(() => setNotice(''), 3000);
      load();
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    const { error: err } = await supabase.from(table).delete().eq('id', toDelete.id);
    setToDelete(null);
    if (err) setError(mensagemErro(err));
    else load();
  };

  const renderValue = (col, row) => (col.render ? col.render(row) : row[col.key] ?? '—');

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={canCreate && <Button onClick={abrirNovo}>+ Novo registro</Button>}
      />
      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      <Card>
        <div className="toolbar">
          <input
            className="input search"
            type="search"
            placeholder="Pesquisar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Pesquisar"
          />
          {filters.map((f) => (
            <select
              key={f.key}
              className="input"
              aria-label={f.label}
              value={filtroValores[f.key] || ''}
              onChange={(e) => setFiltroValores((s) => ({ ...s, [f.key]: e.target.value }))}
            >
              <option value="">{f.label}: todos</option>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <span className="muted toolbar-count">{visiveis.length} registro(s)</span>
        </div>

        {loading ? (
          <Loading />
        ) : visiveis.length === 0 ? (
          <Empty />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                    <th className="actions-col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((row) => (
                    <tr key={row.id}>
                      {columns.map((c) => (
                        <td key={c.key} data-label={c.label}>{renderValue(c, row)}</td>
                      ))}
                      <td className="actions-col" data-label="Ações">
                        {rowActions && rowActions(row)}
                        <Button variant="ghost" small onClick={() => abrirEdicao(row)}>Editar</Button>
                        {canDelete && (
                          <Button variant="ghost" small className="text-danger" onClick={() => setToDelete(row)}>Excluir</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Modal open={editing !== null} title={`${editing?.id ? 'Editar' : 'Novo'} ${formTitle}`} onClose={() => setEditing(null)} wide={wide}>
        <form onSubmit={salvar} noValidate className="form-grid">
          {fields.map((fd) => (
            <FormField
              key={fd.name}
              field={fd}
              value={form[fd.name]}
              error={formErrors[fd.name]}
              disabled={readOnlyFields.includes(fd.name)}
              onChange={(v) => setForm((s) => ({ ...s, [fd.name]: v }))}
              form={form}
            />
          ))}
          <div className="form-actions full">
            <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={!!toDelete}
        message="Esta ação não pode ser desfeita. Deseja excluir este registro?"
        onCancel={() => setToDelete(null)}
        onConfirm={excluir}
      />
    </>
  );
}
