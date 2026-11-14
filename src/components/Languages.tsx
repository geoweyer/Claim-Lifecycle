import { useState, type ReactNode } from 'react';
import { LANGUAGES, PCS_BREAKDOWN } from '../data/languages';
import { usd2, type EpisodeView } from '../episodeView';

const CODE_NOTICE =
  'Procedure code withheld. CPT codes and descriptions are copyrighted by the American Medical Association.';

const Masked = () => (
  <span className="masked" title={CODE_NOTICE} aria-label={CODE_NOTICE}>
    #####
  </span>
);

interface Props {
  view: EpisodeView;
}

/** A field guide to the code sets, and one operation told in each of them. */
export function Languages({ view }: Props) {
  const [id, setId] = useState(LANGUAGES[0].id);
  const lang = LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];

  const cabg = view.steps.flatMap((s) => s.lines).find((l) => l.line.id === 'cabg-facility');
  const money = (n: number) => n.toFixed(2);

  const rosetta: { lang: string; reader: string; telling: ReactNode }[] = [
    {
      lang: 'ICD-10-CM',
      reader: 'Everyone',
      telling: (
        <>
          <code>I25.119</code> Coronary artery disease with angina. This is why.
        </>
      ),
    },
    {
      lang: 'ICD-10-PCS',
      reader: 'The hospital and its payer',
      telling: (
        <>
          <code>02100Z9</code> <code>021109W</code> <code>5A1221Z</code> One artery bypassed from the chest wall, two
          from the aorta with vein, on heart-lung bypass.
        </>
      ),
    },
    {
      lang: 'CPT',
      reader: 'The surgeon, the anesthesiologist and their payer',
      telling: (
        <>
          <Masked /> for the grafts, <Masked /> for the anesthesia. {CODE_NOTICE}
        </>
      ),
    },
    {
      lang: 'HCPCS Level II',
      reader: 'Suppliers and outpatient billers',
      telling: 'Silent. Inside an admission, supplies, implants and drugs are not billed one by one.',
    },
    {
      lang: 'MS-DRG',
      reader: 'The payer’s grouper',
      telling: (
        <>
          <code>236</code> Coronary bypass without catheterization, without major complications. One number for the
          whole stay, intensive care included.
        </>
      ),
    },
    {
      lang: 'APC',
      reader: 'Outpatient payment systems',
      telling: 'Silent. It speaks before and after: the stress echo, the catheterization, the rehabilitation sessions.',
    },
    {
      lang: 'ASC X12 EDI',
      reader: 'Billing and claim systems',
      telling: cabg ? (
        <>
          <span className="edi">
            CLM*A1B2C3*{money(cabg.charge)}***11:A:1~
            <br />
            HI*ABK:I25119~
            <br />
            HI*BBR:02100Z9~
          </span>
          The claim. Then the answer:
          <span className="edi">
            CLP*A1B2C3*1*{money(cabg.charge)}*{money(cabg.planPaid)}*{money(cabg.patientPaid)}~
            <br />
            CAS*CO*45*{money(cabg.contractualAdjustment)}~
          </span>
          Billed {usd2(cabg.charge)}, paid {usd2(cabg.planPaid)}, patient owes {usd2(cabg.patientPaid)}, and{' '}
          {usd2(cabg.contractualAdjustment)} written off. Segments are simplified.
        </>
      ) : (
        'The claim and its answer.'
      ),
    },
    {
      lang: 'NCPDP',
      reader: 'The pharmacy and the benefit manager',
      telling: 'Silent in the operating room. It speaks at discharge, when the prescriptions are filled.',
    },
    {
      lang: 'NDC',
      reader: 'The pharmacy supply chain',
      telling: 'Inside the hospital, each drug has one but none is billed. On the discharge prescriptions, each is the product being priced.',
    },
    {
      lang: 'LOINC',
      reader: 'The laboratory and the medical record',
      telling: (
        <>
          <code>10839-9</code> Troponin, checked after surgery. Recorded in the chart, not on the claim.
        </>
      ),
    },
  ];

  const fields: [string, string][] = [
    ['Keeper', lang.keeper],
    ['Spoken by', lang.speakers],
    ['Grammar', lang.grammar],
    ['How it moves money', lang.role],
    ['In this episode', lang.inEpisode],
    ['Rights', lang.rights],
  ];

  return (
    <section id="languages" tabIndex={-1} className="languages" aria-labelledby="languages-heading">
      <h2 id="languages-heading">The languages of medicine</h2>
      <p className="lede">
        No one is paid for care as it was spoken in the exam room. Each event is translated, by people and by
        software, into a handful of formal languages. Each has a keeper, a grammar and native speakers, and each
        says one kind of thing.
      </p>

      <div className="chips" role="group" aria-label="Choose a language">
        {LANGUAGES.map((l) => (
          <button key={l.id} type="button" aria-pressed={l.id === id} onClick={() => setId(l.id)}>
            {l.name}
            {l.locked && <span className="lock" aria-label="copyright restricted"> &#128274;</span>}
          </button>
        ))}
      </div>

      <p className="sr-only" role="status">
        {lang.name}: {lang.says}
      </p>
      <div className="card">
        <div className="card-head">
          <h3>{lang.name}</h3>
          {lang.locked && <span className="badge">Codes withheld</span>}
        </div>
        <p className="says">It says: {lang.says}.</p>
        <dl className="rows">
          {fields.map(([k, val]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{val}</dd>
            </div>
          ))}
          <div>
            <dt>Examples</dt>
            <dd>
              {lang.locked ? (
                <>
                  <Masked /> {CODE_NOTICE}
                </>
              ) : (
                <ul className="plain">
                  {(lang.examples ?? []).map((e) => (
                    <li key={e.code}>
                      <code>{e.code}</code> {e.text}
                    </li>
                  ))}
                  {!lang.examples && <li>Messages, not single codes.</li>}
                </ul>
              )}
            </dd>
          </div>
        </dl>
        {lang.id === 'icd10pcs' && (
          <>
            <h4 className="pcs-title">How 021109W is built</h4>
            <ol className="pcs">
              {PCS_BREAKDOWN.map((p, i) => (
                <li key={i}>
                  <span className="pcs-char">{p.char}</span>
                  <span className="pcs-axis">{p.axis}</span>
                  <span className="pcs-meaning">{p.meaning}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <h3>One operation, told ten ways</h3>
      <p className="muted">The bypass surgery in step 5, as each language records it.</p>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="The bypass surgery in each language">
        <table className="rosetta">
          <thead>
            <tr>
              <th scope="col">Language</th>
              <th scope="col">How it tells the surgery</th>
              <th scope="col">Who reads it</th>
            </tr>
          </thead>
          <tbody>
            {rosetta.map((r) => (
              <tr key={r.lang}>
                <th scope="row">{r.lang}</th>
                <td>{r.telling}</td>
                <td>{r.reader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        Codes shown are illustrations for a fictional patient. CPT is the only language here whose codes cannot be
        shown without a paid licence. Several others are copyrighted but free to use, and the federal code sets are
        in the public domain.
      </p>
    </section>
  );
}
