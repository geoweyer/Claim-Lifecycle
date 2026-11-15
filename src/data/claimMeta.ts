// Details that appear on the claim but do not affect the math. People, organizations
// and identifiers are fictional. Diagnosis codes (ICD-10-CM), inpatient procedure codes
// (ICD-10-PCS) and the MS-DRG are public US government code sets and are shown as
// illustrations; CPT procedure codes are withheld.

export const CAST = {
  patient: 'Jordan Avery',
  memberId: 'HMX 4471 0926',
  group: 'Northfield Manufacturing, group 0048812',
  payer: 'Harbor Mutual Health Plan',
  plan: 'Harbor Mutual PPO 2000',
  clearinghouses: 'Change Healthcare (part of Optum), Availity or Waystar',
  pbm: 'the plan’s PBM',
  note: 'The patient, employer, health plan and providers are fictional.',
};

export interface Diagnosis {
  code: string;
  text: string;
}

export interface ClaimMeta {
  provider: string;
  date: string;
  /** CMS place-of-service description. */
  place: string;
  diagnoses: Diagnosis[];
  priorAuth: boolean;
  /** Facility claims: how the charge splits across revenue categories. */
  revenue?: { label: string; share: number }[];
  /** Inpatient only. */
  inpatient?: { admit: string; discharge: string; procedures: Diagnosis[]; drg: string };
  units?: string;
}

const dx = {
  exam: { code: 'Z00.01', text: 'General adult medical exam with abnormal findings' },
  chestPain: { code: 'R07.9', text: 'Chest pain, unspecified' },
  abnormalEkg: { code: 'R94.31', text: 'Abnormal electrocardiogram' },
  abnormalStress: { code: 'R94.39', text: 'Abnormal result of other cardiovascular function study' },
  cadAngina: { code: 'I25.119', text: 'Coronary artery disease of native artery with unspecified angina' },
  cad: { code: 'I25.10', text: 'Coronary artery disease of native artery without angina' },
  bypassStatus: { code: 'Z95.1', text: 'Presence of coronary artery bypass graft' },
  aftercare: { code: 'Z48.812', text: 'Surgical aftercare following surgery on the circulatory system' },
};

const office = 'Office (11)';
const hospitalOutpatient = 'On-campus outpatient hospital (22)';
const inpatientHospital = 'Inpatient hospital (21)';
const surgeryCenter = 'Ambulatory surgical center (24)';
const cabgDx = [dx.cadAngina];

export const CLAIM_META: Record<string, ClaimMeta> = {
  'pcp-preventive': { provider: 'Maple Street Primary Care', date: 'January 12, 2026', place: office, diagnoses: [dx.exam], priorAuth: false },
  'cards-new': { provider: 'Lakeside Cardiology Associates', date: 'January 26, 2026', place: office, diagnoses: [dx.chestPain], priorAuth: false },
  ekg: { provider: 'Lakeside Cardiology Associates', date: 'January 26, 2026', place: office, diagnoses: [dx.chestPain], priorAuth: false },
  'echo-facility': {
    provider: 'St. Brendan Medical Center', date: 'February 9, 2026', place: hospitalOutpatient, diagnoses: [dx.chestPain, dx.abnormalEkg], priorAuth: true,
    revenue: [{ label: 'Echocardiography', share: 0.85 }, { label: 'Medical supplies', share: 0.1 }, { label: 'Pharmacy', share: 0.05 }],
  },
  'echo-pro': { provider: 'Lakeside Cardiology Associates', date: 'February 9, 2026', place: hospitalOutpatient, diagnoses: [dx.chestPain, dx.abnormalEkg], priorAuth: false },
  'cath-facility': {
    provider: 'Riverbend Surgery Center', date: 'February 23, 2026', place: surgeryCenter, diagnoses: [dx.abnormalStress, dx.chestPain], priorAuth: true,
    revenue: [{ label: 'Cardiac catheterization laboratory', share: 0.7 }, { label: 'Medical supplies and contrast', share: 0.2 }, { label: 'Recovery room', share: 0.1 }],
  },
  'cath-pro': { provider: 'Lakeside Cardiology Associates', date: 'February 23, 2026', place: surgeryCenter, diagnoses: [dx.abnormalStress, dx.chestPain], priorAuth: false },
  'cabg-facility': {
    provider: 'St. Brendan Medical Center', date: 'March 9 to 15, 2026', place: inpatientHospital, diagnoses: cabgDx, priorAuth: true,
    revenue: [
      { label: 'Operating room', share: 0.3 },
      { label: 'Medical and surgical supplies', share: 0.2 },
      { label: 'Intensive care', share: 0.15 },
      { label: 'Room and board', share: 0.1 },
      { label: 'Pharmacy', share: 0.08 },
      { label: 'Heart-lung bypass and cardiology', share: 0.05 },
      { label: 'Laboratory', share: 0.05 },
      { label: 'Anesthesia supplies', share: 0.04 },
      { label: 'Respiratory and other services', share: 0.03 },
    ],
    inpatient: {
      admit: 'March 9, 2026',
      discharge: 'March 15, 2026',
      procedures: [
        { code: '02100Z9', text: 'Bypass of one coronary artery from the left internal mammary artery, open' },
        { code: '021109W', text: 'Bypass of two coronary arteries from the aorta using the patient’s own vein, open' },
        { code: '5A1221Z', text: 'Heart-lung bypass, continuous' },
      ],
      drg: 'MS-DRG 236: coronary bypass without cardiac catheterization, without major complications',
    },
  },
  'cabg-surgeon': { provider: 'Tri-County Cardiothoracic Surgeons', date: 'March 9, 2026', place: inpatientHospital, diagnoses: cabgDx, priorAuth: false },
  'cabg-anesthesia': { provider: 'Brendan Anesthesia Partners', date: 'March 9, 2026', place: inpatientHospital, diagnoses: cabgDx, priorAuth: false, units: '300 minutes' },
  'cabg-other-pro': { provider: 'Several physician groups', date: 'March 9 to 15, 2026', place: inpatientHospital, diagnoses: cabgDx, priorAuth: false },
  rehab: {
    provider: 'St. Brendan Medical Center', date: 'April 13 to July 3, 2026', place: hospitalOutpatient, diagnoses: [dx.bypassStatus, dx.cad], priorAuth: true, units: '36 sessions',
    revenue: [{ label: 'Cardiac rehabilitation', share: 1 }],
  },
  'cards-followup': { provider: 'Lakeside Cardiology Associates', date: 'April 20, 2026', place: office, diagnoses: [dx.cad, dx.bypassStatus], priorAuth: false },
  'surgeon-postop': { provider: 'Tri-County Cardiothoracic Surgeons', date: 'May 4, 2026', place: office, diagnoses: [dx.aftercare], priorAuth: false },
};
