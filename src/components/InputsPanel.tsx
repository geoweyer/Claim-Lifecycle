import type { Inputs } from '../state';

interface Props {
  inputs: Inputs;
  update: (patch: Partial<Inputs>) => void;
  reset: () => void;
}

type NumberKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never;
}[keyof Inputs];

/** Visitor-editable plan, contract and prescription settings. */
export function InputsPanel({ inputs, update, reset }: Props) {
  const num = (key: NumberKey, label: string, opts: { step: number; max?: number; prefix?: string; suffix?: string }) => (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        {opts.prefix && <span className="affix">{opts.prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={opts.max}
          step={opts.step}
          value={inputs[key]}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) update({ [key]: opts.max ? Math.min(opts.max, n) : n });
          }}
        />
        {opts.suffix && <span className="affix">{opts.suffix}</span>}
      </span>
    </label>
  );

  const check = (key: 'hdhp' | 'antiplatelet' | 'pcsk9' | 'selfFunded', label: string) => (
    <label className="check">
      <input type="checkbox" checked={inputs[key]} onChange={(e) => update({ [key]: e.target.checked })} />
      <span>{label}</span>
    </label>
  );

  return (
    <section id="settings" tabIndex={-1} className="inputs" aria-labelledby="inputs-heading">
      <div className="section-head">
        <h2 id="inputs-heading">Change the scenario</h2>
        <button type="button" onClick={reset}>
          Reset to defaults
        </button>
      </div>
      {inputs.deductible > inputs.moop && (
        <p className="notice" role="status">
          The deductible is higher than the out-of-pocket maximum, so the patient stops paying at the maximum.
        </p>
      )}
      <div className="input-groups">
        <fieldset>
          <legend>Plan design</legend>
          {num('deductible', 'Deductible', { step: 250, prefix: '$' })}
          {num('coinsurancePct', 'Patient coinsurance', { step: 5, max: 100, suffix: '%' })}
          {num('moop', 'Out-of-pocket maximum', { step: 500, prefix: '$' })}
        </fieldset>
        <fieldset>
          <legend>Contract, as a percent of Medicare</legend>
          {num('facilityPct', 'Facility services', { step: 10, suffix: '%' })}
          {num('professionalPct', 'Professional services', { step: 10, suffix: '%' })}
        </fieldset>
        <fieldset>
          <legend>Prescription copays by tier</legend>
          {num('rx1', 'Tier 1, generic', { step: 5, prefix: '$' })}
          {num('rx2', 'Tier 2, preferred brand', { step: 5, prefix: '$' })}
          {num('rx3', 'Tier 3, non-preferred', { step: 5, prefix: '$' })}
          {num('rx4', 'Tier 4, specialty', { step: 5, prefix: '$' })}
        </fieldset>
        <fieldset>
          <legend>Options</legend>
          {check('hdhp', 'High-deductible plan: prescriptions apply to the deductible')}
          {check('antiplatelet', 'Second antiplatelet prescribed after surgery')}
          {check('pcsk9', 'Brand cholesterol injection added at follow-up')}
          {check('selfFunded', 'Employer self-funds the plan')}
        </fieldset>
        <fieldset>
          <legend>Employer and funding</legend>
          {num('employees', 'Covered employees', { step: 50 })}
          {num('premium', 'Premium or budget per employee, per year', { step: 100, prefix: '$' })}
          {num('employerSharePct', 'Employer share', { step: 1, max: 100, suffix: '%' })}
          {num('expectedClaims', 'Expected claims per employee, without this episode', { step: 50, prefix: '$' })}
          {num('admin', 'Administration per employee', { step: 50, prefix: '$' })}
        </fieldset>
        <fieldset>
          <legend>Stop-loss, when self-funded</legend>
          {num('attachment', 'Attachment point per member', { step: 5000, prefix: '$' })}
          {num('stopLossPremium', 'Premium per employee', { step: 50, prefix: '$' })}
        </fieldset>
        <fieldset>
          <legend>Provider economics</legend>
          {num('chargeFacility', 'Facility charge, multiple of Medicare', { step: 0.5, suffix: '×' })}
          {num('chargeProfessional', 'Professional charge, multiple of Medicare', { step: 0.5, suffix: '×' })}
          {num('ccrFacilityPct', 'Facility cost as a share of charge', { step: 1, max: 100, suffix: '%' })}
          {num('ccrProfessionalPct', 'Professional cost as a share of charge', { step: 1, max: 100, suffix: '%' })}
          {num('directPct', 'Direct share of cost', { step: 5, max: 100, suffix: '%' })}
          {num('badDebtPct', 'Patient balances never collected', { step: 1, max: 100, suffix: '%' })}
        </fieldset>
      </div>
    </section>
  );
}
