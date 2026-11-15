import type { TabId } from '../state';

// The payment system drawn as six parts. Each part pulls apart into the steps inside it.

export interface AnatomyLayer {
  title: string;
  text: string;
  /** The code set, form or transaction used at this step, if any. */
  language?: string;
}

export interface AnatomyPart {
  id: string;
  name: string;
  who: string;
  summary: string;
  layers: AnatomyLayer[];
  /** Where the full detail lives. */
  tab: TabId;
  link: string;
}

export const ANATOMY: AnatomyPart[] = [
  {
    id: 'funding',
    name: 'Coverage and funding',
    who: 'Plan sponsor, members, carrier',
    summary: 'The price of a claim is settled long before the claim exists, in a benefit design and a funding arrangement.',
    tab: 'money',
    link: 'See who funds the plan and who holds the risk',
    layers: [
      { title: 'Plan selection', text: 'The employer picks a benefit design and decides whether to buy insurance or self-fund under an ASO contract.' },
      { title: 'Rating', text: 'A carrier quotes a premium, or an actuary sets a premium equivalent. The employer decides how much comes out of paychecks.' },
      { title: 'Enrollment', text: 'Open enrollment produces an eligibility file. Mistakes in it resurface months later as denied claims.', language: 'X12 834' },
      { title: 'Premium remittance', text: 'Premium moves every month. Nobody has to be sick.', language: 'X12 820' },
      { title: 'Member cost share', text: 'Deductible, coinsurance, copays and the out-of-pocket maximum fix the member’s part of every later claim.' },
      { title: 'Risk', text: 'The carrier holds it. Or the employer does, and buys specific and aggregate stop-loss against a bad year.' },
    ],
  },
  {
    id: 'care',
    name: 'Encounter and coding',
    who: 'Patient, clinicians, coders',
    summary: 'Care is delivered in clinical language. Before it can be billed it has to be restated in codes and priced from the chargemaster.',
    tab: 'episode',
    link: 'Walk through the eight encounters',
    layers: [
      { title: 'Eligibility and benefits', text: 'Front-desk staff confirm active coverage and how much deductible is left.', language: 'X12 270/271' },
      { title: 'Prior authorization', text: 'Advanced imaging, catheterization and elective surgery need approval first. Much of it still travels by portal, phone and fax.', language: 'X12 278' },
      { title: 'The encounter', text: 'A visit, a study, an operation.' },
      { title: 'Documentation', text: 'The note has to support every code that follows it. What is not documented cannot be billed.' },
      { title: 'Coding', text: 'A coder or the physician assigns the diagnoses and the procedures.', language: 'ICD-10-CM, CPT, HCPCS, ICD-10-PCS' },
      { title: 'Charge capture', text: 'Each code pulls a price from the chargemaster. A missed charge is revenue that never reaches a claim.' },
    ],
  },
  {
    id: 'claim',
    name: 'Claim submission',
    who: 'Billing office, clearinghouse',
    summary: 'The coded encounter becomes a claim, is scrubbed, and is routed to the right payer.',
    tab: 'claim',
    link: 'Follow one claim through every stage',
    layers: [
      { title: 'Claim generation', text: 'The billing system builds a professional claim or an institutional one.', language: 'CMS-1500, UB-04' },
      { title: 'Scrubbing', text: 'Edits catch missing modifiers, invalid codes and payer-specific rules before the claim goes out.' },
      { title: 'Submission', text: 'Nearly every claim now leaves electronically.', language: 'X12 837P, 837I' },
      { title: 'Clearinghouse', text: 'It reformats the claim for each payer and routes it by payer ID. One connection reaches thousands of payers.' },
      { title: 'Acknowledgment', text: 'Front-end rejections come back within a day. A rejected claim was never on file with the payer, which matters for timely filing.', language: 'X12 999, 277CA' },
    ],
  },
  {
    id: 'judgment',
    name: 'Adjudication',
    who: 'Payer',
    summary: 'The payer decides whether the claim is payable, reprices it to the contract, and divides the allowed amount between plan and member.',
    tab: 'claim',
    link: 'See the arithmetic on a claim',
    layers: [
      { title: 'Eligibility', text: 'Was the member covered on the date of service?' },
      { title: 'Benefits and edits', text: 'Is the service covered and authorized? Code edits bundle services that should not be billed apart.' },
      { title: 'Grouping', text: 'Inpatient stays and hospital outpatient services are assigned to payment groups.', language: 'MS-DRG, APC' },
      { title: 'Pricing', text: 'The claim is repriced to the contract: a percent of Medicare, a percent of charges, a case rate or a per diem. The result is the allowed amount.' },
      { title: 'Member cost share', text: 'Accumulators decide how much of the allowed amount is deductible, coinsurance or copay.' },
      { title: 'Payment', text: 'The plan pays the balance. Most clean claims auto-adjudicate with no person involved.' },
    ],
  },
  {
    id: 'settlement',
    name: 'Remittance and collection',
    who: 'Payer, provider, patient',
    summary: 'The same result is reported three ways, and the money moves.',
    tab: 'price',
    link: 'Compare what price means to each party',
    layers: [
      { title: 'ERA and EFT', text: 'Payment arrives with a remittance advice that explains every adjustment by group and reason code.', language: 'X12 835' },
      { title: 'Payment posting', text: 'The payment, the contractual adjustment and the patient balance are posted to the account.' },
      { title: 'EOB', text: 'The member receives an explanation of benefits. It says it is not a bill and is widely read as one.' },
      { title: 'Patient statement', text: 'The provider bills the patient responsibility. Collection rates fall as balances rise.' },
      { title: 'Margin', text: 'Finance compares what was collected with what the service cost to produce.' },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy benefit',
    who: 'Prescriber, pharmacy, PBM',
    summary: 'Prescriptions run on separate rails, with their own standards, and settle in seconds.',
    tab: 'claim',
    link: 'Follow a prescription claim',
    layers: [
      { title: 'E-prescribing', text: 'The prescription goes from the EHR to the pharmacy.', language: 'NCPDP SCRIPT' },
      { title: 'Claim at the counter', text: 'The pharmacy submits by BIN, PCN and group while the patient waits.', language: 'NCPDP D.0, NDC' },
      { title: 'Switch', text: 'A switch routes the claim to the PBM in under a second.' },
      { title: 'PBM adjudication', text: 'Formulary tier, network price and copay come back in seconds.' },
      { title: 'Point of sale', text: 'The patient pays and leaves. No EOB follows.' },
      { title: 'Rebates', text: 'Manufacturers pay rebates on brand drugs months later, to the PBM and the plan sponsor.' },
    ],
  },
];

export interface HistoryEntry {
  year: string;
  title: string;
  text: string;
}

/** How the arrangement was assembled, one decision at a time. */
export const HISTORY: HistoryEntry[] = [
  {
    year: '1929',
    title: 'A hospital’s collections problem',
    text: 'American health insurance began in a ledger of unpaid bills. Justin Ford Kimball, an administrator at Baylor University in Dallas, went through the hospital’s receivables and found that many of the debtors were schoolteachers. He offered the teachers prepaid hospital care for fifty cents a month, and more than 1,300 enrolled. The plan existed to keep a hospital solvent. Other hospitals had the same empty beds during the Depression, copied it, and called the result Blue Cross.',
  },
  {
    year: '1943',
    title: 'An accident of wartime',
    text: 'Wage controls during the Second World War stopped employers from competing for workers with pay. Benefits were treated more leniently, so employers competed with health coverage instead. The tax treatment followed, and in 1954 Congress wrote the exclusion for employer-paid premiums into the Internal Revenue Code. No legislature ever decided that Americans should get insurance through their jobs. A wartime workaround and a tax rule settled the question.',
  },
  {
    year: '1965',
    title: 'Paying what was charged',
    text: 'Medicare needed hospitals and physicians to participate, and it paid for their cooperation. Hospitals would be reimbursed their costs. Physicians would be paid their usual, customary and reasonable charges. Blue Cross plans and commercial carriers were hired to process the claims. The terms rewarded higher costs and higher charges, and both rose. The chargemaster, until then a price list, became a document worth managing.',
  },
  {
    year: '1974',
    title: 'The employer becomes the insurer',
    text: 'ERISA was written to protect pensions. It also exempted self-funded employer health plans from state insurance regulation, and large employers noticed. About two of every three covered workers are now in plans where the employer pays the claims and a carrier or TPA administers them for a fee. The member’s card carries the carrier’s logo either way.',
  },
  {
    year: '1983',
    title: 'Prices by formula',
    text: 'Medicare gave up on cost reimbursement in 1983 and began paying hospitals a fixed amount per admission. The amount depended on the diagnosis-related group, a classification that Robert Fetter and John Thompson had built at Yale to study hospital output and that New Jersey had tried first. Physician payment followed in 1992, with a fee schedule built on William Hsiao’s relative value scale. Commercial payers never built an equivalent. They borrowed Medicare’s, which is why so many private contracts are written as a percentage of a public fee schedule.',
  },
  {
    year: '1990s',
    title: 'The discount',
    text: 'Managed care pursued savings another way. PPOs and HMOs offered providers patient volume in exchange for discounts off billed charges, and hospitals raised their charges to protect revenue. After thirty years of this, the charge on a claim has little to do with what anyone pays. RAND’s studies of employer claims put commercial hospital prices at about two and a half times Medicare rates. The difference between the charge and the allowed amount is booked as a contractual adjustment, and on most hospital claims it is the largest figure on the page.',
  },
  {
    year: '1996',
    title: 'Standard transactions',
    text: 'HIPAA is remembered for privacy. Its administrative simplification provisions changed daily operations more: payers and providers had to exchange eligibility, claims and remittances in standard X12 formats, using named code sets, CPT among them. Clearinghouses grew to do the translating. How much traffic they carry became obvious in February 2024, when a ransomware attack took Change Healthcare offline and practices across the country went weeks without payment.',
  },
];
