import type { TabId } from '../state';

// The payment system drawn as six parts. Each part pulls apart into the steps inside it.

export interface AnatomyLayer {
  title: string;
  text: string;
  /** The code set, form or message used at this step, if any. */
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
    name: 'The promise',
    who: 'Employer, employees, insurer',
    summary: 'Before anyone is sick, money is pooled and a contract decides who will pay for what.',
    tab: 'money',
    link: 'See who funds the plan and who is at risk',
    layers: [
      { title: 'The employer chooses a plan', text: 'It picks the benefits and decides whether to buy insurance or pay claims itself.' },
      { title: 'The price of coverage is set', text: 'A premium, or a budget if self-funded, is split between employer and employee.' },
      { title: 'Members are enrolled', text: 'The employer tells the plan who is covered.', language: 'X12 834' },
      { title: 'Money goes in every month', text: 'Premium is paid whether or not anyone gets care.', language: 'X12 820' },
      { title: 'The patient’s share is written down', text: 'Deductible, coinsurance, copays and the out-of-pocket maximum.' },
      { title: 'Risk is assigned', text: 'The insurer carries it, or the employer does and buys stop-loss for the worst cases.' },
    ],
  },
  {
    id: 'care',
    name: 'The encounter',
    who: 'Patient, clinicians, coders',
    summary: 'Care happens in plain speech. Then it is rewritten into codes and given a list price.',
    tab: 'episode',
    link: 'Walk through the eight encounters',
    layers: [
      { title: 'Coverage is checked', text: 'The front desk asks the plan whether the patient is covered and what they will owe.', language: 'X12 270 and 271' },
      { title: 'Permission is sought', text: 'Costly tests and surgery need the plan’s approval first.', language: 'X12 278' },
      { title: 'Care is given', text: 'A visit, a test, an operation.' },
      { title: 'It is written in the chart', text: 'The clinician’s note is the only record of what happened.' },
      { title: 'The note becomes codes', text: 'Why it was done, and what was done.', language: 'ICD-10, CPT, HCPCS' },
      { title: 'A charge is attached', text: 'Each code picks up a list price from the provider’s price list.' },
    ],
  },
  {
    id: 'claim',
    name: 'The message',
    who: 'Billing office, clearinghouse',
    summary: 'The coded visit is packed into a claim and carried to the right payer.',
    tab: 'claim',
    link: 'Follow one claim through every stage',
    layers: [
      { title: 'The claim is assembled', text: 'Patient, provider, diagnoses, procedures and charges on one form.', language: 'CMS-1500 or UB-04' },
      { title: 'It is sent electronically', text: 'The form becomes a structured message.', language: 'X12 837' },
      { title: 'A clearinghouse checks it', text: 'Missing fields and invalid codes are caught before the payer sees them.' },
      { title: 'It is translated and routed', text: 'One connection reaches thousands of payers.' },
      { title: 'Receipt is confirmed', text: 'Accepted claims go on. Rejected ones come back to be fixed.', language: 'X12 999 and 277CA' },
    ],
  },
  {
    id: 'judgment',
    name: 'The judgment',
    who: 'Health plan',
    summary: 'The plan decides whether to pay, how much the care is worth, and how to split the bill.',
    tab: 'claim',
    link: 'See the arithmetic on a real claim',
    layers: [
      { title: 'Is this person covered?', text: 'Eligibility on the date of service.' },
      { title: 'Is this service covered?', text: 'Benefits, authorization, duplicates and bundling.' },
      { title: 'What kind of case is it?', text: 'Hospital stays and outpatient services are sorted into payment groups.', language: 'MS-DRG, APC' },
      { title: 'What is it worth?', text: 'The contract sets the allowed amount, often as a percent of Medicare or of charges.' },
      { title: 'What does the patient owe?', text: 'The running deductible and out-of-pocket totals decide.' },
      { title: 'The plan pays the rest', text: 'The difference between the charge and the allowed amount is written off.' },
    ],
  },
  {
    id: 'settlement',
    name: 'The settlement',
    who: 'Plan, provider, patient',
    summary: 'Everyone is told the result in their own terms, and the money moves.',
    tab: 'price',
    link: 'Compare what price means to each party',
    layers: [
      { title: 'The provider is told and paid', text: 'A payment arrives with a line-by-line explanation.', language: 'X12 835' },
      { title: 'The patient is told', text: 'An explanation of benefits shows the same numbers in plainer words.' },
      { title: 'The patient is billed', text: 'Only for the share the plan assigned to them.' },
      { title: 'The patient pays, or does not', text: 'Some balances are never collected.' },
      { title: 'The provider counts the result', text: 'What was collected, against what the care cost to deliver.' },
    ],
  },
  {
    id: 'pharmacy',
    name: 'The pharmacy lane',
    who: 'Prescriber, pharmacy, benefit manager',
    summary: 'Prescriptions take a separate, much faster road with its own language.',
    tab: 'claim',
    link: 'Follow a prescription claim',
    layers: [
      { title: 'The prescription is sent', text: 'From the prescriber’s computer to the pharmacy.', language: 'NCPDP SCRIPT' },
      { title: 'The pharmacy files a claim', text: 'While the patient waits, naming the exact product.', language: 'NCPDP, NDC' },
      { title: 'A switch routes it', text: 'To the plan’s pharmacy benefit manager, in under a second.' },
      { title: 'The benefit manager decides', text: 'Tier, price and the patient’s copay come back in seconds.' },
      { title: 'The patient pays at pickup', text: 'There is no bill later and no explanation of benefits at the counter.' },
      { title: 'Rebates settle months later', text: 'Drug makers pay rebates on brand drugs that the patient never sees.' },
    ],
  },
];
