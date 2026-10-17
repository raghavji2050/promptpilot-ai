import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type FieldProps = { label: ReactNode; hint?: ReactNode; hideLabel?: boolean; className?: string };

function Field({ id, label, hint, hideLabel, className, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "label"}>{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="hint">{hint}</p>}
    </div>
  );
}

export function Input({ label, hint, hideLabel, className, id, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId(); const fid = id ?? auto;
  return <Field id={fid} label={label} hint={hint} hideLabel={hideLabel} className={className}><input id={fid} className="input" aria-describedby={hint ? `${fid}-hint` : undefined} {...rest} /></Field>;
}

export function Textarea({ label, hint, hideLabel, className, id, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId(); const fid = id ?? auto;
  return <Field id={fid} label={label} hint={hint} hideLabel={hideLabel} className={className}><textarea id={fid} className="input" aria-describedby={hint ? `${fid}-hint` : undefined} {...rest} /></Field>;
}

export function Select({ label, hint, hideLabel, className, id, options, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const auto = useId(); const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} hideLabel={hideLabel} className={className}>
      <select id={fid} className="input" aria-describedby={hint ? `${fid}-hint` : undefined} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}
