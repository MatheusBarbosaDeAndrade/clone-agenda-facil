import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Field({ label, error, hint, children, className = "" }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={children?.props?.id}>{label}</label>}
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextField({ label, error, hint, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        className="input"
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

export function PasswordField({
  label = "Senha",
  error,
  hint,
  className,
  ...props
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={`field ${className || ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  className = "btn btn-primary btn-block",
  ...props
}) {
  return (
    <button type="submit" className={className} disabled={loading} {...props}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
