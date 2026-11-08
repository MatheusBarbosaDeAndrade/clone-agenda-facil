import { TextField } from "components/Field.jsx";
import { maskPhone } from "lib/format.js";

export function RoleToggle({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="Tipo de perfil">
      {[
        ["cliente", "Cliente"],
        ["prestador", "Prestador"],
      ].map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PhoneField({ value, onChange, error }) {
  return (
    <TextField
      label="Telefone"
      placeholder="(11) 99999-9999"
      inputMode="tel"
      autoComplete="tel-national"
      value={value}
      onChange={(event) => onChange(maskPhone(event.target.value))}
      error={error}
      required
    />
  );
}

export function ProviderFields({ form, set, errors }) {
  return (
    <>
      <TextField
        label="Local"
        placeholder="Ex: Tv. Timbó nº123"
        autoComplete="street-address"
        value={form.local}
        onChange={set("local")}
        error={errors.local}
        maxLength={200}
        required
      />
      <TextField
        label="Tipo de Serviço"
        placeholder="Ex: Mecânico de Carros"
        value={form.especialidade}
        onChange={set("especialidade")}
        error={errors.especialidade}
        maxLength={120}
        required
      />
    </>
  );
}

export function ConsentCheckbox({ checked, onChange, error }) {
  return (
    <div className="field">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          Li e aceito os{" "}
          <a href="/termos" target="_blank" rel="noopener">
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a href="/privacidade" target="_blank" rel="noopener">
            Política de Privacidade
          </a>
          , e autorizo o tratamento dos meus dados para a prestação do serviço.
        </span>
      </label>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
