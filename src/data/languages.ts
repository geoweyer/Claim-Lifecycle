// The administrative code sets and message standards that carry a clinical event
// through the payment system, described the way a field guide describes languages.

export interface Language {
  id: string;
  name: string;
  /** What kind of statement the language makes. */
  says: string;
  keeper: string;
  /** How it came to exist, and why that still shows. */
  origin: string;
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
    keeper: 'The National Center for Health Statistics, part of the CDC, maintains the US clinical modification of the World Health Organization’s ICD-10. Updates take effect each October 1.',
    origin: 'The classification descends from a list of causes of death that Jacques Bertillon presented in 1893. It was built to count the dead and was put to work in billing much later. The WHO finished ICD-10 in 1990. American payers kept using ICD-9 until October 2015, after several postponements.',
    speakers: 'Everyone who touches a claim. It is the one code set shared by physicians, hospitals and payers.',
    grammar: 'Three to seven characters, a letter first, with a decimal after the third. Each added character narrows the meaning: laterality, cause, episode of care. The 2026 file holds 74,719 codes.',
    role: 'It establishes medical necessity. Payers test whether the diagnosis supports the procedure. The principal diagnosis and any CC or MCC drive DRG assignment, and diagnoses feed risk adjustment.',
    inEpisode: 'The codes track the workup. An abnormal finding at the preventive visit becomes chest pain at the cardiologist, an abnormal stress study, and then coronary artery disease with angina.',
    rights: 'Public domain in the United States.',
    examples: [
      { code: 'R07.9', text: 'Chest pain, unspecified' },
      { code: 'I25.119', text: 'Atherosclerotic heart disease of native coronary artery with unspecified angina pectoris' },
      { code: 'Z95.1', text: 'Presence of aortocoronary bypass graft' },
    ],
  },
  {
    id: 'icd10pcs',
    name: 'ICD-10-PCS',
    says: 'What the hospital did to an inpatient',
    keeper: 'CMS, which updates it each October 1.',
    origin: 'CMS commissioned it from 3M in the 1990s to replace the procedure volume of ICD-9, which had run out of room. The designers wanted codes that could be assembled from parts, so that a new operation would not need a new entry in a list.',
    speakers: 'Hospital inpatient coders. Physicians do not bill in it and outpatient departments do not use it, so the surgeon and the hospital describe the same operation in two unrelated systems.',
    grammar: 'Always seven characters. Each position is a fixed axis: section, body system, root operation, body part, approach, device, qualifier. There is no decimal and no room for eponyms. The 2026 file holds 79,115 valid codes.',
    role: 'With the diagnoses, it determines the MS-DRG.',
    inEpisode: 'It appears once, on the UB-04 for the CABG admission.',
    rights: 'Public domain.',
    examples: [
      { code: '021109W', text: 'Bypass coronary artery, two arteries from aorta with autologous venous tissue, open approach' },
    ],
  },
  {
    id: 'cpt',
    name: 'CPT',
    says: 'What a physician or outpatient provider did',
    keeper: 'The American Medical Association. Its CPT Editorial Panel adds and revises codes each year, and the AMA’s RUC recommends the relative values that Medicare uses to price them.',
    origin: 'The AMA published the first edition in 1966, the year Medicare began paying claims. In 1983 the Health Care Financing Administration adopted CPT for Part B and agreed to use no competing system. HIPAA later named it a national standard. A professional association has owned the required vocabulary of physician billing ever since, and licenses it.',
    speakers: 'Physicians and other clinicians, hospital outpatient departments, ASCs, and every payer that pays them.',
    grammar: 'Five characters since 1970, with two-character modifiers that change the meaning: laterality, the professional or technical component, a separate service on the same day.',
    role: 'It is the unit of payment for professional services. Each code carries work, practice expense and malpractice RVUs, and a conversion factor turns the total into dollars.',
    inEpisode: 'Every professional claim in the episode: the office visits, the EKG, the stress echo read, the cath, the surgeon and the anesthesiologist.',
    rights: 'Copyrighted by the AMA. Federal rules require its use, and displaying the codes or descriptors requires a paid licence. This site shows ##### in their place.',
    locked: true,
  },
  {
    id: 'hcpcs',
    name: 'HCPCS Level II',
    says: 'Supplies, drugs, equipment, and services CPT does not name',
    keeper: 'CMS, with quarterly updates. CPT is formally HCPCS Level I.',
    origin: 'The Health Care Financing Administration created HCPCS in 1978 because CPT described what physicians do and had nothing to say about wheelchairs, ambulance trips or injectable drugs. Medicare also needed a place to define services on its own schedule, without waiting for the AMA.',
    speakers: 'DME suppliers, ambulance companies, hospital outpatient departments, and practices that buy and bill drugs.',
    grammar: 'One letter and four digits. The letter marks the family: J for injectable drugs, A for ambulance and supplies, E for durable equipment, G for services Medicare defines itself.',
    role: 'It lets a claim bill a product or a program-specific service, with units.',
    inEpisode: 'Absent from the admission, where supplies and drugs are packaged into the DRG. It would identify the contrast at the ASC or a drug given in clinic.',
    rights: 'Public domain, except the dental D codes, which belong to the American Dental Association.',
    examples: [{ code: 'G0463', text: 'Hospital outpatient clinic visit' }],
  },
  {
    id: 'msdrg',
    name: 'MS-DRG',
    says: 'What kind of inpatient stay this was',
    keeper: 'CMS, which recalibrates the weights every fiscal year.',
    origin: 'Robert Fetter and John Thompson developed DRGs at Yale in the 1970s as a way to define a hospital’s products. New Jersey paid hospitals by DRG from 1980, and Medicare followed in 1983. The severity-adjusted MS-DRGs replaced the original set in October 2007.',
    speakers: 'Nobody writes one. Grouper software reads the diagnoses, procedures and discharge status on the claim and returns a group.',
    grammar: 'A three-digit number for one of 772 groups in fiscal 2026. Related groups come in tiers: with MCC, with CC, and without.',
    role: 'Each group has a relative weight. Weight times the hospital’s base rate is the payment for the stay, whatever its length.',
    inEpisode: 'The CABG admission groups to MS-DRG 236. Its weight of 4.1888 times a base rate of $7,276.76 gives the $30,480.89 Medicare amount used here. The ICU days are inside that figure.',
    rights: 'Public domain. Some commercial and Medicaid contracts use APR-DRGs instead, which are proprietary.',
    examples: [{ code: '236', text: 'Coronary bypass without cardiac catheterization without MCC' }],
  },
  {
    id: 'apc',
    name: 'APC',
    says: 'What kind of hospital outpatient service this was',
    keeper: 'CMS, which sets rates each January and adjusts them quarterly.',
    origin: 'Hospital outpatient care stayed on cost-based payment for seventeen years after inpatient care left it. Congress ordered a prospective system in the Balanced Budget Act of 1997, and OPPS went live in August 2000.',
    speakers: 'It is derived, like a DRG. Each HCPCS code maps to an APC.',
    grammar: 'A four-digit group, plus a status indicator on every HCPCS code that says whether the service is paid separately or packaged.',
    role: 'It sets the facility payment for outpatient services. ASC rates are derived from the same relative weights with a lower conversion factor, which is the source of the site-of-service differential.',
    inEpisode: 'It prices the hospital’s facility fee for the stress echo and each cardiac rehab session, and stands behind the ASC rate for the cath.',
    rights: 'Public domain.',
    examples: [{ code: '5524', text: 'Level 4 imaging without contrast, which includes the stress echo' }],
  },
  {
    id: 'x12',
    name: 'ASC X12 EDI',
    says: 'The envelope and syntax that carry everything else',
    keeper: 'X12, a standards committee chartered by ANSI in 1979. HIPAA requires version 5010 of its health care transactions. The ASC here stands for Accredited Standards Committee.',
    origin: 'X12 was created to standardize business documents such as purchase orders and invoices across industries. Health care took the format as it found it. A claim therefore has the structure of a commercial invoice, with loops and segments in place of boxes on a form.',
    speakers: 'Practice management systems, clearinghouses and payer claim systems. People read it only when something breaks.',
    grammar: 'Segments of elements separated by asterisks and closed with a tilde, nested in loops. Transactions are known by number: 270/271 for eligibility, 278 for authorization, 837 for the claim, 835 for the remittance, 834 for enrollment, 820 for premium.',
    role: 'It is how payment is requested and how the answer returns. The 835 carries claim adjustment group and reason codes that say who absorbs each dollar not paid.',
    inEpisode: 'Every medical claim here goes out as an 837 and is answered by an 835. The diagnosis and procedure codes travel inside.',
    rights: 'The standards and implementation guides are copyrighted and sold by X12.',
    examples: [
      { code: 'CO-45', text: 'Charge exceeds fee schedule or contracted amount: a contractual adjustment' },
      { code: 'PR-1', text: 'Deductible amount: patient responsibility' },
      { code: 'PR-2', text: 'Coinsurance amount: patient responsibility' },
    ],
  },
  {
    id: 'ncpdp',
    name: 'NCPDP',
    says: 'A prescription claim, settled while the patient waits',
    keeper: 'The National Council for Prescription Drug Programs, founded in 1977. Its Telecommunication Standard, version D.0, carries pharmacy claims. SCRIPT carries electronic prescriptions.',
    origin: 'Drug benefit cards appeared in the late 1960s, and the companies that processed those paper claims became the first PBMs. Pharmacies moved to electronic claims in the 1980s and to real-time adjudication soon after. Medical claims have never caught up.',
    speakers: 'Pharmacies, switches and PBMs.',
    grammar: 'Compact field-coded messages, routed by the BIN, PCN and group printed on the member’s card.',
    role: 'It returns the price, the plan payment and the copay in seconds.',
    inEpisode: 'Each prescription filled after the cardiology visit and at discharge.',
    rights: 'Copyrighted by NCPDP and available to members.',
  },
  {
    id: 'ndc',
    name: 'NDC',
    says: 'Exactly which drug product this is',
    keeper: 'The FDA, which publishes the directory.',
    origin: 'The FDA started the directory in 1969 to identify drugs for a planned Medicare outpatient benefit. The Drug Listing Act of 1972 made listing mandatory.',
    speakers: 'Manufacturers, wholesalers, pharmacies and PBMs.',
    grammar: 'Three segments: labeler, product, package. Ten digits on the label, padded to eleven on a claim. A rule finalized in 2026 moves every code to a uniform twelve digits in 2033.',
    role: 'It is the item being priced on a pharmacy claim, and the key that ties a rebate to a manufacturer.',
    inEpisode: 'On every pharmacy claim. The same statin from two labelers has two codes and two prices.',
    rights: 'Public domain.',
    examples: [{ code: '00000-0000-00', text: 'Labeler, product, package (placeholder digits)' }],
  },
  {
    id: 'loinc',
    name: 'LOINC',
    says: 'Which question a lab test or clinical observation asked',
    keeper: 'The Regenstrief Institute in Indianapolis.',
    origin: 'Clement McDonald and colleagues began it in 1994. Laboratories had started sending results electronically, each with its own local test codes, and no receiving system could tell that two labs meant the same test.',
    speakers: 'Laboratories, EHRs and public health agencies.',
    grammar: 'A number with a check digit that stands for a six-part name: component, property, timing, system, scale and method. The February 2026 release has 109,325 terms.',
    role: 'It is not on the claim. It reaches payment indirectly, through claim attachments, prior authorization documentation and quality measures.',
    inEpisode: 'The lipid panel before surgery and the troponins after it.',
    rights: 'Copyrighted by Regenstrief and free to use under its licence.',
    examples: [
      { code: '2093-3', text: 'Cholesterol [Mass/volume] in Serum or Plasma' },
      { code: '10839-9', text: 'Troponin I.cardiac [Mass/volume] in Serum or Plasma' },
    ],
  },
  {
    id: 'minor',
    name: 'Smaller code sets',
    says: 'Where, who, and why not',
    keeper: 'The National Uniform Billing Committee for revenue codes and type of bill. CMS for place of service and the NPI. A standing committee for claim adjustment reason codes.',
    origin: 'The NUBC was formed in 1975 to get hospitals and payers onto one bill. Three versions have followed: the UB-82, the UB-92 and the UB-04. The NPI replaced a different provider number for every payer in 2007.',
    speakers: 'Billing systems and payers.',
    grammar: 'Short numeric codes. A revenue code names the hospital department behind a charge. A place-of-service code names the setting. A ten-digit NPI names the clinician or organization.',
    role: 'A claim cannot be priced without them. Place of service changes the fee, the NPI decides network status, and the reason codes assign each unpaid dollar to the provider or the patient.',
    inEpisode: 'On every claim. Place of service moves from 11 to 22 to 24 to 21 as the workup escalates.',
    rights: 'Mixed. Place-of-service codes and NPIs are public. The UB-04 manual that defines revenue codes is copyrighted by the American Hospital Association.',
    examples: [
      { code: '11', text: 'Office' },
      { code: '22', text: 'On-campus outpatient hospital' },
      { code: '24', text: 'Ambulatory surgical center' },
      { code: '21', text: 'Inpatient hospital' },
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
  { char: 'W', axis: 'Qualifier', meaning: 'Aorta' },
];
