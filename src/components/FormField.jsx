// Campo de formulário padronizado: rótulo, controle, ajuda e erro.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function FormField({ field, value, error, onChange, disabled, form }) {
  const { name, label, type = 'text', options = [], required, help, full, placeholder, step, maxLength, uppercase, refTable, refLabel, refFilter } = field;
  const [refOpts, setRefOpts] = useState([]);
  const id = `f-${name}`;

  useEffect(() => {
    if (type !== 'ref' || !supabase) return;
    supabase
      .from(refTable)
      .select('*')
      .order(refLabel.key || 'created_at', { ascending: true })
      .then(({ data }) => setRefOpts((data || []).filter((r) => (refFilter ? refFilter(r, form) : true))));
  }, [type, refTable]); // eslint-disable-line react-hooks/exhaustive-deps

  const common = {
    id,
    name,
    disabled,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-err` : undefined,
    required,
  };

  let control;
  if (type === 'select') {
    control = (
      <select {...common} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  } else if (type === 'ref') {
    control = (
      <select {...common} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {refOpts.map((r) => <option key={r.id} value={r.id}>{refLabel.fn(r)}</option>)}
      </select>
    );
  } else if (type === 'textarea') {
    control = <textarea {...common} className="input" rows={field.rows || 3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  } else if (type === 'radio') {
    control = (
      <div className="radio-group">
        {options.map(([v, l]) => (
          <label key={v} className="radio">
            <input type="radio" name={name} value={v} checked={value === v} disabled={disabled} onChange={() => onChange(v)} />
            <span>{l}</span>
          </label>
        ))}
      </div>
    );
  } else if (type === 'checkbox') {
    control = (
      <label className="radio">
        <input type="checkbox" name={name} checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.checkLabel || label}</span>
      </label>
    );
  } else {
    control = (
      <input
        {...common}
        className="input"
        type={type === 'number' || type === 'money' ? 'number' : type}
        step={type === 'money' ? '0.01' : step || (type === 'number' ? '1' : undefined)}
        inputMode={type === 'number' || type === 'money' ? 'decimal' : undefined}
        min={type === 'number' || type === 'money' ? 0 : undefined}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      />
    );
  }

  if (type === 'radio' || type === 'checkbox') {
    return (
      <fieldset className={`field ${full ? 'full' : ''} ${error ? 'has-error' : ''}`}>
        <legend>{label}{required && <span className="req">*</span>}</legend>
        {control}
        {help && <small className="help">{help}</small>}
        {error && <small id={`${id}-err`} className="error">{error}</small>}
      </fieldset>
    );
  }

  return (
    <div className={`field ${full ? 'full' : ''} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {control}
      {help && <small className="help">{help}</small>}
      {error && <small id={`${id}-err`} className="error">{error}</small>}
    </div>
  );
}
