// Core domain types for the Rahbar entitlement engine.
// Facts are tri-state: true / false / null (unknown). The engine never guesses.

export type Tri = boolean | null;
export type Lang = "en" | "hi";
export type Bilingual = { en: string; hi: string };

export type IncidentType = "death" | "grievous_injury" | "minor_injury";
export type VictimRole =
  | "rider_own_vehicle"
  | "rider_not_owner"
  | "pillion"
  | "pedestrian"
  | "passenger"
  | "other";

export interface Facts {
  incidentType: IncidentType | null;
  accidentDate: string | null; // ISO yyyy-mm-dd
  state: string | null;
  firRegistered: Tri;

  offendingVehicleIdentified: Tri; // false => hit-and-run
  offendingVehicleInsured: Tri;

  victimAge: number | null;
  victimRole: VictimRole | null;
  victimIsRegisteredOwner: Tri;
  victimHeldValidDL: Tri;
  ownVehiclePolicyActive: Tri;
  ownVehicleCpaSumInsured: number | null; // rupees, e.g. 1500000

  pmsbyPremiumDebited: Tri; // ₹20 debit for the current cover year
  pmjjbyPremiumDebited: Tri; // ₹436 debit for the current cover year
  hasRupayPmjdyCard: Tri;
  lastCardTxnDate: string | null; // ISO
  pmjdyAccountOpenedAfter2018: Tri; // opened after 28-08-2018 => ₹2 lakh cover

  wasCommutingOrOnDuty: Tri;
  esicInsured: Tri;
  gigWorkerOnTrip: Tri;

  hospitalisedWithin24h: Tri;

  deceasedBankBalance: number | null; // closing balance read from the passbook
  passbookHasNominee: Tri;
}

export type FactKey = keyof Facts;

export type FactSource = "document" | "answer" | "ai" | "default";

export interface Evidence {
  docId: string;
  docLabel: string;
  quote: string;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface Provenance {
  source: FactSource;
  confirmed: boolean; // a human has confirmed it
  evidence?: Evidence;
  confidence?: number; // 0..1
}

export type ProvenanceMap = Partial<Record<FactKey, Provenance>>;

export type EntitlementId =
  | "HIT_RUN"
  | "CPA"
  | "PMSBY"
  | "PMJJBY"
  | "RUPAY"
  | "MACT"
  | "RAHAT"
  | "EMPLOYER"
  | "GIG"
  | "BANK_BALANCE";

export type Status = "eligible" | "possible" | "not_eligible";

export interface Citation {
  title: string;
  url: string;
}

export interface ConditionDef {
  id: string;
  label: Bilingual;
  facts: FactKey[];
  test: (f: Facts) => Tri;
}

export type DeadlineKind = "hard" | "soft" | "process" | "none";

export interface Deadline {
  date: string | null; // ISO, null if no fixed date
  kind: DeadlineKind;
  label: Bilingual;
}

export interface Amount {
  value: number | null; // rupees; null = varies / cannot compute
  label: Bilingual;
}

export type DocKey =
  | "FIR"
  | "DEATH_CERT"
  | "POST_MORTEM"
  | "DAR"
  | "CLAIMANT_ID"
  | "BANK_DETAILS"
  | "PASSBOOK"
  | "POLICY"
  | "DL"
  | "RC"
  | "HOSPITAL_RECORDS"
  | "DISABILITY_CERT"
  | "LEGAL_HEIR"
  | "EMPLOYER_PROOF"
  | "APP_TRIP_PROOF";

export interface RuleDef {
  id: EntitlementId;
  name: Bilingual;
  short: Bilingual;
  payer: Bilingual;
  /** Is this entitlement even relevant to the incident? (irrelevant rules are hidden) */
  relevant: (f: Facts) => boolean;
  conditions: ConditionDef[];
  amount: (f: Facts) => Amount;
  deadline: (f: Facts) => Deadline;
  documents: DocKey[];
  office: Bilingual;
  steps: Bilingual[];
  notes?: (f: Facts) => Bilingual[];
  /** Entitlements that cannot be claimed together with this one. */
  excludes?: EntitlementId[];
  citations: Citation[];
  lastVerified: string;
  /** Informational entitlements are shown but not added to the money total. */
  informational?: boolean;
}

export interface ConditionResult {
  id: string;
  label: Bilingual;
  result: Tri;
  facts: FactKey[];
  sources: FactSource[];
}

export interface EntitlementResult {
  id: EntitlementId;
  name: Bilingual;
  short: Bilingual;
  payer: Bilingual;
  status: Status;
  amount: Amount;
  deadline: Deadline;
  daysLeft: number | null;
  conditions: ConditionResult[];
  missingFacts: FactKey[];
  failedConditions: ConditionResult[];
  documents: DocKey[];
  office: Bilingual;
  steps: Bilingual[];
  notes: Bilingual[];
  citations: Citation[];
  lastVerified: string;
  informational: boolean;
  /** true when every condition that passed is backed by a document or human confirmation */
  evidenceBacked: boolean;
}

export interface EvaluationSummary {
  results: EntitlementResult[];
  confirmedTotal: number;
  possibleTotal: number;
  counts: Record<Status, number>;
}

export const EMPTY_FACTS: Facts = {
  incidentType: null,
  accidentDate: null,
  state: null,
  firRegistered: null,
  offendingVehicleIdentified: null,
  offendingVehicleInsured: null,
  victimAge: null,
  victimRole: null,
  victimIsRegisteredOwner: null,
  victimHeldValidDL: null,
  ownVehiclePolicyActive: null,
  ownVehicleCpaSumInsured: null,
  pmsbyPremiumDebited: null,
  pmjjbyPremiumDebited: null,
  hasRupayPmjdyCard: null,
  lastCardTxnDate: null,
  pmjdyAccountOpenedAfter2018: null,
  wasCommutingOrOnDuty: null,
  esicInsured: null,
  gigWorkerOnTrip: null,
  hospitalisedWithin24h: null,
  deceasedBankBalance: null,
  passbookHasNominee: null,
};
