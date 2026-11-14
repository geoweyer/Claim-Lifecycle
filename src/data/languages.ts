// The administrative code sets and message standards that carry a clinical event
// through the payment system, described the way a field guide describes languages.

export interface Language {
  id: string;
  name: string;
  /** What kind of statement the language makes. */
  says: string;
  keeper: string;
  speakers: string;
  grammar: string;
  role: string;
  inEpisode: string;
  rights: string;
  /** True when the codes themselves cannot be displayed without a paid licence. */
  locked?: boolean;
  examples?: { code: string; text: string }[];
}

export const LANGUAGES: Language[] = [
  {
    id: 'icd10cm',
    name: 'ICD-10-CM',
    says: 'Why the patient was seen',
    keeper: 'The National Center for Health Statistics at the CDC, adapted from the World Health Organization’s ICD-10. Used in the United States since October 2015 and revised every October.',
    speakers: 'Every clinician, coder and payer. It is on every medical claim, whoever sends it.',
    grammar: 'Three to seven characters, a letter first, with a decimal point after the third. Each added character narrows the meaning: the site, the cause, the encounter. More than 70,000 codes.',
    role: 'It justifies the service. Payers test whether the diagnosis supports the procedure, and inpatient payment groups and risk scores are computed from it.',
    inEpisode: 'It changes as the story does: an abnormal finding at the check-up, chest pain at the cardiologist, an abnormal stress test, then coronary artery disease.',
    rights: 'Free to use in the United States.',
    examples: [
      { code: 'R07.9', text: 'Chest pain, unspecified' },
      { code: 'I25.119', text: 'Coronary artery disease of native artery with unspecified angina' },
      { code: 'Z95.1', text: 'Presence of coronary artery bypass graft' },
    ],
  },
  {
    id: 'icd10pcs',
    name: 'ICD-10-PCS',
    says: 'What the hospital did to an inpatient',
    keeper: 'The Centers for Medicare & Medicaid Services, which revises it every October.',
    speakers: 'Hospital inpatient coders only. Physicians do not bill in it, and outpatient departments do not use it.',
    grammar: 'Always seven characters, and each position is a fixed axis: section, body system, operation, body part, approach, device, qualifier. A code is built, not looked up. Nearly 80,000 are possible.',
    role: 'Together with the diagnoses, it decides which payment group the admission falls into.',
    inEpisode: 'Spoken once, on the hospital claim for the bypass admission. The surgeon describes the same operation in a different language.',
    rights: 'Free to use.',
    examples: [
      { code: '021109W', text: 'Bypass of two coronary arteries from the aorta using the patient’s own vein, open' },
    ],
  },
  {
    id: 'cpt',
    name: 'CPT',
    says: 'What a physician or outpatient provider did',
    keeper: 'The American Medical Association, which has published it since 1966. An AMA panel adds and revises codes each year, and an AMA committee recommends the relative values Medicare uses to price them.',
    speakers: 'Physicians, other clinicians, outpatient departments and surgery centers, and every payer that pays them.',
    grammar: 'Five characters since 1970, usually all digits, with two-character modifiers that change the meaning: which side, which component, a separate service on the same day.',
    role: 'It is the unit of payment for professional services. Each code carries relative values that a fee schedule turns into dollars.',
    inEpisode: 'On every professional claim here: the office visits, the EKG, the reading of the stress echo, the catheterization, the surgeon, the anesthesiologist.',
    rights: 'Copyrighted by the American Medical Association. Federal rules require its use, yet displaying the codes or their descriptions requires a paid licence, so this site shows ##### in their place.',
    locked: true,
  },
  {
    id: 'hcpcs',
    name: 'HCPCS Level II',
    says: 'Things and exceptions: supplies, drugs, equipment, and services CPT does not name',
    keeper: 'The Centers for Medicare & Medicaid Services, which updates it quarterly. CPT is formally HCPCS Level I.',
    speakers: 'Suppliers, ambulance companies, outpatient departments, and physicians who administer drugs.',
    grammar: 'One letter and four digits. The letter is the family: J for injected drugs, A for ambulance and supplies, E for equipment, G for services Medicare defines for itself.',
    role: 'It lets a claim bill for a product or a program-specific service, with units.',
    inEpisode: 'Quiet during the admission, because inpatient supplies and drugs are folded into one payment. It would name the contrast dye at the surgery center and a drug given in a clinic.',
    rights: 'Free to use, except the dental D codes, which belong to the American Dental Association.',
    examples: [{ code: 'G0463', text: 'Hospital outpatient clinic visit' }],
  },
  {
    id: 'msdrg',
    name: 'MS-DRG',
    says: 'What kind of hospital stay this was',
    keeper: 'The Centers for Medicare & Medicaid Services. Medicare has paid hospitals by diagnosis-related group since 1983; the current severity-adjusted version dates from 2007 and is revised every October.',
    speakers: 'No person writes it. Grouper software reads the diagnoses, procedures and discharge status on the claim and emits one group.',
    grammar: 'A three-digit number for one of roughly 770 groups. Related groups come in tiers by how sick the patient was.',
    role: 'Each group has a relative weight. Weight times the hospital’s base rate is the payment for the whole stay, however long it lasts.',
    inEpisode: 'The bypass admission is group 236. Its weight of 4.1888 times a base rate of $7,276.76 gives the $30,480.89 Medicare benchmark used on this site. The intensive care days are inside that amount.',
    rights: 'Free to use. Some commercial contracts use a different, proprietary grouper instead.',
    examples: [{ code: '236', text: 'Coronary bypass without cardiac catheterization, without major complications' }],
  },
  {
    id: 'apc',
    name: 'APC',
    says: 'What kind of hospital outpatient service this was',
    keeper: 'The Centers for Medicare & Medicaid Services, which has used it for hospital outpatient payment since 2000 and resets rates each January.',
    speakers: 'Like the inpatient groups, it is computed, not written. Each procedure code maps to a payment group.',
    grammar: 'A four-digit group number, plus a status indicator on every procedure code saying whether it is paid separately or packaged into something else.',
    role: 'It sets the facility payment for outpatient care. Surgery center rates are derived from the same weights at a lower rate, which is why the same procedure costs less there.',
    inEpisode: 'It prices the hospital’s fee for the stress echo and each cardiac rehabilitation session, and stands behind the surgery center’s fee for the catheterization.',
    rights: 'Free to use.',
    examples: [{ code: '5524', text: 'Level 4 imaging without contrast, the group for the stress echo' }],
  },
  {
    id: 'x12',
    name: 'ASC X12 EDI',
    says: 'The grammar and envelope that carry everything else',
    keeper: 'X12, a standards body chartered in 1979. Federal rules require version 5010 of its health care transactions. The name stands for Accredited Standards Committee, not ambulatory surgery center.',
    speakers: 'Computers: billing systems, clearinghouses and payer claim systems.',
    grammar: 'Segments of data separated by asterisks and ended with a tilde, nested in loops. Each transaction has a number: 270 and 271 for eligibility, 278 for authorization, 837 for the claim, 835 for the payment, 834 for enrollment, 820 for premium.',
    role: 'It is how money is asked for and how the answer comes back. The payment message has its own sub-dialect of adjustment codes that say who absorbs each dollar not paid.',
    inEpisode: 'Every medical claim in the episode travels as an 837 and is answered by an 835. The diagnosis and procedure codes ride inside it.',
    rights: 'The standards and their implementation guides are copyrighted and sold by X12. Describing the transactions is free.',
    examples: [
      { code: 'CO-45', text: 'Charge exceeds the contract rate: the provider writes it off' },
      { code: 'PR-1', text: 'Deductible: the patient owes it' },
      { code: 'PR-2', text: 'Coinsurance: the patient owes it' },
    ],
  },
  {
    id: 'ncpdp',
    name: 'NCPDP',
    says: 'A prescription claim, asked and answered while the patient waits',
    keeper: 'The National Council for Prescription Drug Programs, founded in 1977. Its Telecommunication Standard carries pharmacy claims and its SCRIPT standard carries electronic prescriptions.',
    speakers: 'Pharmacies, switches and pharmacy benefit managers.',
    grammar: 'Short field-coded messages routed by numbers printed on the member card: a BIN, a processor control number and a group.',
    role: 'It settles the price, the plan’s payment and the patient’s copay in seconds, where a medical claim takes weeks.',
    inEpisode: 'Every prescription filled at the cardiologist visit and at discharge. It is silent in the operating room.',
    rights: 'Copyrighted by NCPDP and available to its members.',
  },
  {
    id: 'ndc',
    name: 'NDC',
    says: 'Exactly which drug product this is',
    keeper: 'The Food and Drug Administration, which has listed drugs by this code since the 1970s.',
    speakers: 'Manufacturers, wholesalers, pharmacies and benefit managers.',
    grammar: 'Three segments: who makes it, which product and strength, which package. Ten digits on the label, padded to eleven for billing. A rule finalized in 2026 moves every code to a uniform twelve digits in 2033.',
    role: 'It is the thing being priced on a pharmacy claim, and it is how rebates are traced back to a manufacturer.',
    inEpisode: 'On each pharmacy claim. Two bottles of the same statin from different makers have different codes and different prices.',
    rights: 'Free to use. The FDA publishes the directory.',
    examples: [{ code: '00000-0000-00', text: 'Maker, product, package (placeholder digits)' }],
  },
  {
    id: 'loinc',
    name: 'LOINC',
    says: 'Which question a laboratory test or observation asked',
    keeper: 'The Regenstrief Institute, which has maintained it since 1994.',
    speakers: 'Laboratories, electronic health records and public health agencies.',
    grammar: 'A number with a check digit, standing for a six-part name: what was measured, in what property, when, in which specimen, on what scale, by what method. More than 100,000 terms.',
    role: 'It does not appear on the claim and moves no money directly. It reaches payment through the side door: records attached to a claim, evidence for an authorization, and quality measures.',
    inEpisode: 'The cholesterol and troponin results that led to and followed the surgery.',
    rights: 'Copyrighted by Regenstrief and free to use under its licence.',
    examples: [
      { code: '2093-3', text: 'Cholesterol in serum or plasma' },
      { code: '10839-9', text: 'Cardiac troponin I in serum or plasma' },
    ],
  },
  {
    id: 'minor',
    name: 'Smaller dialects',
    says: 'Where, who, and why not',
    keeper: 'Several bodies: a hospital billing committee for revenue codes, CMS for place-of-service codes and provider identifiers, and a standing committee for adjustment reason codes.',
    speakers: 'Billing systems and payers.',
    grammar: 'Short numeric codes. A revenue code names the hospital department behind a charge; a place-of-service code names the setting; a ten-digit National Provider Identifier names the clinician or organization.',
    role: 'A claim cannot be read without them. The setting changes the fee, the identifier decides whether the provider is in network, and the reason codes say who absorbs each unpaid dollar.',
    inEpisode: 'On every claim. The place of service moves from office to outpatient hospital to surgery center to inpatient hospital as the patient gets sicker.',
    rights: 'Mixed. Place-of-service codes and provider identifiers are free; the hospital billing manual that defines revenue codes is copyrighted.',
    examples: [
      { code: '11', text: 'Place of service: office' },
      { code: '21', text: 'Place of service: inpatient hospital' },
      { code: '24', text: 'Place of service: ambulatory surgical center' },
    ],
  },
];

/** How one seven-character ICD-10-PCS code is assembled. */
export const PCS_BREAKDOWN: { char: string; axis: string; meaning: string }[] = [
  { char: '0', axis: 'Section', meaning: 'Medical and surgical' },
  { char: '2', axis: 'Body system', meaning: 'Heart and great vessels' },
  { char: '1', axis: 'Operation', meaning: 'Bypass' },
  { char: '1', axis: 'Body part', meaning: 'Coronary artery, two arteries' },
  { char: '0', axis: 'Approach', meaning: 'Open' },
  { char: '9', axis: 'Device', meaning: 'The patient’s own vein' },
  { char: 'W', axis: 'Qualifier', meaning: 'From the aorta' },
];
