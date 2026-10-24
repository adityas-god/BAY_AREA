export interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  command?: string | undefined;
  completed?: boolean | undefined;
}

export interface EscalationRule {
  level1: string;
  level2: string;
  slaMinutes: number;
}

export type SOPPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type SOPStatus = "ACTIVE" | "REVIEW" | "DRAFT" | "ALERT";

export interface SOP {
  id: string;
  teamId: string;
  code: string;
  title: string;
  category: string;
  priority: SOPPriority;
  status: SOPStatus;
  version: string;
  author: string;
  updatedAt: string;
  summary: string;
  triggerCondition: string;
  steps: SOPStep[];
  contentLink?: string | undefined;
  linkText?: string | undefined;
  // Isometric campus block coordinates
  gx: number;
  gy: number;
  row: number;
  load: number; // 0-100% health / compliance rate
  alert: boolean;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  description: string;
  lead: string;
  icon?: string;
  mandate?: string;
  contact?: string;
  slaMinutes?: number;
  fleets?: string[];
  headquartersZone?: string;
  categories?: string[];
}

export const SOP_COLS_PER_CAT = 3;
export const SOP_IN_CAT_STEP_X = 6.2;
export const SOP_IN_CAT_STEP_Y = 5.2;

export const CAT_PARTITION_WIDTH = 22.0;
export const CAT_PARTITION_MIN_DEPTH = 13.5;
export const CAT_SPACING_X = 26.0;
export const CAT_ROW_GAP = 5.5;
export const CAT_COLS_PER_TEAM = 2;

export const DISTRICT_COLS = 2;
export const DISTRICT_SPACING_X = 120.0; // Massive inter-district boulevards
export const DISTRICT_SPACING_Y = 150.0; // Enormous breathing room between rows
export const DISTRICT_START_GX = 24.0;
export const DISTRICT_START_GY = 14.0;

/**
 * Calculates the top-left origin coordinates of a team's town district.
 */
export function getDistrictOrigin(teamIndex: number) {
  const col = teamIndex % DISTRICT_COLS;
  const row = Math.floor(teamIndex / DISTRICT_COLS);
  return {
    baseGx: Number((DISTRICT_START_GX + col * DISTRICT_SPACING_X).toFixed(2)),
    baseGy: Number((DISTRICT_START_GY + row * DISTRICT_SPACING_Y).toFixed(2)),
    col,
    row,
  };
}

/**
 * Calculates depth of a category bay based on SOP count.
 * Expands dynamically as more SOPs are added!
 */
export function getCategoryDepth(sopCount = 0) {
  const sopRows = Math.max(1, Math.ceil(sopCount / SOP_COLS_PER_CAT));
  return Number((Math.max(CAT_PARTITION_MIN_DEPTH, 4.4 + sopRows * SOP_IN_CAT_STEP_Y + 1.2)).toFixed(2));
}

/**
 * Calculates coordinates & dimensions for a categorized partition bay inside a team's area.
 * Accurately offsets rows based on preceding category depths so bays NEVER collide.
 */
export function getCategoryPartitionCoords(
  teamIndex: number,
  catIndex: number,
  sopCount = 0,
  catCounts: number[] = [],
) {
  const { baseGx, baseGy } = getDistrictOrigin(teamIndex);
  const catCol = catIndex % CAT_COLS_PER_TEAM;
  const catRow = Math.floor(catIndex / CAT_COLS_PER_TEAM);

  const depth = getCategoryDepth(sopCount);
  const width = CAT_PARTITION_WIDTH;

  // Compute Y offset by summing max heights of each prior row
  let rowOffsetY = 0;
  for (let r = 0; r < catRow; r++) {
    const countA = catCounts[r * 2] ?? 0;
    const countB = catCounts[r * 2 + 1] ?? 0;
    const depthA = getCategoryDepth(countA);
    const depthB = getCategoryDepth(countB);
    const rowHeight = Math.max(depthA, depthB);
    rowOffsetY += rowHeight + CAT_ROW_GAP;
  }

  const originGx = Number((baseGx + catCol * CAT_SPACING_X).toFixed(2));
  const originGy = Number((baseGy + rowOffsetY).toFixed(2));

  return {
    originGx,
    originGy,
    width,
    depth,
    catCol,
    catRow,
  };
}

/**
 * Calculates coordinates for an SOP block positioned inside its assigned category partition bay.
 */
export function getCategorySopCoords(
  teamIndex: number,
  catIndex: number,
  sopIndexInCat: number,
  catCounts: number[] = [],
) {
  const countInCat = catCounts[catIndex] ?? 0;
  const partition = getCategoryPartitionCoords(teamIndex, catIndex, countInCat, catCounts);
  const col = sopIndexInCat % SOP_COLS_PER_CAT;
  const row = Math.floor(sopIndexInCat / SOP_COLS_PER_CAT);

  return {
    gx: Number((partition.originGx + 2.0 + col * SOP_IN_CAT_STEP_X).toFixed(2)),
    gy: Number((partition.originGy + 3.8 + row * SOP_IN_CAT_STEP_Y).toFixed(2)),
    row,
  };
}

/**
 * Calculates coordinates for a team's Operations Headquarters Building:
 * Left-side teams (col 0): placed to the LEFT of their category bays
 * Right-side teams (col 1): placed to the RIGHT of their category bays
 */
export function getTeamBuildingCoords(teamIndex: number) {
  const origin = getDistrictOrigin(teamIndex);
  const isLeft = origin.col === 0;

  if (isLeft) {
    return {
      bx: Number((origin.baseGx - 14.5).toFixed(2)),
      by: Number((origin.baseGy + 2.0).toFixed(2)),
      isLeft: true,
      fw: 8.6,
      fd: 3.5,
      h: 1.85,
    };
  } else {
    return {
      bx: Number((origin.baseGx + 2 * CAT_SPACING_X + 2.0).toFixed(2)),
      by: Number((origin.baseGy + 2.0).toFixed(2)),
      isLeft: false,
      fw: 8.6,
      fd: 3.5,
      h: 1.85,
    };
  }
}

/**
 * Dynamically calculates the full boundary polygon dimensions of a team's district.
 * Guarantees that ALL category partition bays, the HQ building, and the [+ ADD CATEGORY ZONE] pad
 * are 100% encompassed inside the district perimeter with clean margins!
 */
export function getTeamDistrictBounds(
  teamIndex: number,
  categories: Array<{ name: string; sopCount: number }> = [],
) {
  const { baseGy } = getDistrictOrigin(teamIndex);
  const bldg = getTeamBuildingCoords(teamIndex);

  const catCounts = categories.map((c) => c.sopCount);
  const totalSlots = Math.max(categories.length, 2) + 1; // +1 for Add Category Pad

  let minGx = bldg.bx;
  let maxGx = bldg.bx + bldg.fw;
  let minGy = Math.min(baseGy, bldg.by);
  let maxGy = Math.max(baseGy, bldg.by + bldg.fd);

  for (let i = 0; i < totalSlots; i++) {
    const count = i < categories.length ? categories[i].sopCount : 0;
    const part = getCategoryPartitionCoords(teamIndex, i, count, catCounts);
    const depth = i < categories.length ? part.depth : 8.0;

    minGx = Math.min(minGx, part.originGx);
    maxGx = Math.max(maxGx, part.originGx + part.width);
    maxGy = Math.max(maxGy, part.originGy + depth);
  }

  const paddingX = 4.5;
  const paddingY = 4.0;

  const ox = Number((minGx - paddingX).toFixed(2));
  const oy = Number((minGy - paddingY).toFixed(2));
  const width = Number((maxGx - minGx + paddingX * 2).toFixed(2));
  const depth = Number((maxGy - minGy + paddingY * 2).toFixed(2));

  return {
    ox,
    oy,
    width,
    depth,
    centerX: Number((ox + width / 2).toFixed(2)),
    centerY: Number((oy + depth / 2).toFixed(2)),
  };
}

/**
 * Calculates visual center point for smooth camera flight.
 */
export function getDistrictCenter(
  teamIndex: number,
  categories: Array<{ name: string; sopCount: number }> = [],
) {
  const bounds = getTeamDistrictBounds(teamIndex, categories);
  return {
    gx: bounds.centerX,
    gy: bounds.centerY,
  };
}

/**
 * Legacy single-district / fallback square coords
 */
export function getDistrictSopCoords(teamIndex: number, sopIndex: number) {
  const catIndex = Math.floor(sopIndex / 4);
  const sopIndexInCat = sopIndex % 4;
  return getCategorySopCoords(teamIndex, catIndex, sopIndexInCat);
}

export function getSopSquareCoords(index: number) {
  return getDistrictSopCoords(0, index);
}

export const INITIAL_TEAMS: Team[] = [
  {
    id: "team-cac",
    code: "CAC",
    name: "CAC Team",
    description: "Customer Automation Center — Site Operations, Butler Fleet & Alert Triage",
    lead: "Arjun Verma (Ops Director)",
    mandate: "Real-time robotics fleet coordination, site downtime monitoring, shift rosters, and Salesforce alert bucket triage.",
    contact: "Ops Radio Channel #04 · ops-cac@greyorange.com · Ext 401",
    slaMinutes: 15,
    fleets: ["Butler M500 Fleet (120 Units)", "PickPut High-Speed Stations (16 Units)", "OpsGenie / Salesforce Alert Queues"],
    headquartersZone: "West Plaza · Sector 01-A",
    categories: [
      "Alert & Incident SOPs",
      "Rosters & Coverage",
      "Buckets & Triage",
      "Operational Procedures",
    ],
  },
  {
    id: "team-im",
    code: "IM",
    name: "IM Team",
    description: "Incident Management — Rapid P1/P0 Dispatch, War Rooms & Escalation Matrix",
    lead: "Devon Reed (Incident Commander)",
    mandate: "Incident command, rapid P1 triage bridges, executive emergency comms, downtime containment, and time-based escalation matrices.",
    contact: "War Room Dispatch · im-duty@greyorange.com · Ext 911",
    slaMinutes: 5,
    fleets: ["Emergency Virtual Safety Fencing", "Incident Blackbox Recorders", "Executive Alert Cadence Dispatch"],
    headquartersZone: "East Plaza · Sector 02-B",
    categories: [
      "P1 Incident Command",
      "War Room Protocols",
      "Escalation & Matrix",
      "Support Leadership",
      "Runbooks & Portals",
    ],
  },
];

export const INITIAL_SOPS: SOP[] = [
  // ==========================================
  // REAL OPERATIONAL SOPS & ROSTERS (IM & CAC TEAMS ONLY)
  // ==========================================
  {
    id: "sop-real-01",
    teamId: "team-im",
    code: "SOP-IM-01",
    title: "DIR for Sev-1",
    category: "P1 Incident Command",
    priority: "CRITICAL",
    status: "ALERT",
    version: "1.0",
    author: "Incident Management Lead",
    updatedAt: "2026-10-24",
    summary: "Initial analysis report created after Sev-1, with timelines and resolution steps.",
    triggerCondition: "Immediately following Sev-1 declaration or major customer-impacting outage.",
    contentLink: "https://docs.google.com/document/d/1uNR98jydXJfQ3o7J1_gQ1_2GX0pV7rm2/edit",
    linkText: "Master Template of DIR .docx",
    steps: [
      { id: "dir-1", order: 1, title: "Initialize DIR Document", description: "Open Master Template of DIR and enter incident metadata and timestamps." },
      { id: "dir-2", order: 2, title: "Capture Timeline & Actions", description: "Record triage sequence, engineering mitigations, and bridge discussions." },
    ],
    escalation: { level1: "Incident Commander", level2: "VP Operations", slaMinutes: 30 },
    gx: 20.0,
    gy: 12.0,
    row: 1,
    load: 96,
    alert: true,
  },
  {
    id: "sop-real-02",
    teamId: "team-im",
    code: "SOP-IM-02",
    title: "Time based escalation Matrix",
    category: "Escalation & Matrix",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "2.0",
    author: "IM Operations",
    updatedAt: "2026-10-24",
    summary: "Escalation used for all major incident, where IM process are involved.",
    triggerCondition: "Major incident SLA thresholds (T+15, T+30, T+60 min) reached without root resolution.",
    contentLink: "https://docs.google.com/spreadsheets/d/1p4jKubXnUawo5XIiq02FKftgJICwEC8HxhsmIKVEyJ0/edit?gid=0#gid=0",
    linkText: "Time Based Escalation Matrix-IM",
    steps: [
      { id: "esc-1", order: 1, title: "Check Incident Duration", description: "Assess current elapsed time against time-based matrix thresholds." },
      { id: "esc-2", order: 2, title: "Notify Escalation Contacts", description: "Broadcast escalation pager alerts to assigned tier leaders." },
    ],
    escalation: { level1: "Duty Incident Commander", level2: "Engineering Director", slaMinutes: 15 },
    gx: 22.0,
    gy: 12.0,
    row: 1,
    load: 92,
    alert: true,
  },
  {
    id: "sop-real-03",
    teamId: "team-im",
    code: "SOP-IM-03",
    title: "Support leaders coverage",
    category: "Support Leadership",
    priority: "HIGH",
    status: "ACTIVE",
    version: "1.5",
    author: "Support Leadership",
    updatedAt: "2026-10-24",
    summary: "During the usage of time based escalation matrix, this is sub-part for support leaders.",
    triggerCondition: "Leadership escalation trigger or executive notification requirement.",
    contentLink: "https://docs.google.com/spreadsheets/d/1BqrHRKWYkXij-aAgPWNDuYoOrsleGa4F2AehG8sHQiA/edit?gid=794362779#gid=794362779",
    linkText: "Support Leadership Coverage- IM",
    steps: [
      { id: "sup-1", order: 1, title: "Verify Current Shift Leader", description: "Inspect active leadership roster for current timezone and region." },
    ],
    escalation: { level1: "Lead on Duty", level2: "Global Support Head", slaMinutes: 20 },
    gx: 24.0,
    gy: 12.0,
    row: 1,
    load: 88,
    alert: false,
  },
  {
    id: "sop-real-04",
    teamId: "team-cac",
    code: "SOP-CAC-04",
    title: "Red zone tracking sheet",
    category: "Alert & Incident SOPs",
    priority: "CRITICAL",
    status: "ALERT",
    version: "2.1",
    author: "CAC Analytics",
    updatedAt: "2026-10-24",
    summary: "For sites having Uptime less than 98% and MTBF >36 hrs, special process is created.",
    triggerCondition: "Site uptime drops below 98% or Mean Time Between Failures (MTBF) breaches thresholds.",
    contentLink: "https://docs.google.com/spreadsheets/d/1oE9z6XIi5mAP5zSI3ecVKv26xbnQxwWY/edit?gid=305746166#gid=305746166",
    linkText: "Red_Zone_Tracker ( Daily Tracking).xlsx",
    steps: [
      { id: "red-1", order: 1, title: "Open Red Zone Daily Sheet", description: "Check site telemetry and update daily failure counts and trends." },
    ],
    escalation: { level1: "Site Lead", level2: "Regional Ops Lead", slaMinutes: 30 },
    gx: 20.0,
    gy: 15.0,
    row: 2,
    load: 95,
    alert: true,
  },
  {
    id: "sop-real-05",
    teamId: "team-tac",
    code: "SOP-TAC-05",
    title: "Engg escalation roster",
    category: "Firmware Triage",
    priority: "HIGH",
    status: "ACTIVE",
    version: "3.0",
    author: "TAC Systems",
    updatedAt: "2026-10-24",
    summary: "During troubleshooting, if engg help is required, roster for GM teams.",
    triggerCondition: "Level 3 core system, firmware, or solver bug identified during live triage.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/BS/pages/62678250/Support+Roster+Software",
    linkText: "Enng Support+Roster+Software",
    steps: [
      { id: "eng-1", order: 1, title: "Look up On-Call Software Engineer", description: "Identify primary and secondary software engineers for the affected subsystem." },
    ],
    escalation: { level1: "TAC Lead", level2: "Engineering Director", slaMinutes: 20 },
    gx: 22.0,
    gy: 15.0,
    row: 2,
    load: 91,
    alert: false,
  },
  {
    id: "sop-real-06",
    teamId: "team-tac",
    code: "SOP-TAC-06",
    title: "Gstore escalation roster",
    category: "AI Routing & Latency",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.2",
    author: "gStore Team",
    updatedAt: "2026-10-24",
    summary: "Roster for gstore escalation during major incident.",
    triggerCondition: "gStore cloud service degradation, store inventory sync failure, or RFID stream timeout.",
    contentLink: "https://docs.google.com/spreadsheets/d/1-GRLJbnNorxOD37ZqViyS8GA5eVQo2ALi_4oMnNz0M4/edit?gid=1115737963#gid=1115737963",
    linkText: "Team Roster | gStore",
    steps: [
      { id: "gst-1", order: 1, title: "Access gStore Escalation Matrix", description: "Identify the duty engineer for gStore microservices and retail gateway." },
    ],
    escalation: { level1: "gStore On-Call", level2: "gStore Tech Lead", slaMinutes: 20 },
    gx: 24.0,
    gy: 15.0,
    row: 2,
    load: 87,
    alert: false,
  },
  {
    id: "sop-real-07",
    teamId: "team-im",
    code: "SOP-IM-07",
    title: "IM Ticket bucket",
    category: "P1 Incident Command",
    priority: "CRITICAL",
    status: "ALERT",
    version: "1.8",
    author: "IM Dispatch",
    updatedAt: "2026-10-24",
    summary: "IM currently open ticket bucket with bridge details.",
    triggerCondition: "Active P1/P2 bridges open in Salesforce awaiting operational bridge coordination.",
    contentLink: "https://greyorangeorg.lightning.force.com/lightning/o/Case/list?filterName=IM_Bridge",
    linkText: "IM bridge Bucket",
    steps: [
      { id: "imb-1", order: 1, title: "Open Bridge Queue", description: "Check unassigned bridge tickets and verify conference link status." },
    ],
    escalation: { level1: "Bridge Commander", level2: "Ops Director", slaMinutes: 10 },
    gx: 20.0,
    gy: 18.0,
    row: 3,
    load: 98,
    alert: true,
  },
  {
    id: "sop-real-08",
    teamId: "team-im",
    code: "SOP-IM-08",
    title: "IM ticket assigned bucket",
    category: "P1 Incident Command",
    priority: "HIGH",
    status: "ACTIVE",
    version: "1.4",
    author: "IM Dispatch",
    updatedAt: "2026-10-24",
    summary: "IM ticket which is currently open and assigned.",
    triggerCondition: "Monitoring active ownership and SLA timers for in-flight incident tickets.",
    contentLink: "https://greyorangeorg.lightning.force.com/lightning/o/Case/list?filterName=IM_Bridge",
    linkText: "IM assigned bucket",
    steps: [
      { id: "ima-1", order: 1, title: "Monitor Open Cases", description: "Ensure assigned owners have acknowledged case updates and posted next milestone." },
    ],
    escalation: { level1: "Incident Commander", level2: "Support Lead", slaMinutes: 15 },
    gx: 22.0,
    gy: 18.0,
    row: 3,
    load: 85,
    alert: false,
  },
  {
    id: "sop-real-09",
    teamId: "team-tac",
    code: "SOP-TAC-09",
    title: "SRE alignment",
    category: "AI Routing & Latency",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "CloudOps / SRE",
    updatedAt: "2026-10-24",
    summary: "If anywhere on incident / project / deployment SRE / Cloudops / network help is required, run command on Slack.",
    triggerCondition: "Cloud infrastructure degradation, Kubernetes cluster pod crash, or VPC peering anomaly.",
    contentLink: "slack://app?team=greyorange&command=/SRE-Oncall",
    linkText: "Slack: /SRE-Oncall",
    steps: [
      { id: "sre-1", order: 1, title: "Run Slack Command", description: "Type `/SRE-Oncall` in your incident or triage channel to pull on-call duty engineer." },
    ],
    escalation: { level1: "SRE On-Call", level2: "Head of Infrastructure", slaMinutes: 15 },
    gx: 24.0,
    gy: 18.0,
    row: 3,
    load: 89,
    alert: false,
  },
  {
    id: "sop-real-10",
    teamId: "team-im",
    code: "SOP-IM-10",
    title: "War Room Opening SOP",
    category: "War Room Protocols",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "2.5",
    author: "IM Lead",
    updatedAt: "2026-10-24",
    summary: "Basic check-up before accepting any war room / Monitoring new request.",
    triggerCondition: "Critical escalation requiring multi-disciplinary cross-team bridge or war room stand-up.",
    contentLink: "https://docs.google.com/document/d/1ryQunPQVBAyDaH6aQAb7attDvEe2rw3CiA95zxupwsM/edit?tab=t.0",
    linkText: "War Room & Monitoring Request Workbook",
    steps: [
      { id: "wr-1", order: 1, title: "Verify Bridge Criteria", description: "Ensure impact severity justifies war room opening per operational rubric." },
      { id: "wr-2", order: 2, title: "Send Bridge Coordinates", description: "Publish bridge meet link and bridge rules in primary communication channels." },
    ],
    escalation: { level1: "War Room Commander", level2: "Operations Director", slaMinutes: 10 },
    gx: 20.0,
    gy: 21.0,
    row: 4,
    load: 94,
    alert: true,
  },
  {
    id: "sop-real-11",
    teamId: "team-im",
    code: "SOP-IM-11",
    title: "Emergency Change",
    category: "War Room Protocols",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "3.1",
    author: "Change Advisory Board",
    updatedAt: "2026-10-24",
    summary: "Emergency change process, which needs to be followed, before implementing on production.",
    triggerCondition: "Urgent hotfix, DB patch, or configuration rollout required during live incident.",
    contentLink: "https://docs.google.com/document/d/1o3cbHGIusxNB5X9UQVNe6OOfr-q9KoyurKUs-Gaurag/edit?tab=t.0",
    linkText: "Emergency Change Deployment Template (ECDT)",
    steps: [
      { id: "ec-1", order: 1, title: "Fill ECDT Template", description: "Document rollback plan, blast radius, test validation, and executive approval." },
    ],
    escalation: { level1: "CAB Duty Lead", level2: "VP Engineering", slaMinutes: 15 },
    gx: 22.0,
    gy: 21.0,
    row: 4,
    load: 90,
    alert: true,
  },
  {
    id: "sop-real-12",
    teamId: "team-im",
    code: "SOP-IM-12",
    title: "Alert Runbook",
    category: "Runbooks & Portals",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "Global Operations",
    updatedAt: "2026-10-24",
    summary: "Basic SOP – Alert Monitoring and Handling.",
    triggerCondition: "Automated alert received from Datadog, Prometheus, or OpsGenie monitoring cluster.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/GEM/pages/70517299/RunBooks",
    linkText: "GEM RunBooks Portal",
    steps: [
      { id: "rb-1", order: 1, title: "Locate Specific Alert Signature", description: "Match alert metric in runbook index and review recommended triaging sequence." },
    ],
    escalation: { level1: "NOC Tier 1", level2: "TAC Systems Engineer", slaMinutes: 30 },
    gx: 24.0,
    gy: 21.0,
    row: 4,
    load: 85,
    alert: false,
  },
  {
    id: "sop-real-13",
    teamId: "team-cac",
    code: "SOP-CAC-13",
    title: "GMI AE Team Roster",
    category: "Rosters & Coverage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.0",
    author: "CAC Resource Planning",
    updatedAt: "2026-10-24",
    summary: "Daily shift assignments, engineer availability, and operational coverage.",
    triggerCondition: "Shift handover, site engineer dispatch, or operational coverage inquiry.",
    contentLink: "https://docs.google.com/spreadsheets/d/1IWfcnQzINQrYNhUbcRcF813M3Eo2I5dg0d2ewipwhyI/edit?gid=1594753333#gid=1594753333",
    linkText: "GMI AE Team Shift Roster",
    steps: [
      { id: "gmi-1", order: 1, title: "Check Active Shift", description: "Review daily shift rotation and rostered contact details for active shift." },
    ],
    escalation: { level1: "CAC Team Lead", level2: "Ops Coordinator", slaMinutes: 45 },
    gx: 20.0,
    gy: 24.0,
    row: 5,
    load: 82,
    alert: false,
  },
  {
    id: "sop-real-14",
    teamId: "team-cac",
    code: "SOP-CAC-14",
    title: "RDC Kenco-GMI Roster",
    category: "Rosters & Coverage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.0",
    author: "RDC Operations",
    updatedAt: "2026-10-24",
    summary: "Daily shift assignments, engineer availability, and operational coverage for RDC Kenco.",
    triggerCondition: "RDC site shift coordination, handover, or site coverage review.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/BS/pages/195102234/Support+Roster+RDC",
    linkText: "Support Roster RDC",
    steps: [
      { id: "rdc-1", order: 1, title: "Review RDC Kenco Roster", description: "Verify active site engineering coverage and schedule handoff notes." },
    ],
    escalation: { level1: "RDC Lead", level2: "Site Director", slaMinutes: 45 },
    gx: 22.0,
    gy: 24.0,
    row: 5,
    load: 80,
    alert: false,
  },
  {
    id: "sop-real-15",
    teamId: "team-cac",
    code: "SOP-CAC-15",
    title: "Gstore Team Roster",
    category: "Rosters & Coverage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.2",
    author: "gStore Ops",
    updatedAt: "2026-10-24",
    summary: "Daily shift assignments, engineer availability, and operational coverage.",
    triggerCondition: "gStore site operational questions or shift duty inquiries.",
    contentLink: "https://docs.google.com/spreadsheets/d/1-GRLJbnNorxOD37ZqViyS8GA5eVQo2ALi_4oMnNz0M4/edit?gid=1231494889#gid=1231494889",
    linkText: "Team_Roster gStore",
    steps: [
      { id: "gst-roster-1", order: 1, title: "Open gStore Roster", description: "Inspect active rota for store technicians and cloud support engineers." },
    ],
    escalation: { level1: "gStore Lead", level2: "Regional Manager", slaMinutes: 45 },
    gx: 24.0,
    gy: 24.0,
    row: 5,
    load: 84,
    alert: false,
  },
  {
    id: "sop-real-16",
    teamId: "team-dws",
    code: "SOP-DWS-16",
    title: "RIL/RMS/DWS Software Team",
    category: "Linear Sorters",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "RMS Engineering",
    updatedAt: "2026-10-24",
    summary: "Daily shift assignments, engineer availability, and operational coverage for RIL, RMS, and DWS.",
    triggerCondition: "DWS sorter software or RMS orchestration dispatch required.",
    contentLink: "https://docs.google.com/spreadsheets/d/1C2de1gtfybToKcZZ9u598zPRrV8-KO3keHamhNYsAiU/edit#gid=803187496",
    linkText: "RMS_Roster_Link",
    steps: [
      { id: "rms-1", order: 1, title: "Identify Assigned DWS/RMS Engineer", description: "Check current shift table and contact designated secondary if urgent." },
    ],
    escalation: { level1: "DWS Lead", level2: "Engineering Head", slaMinutes: 30 },
    gx: 20.0,
    gy: 27.0,
    row: 6,
    load: 88,
    alert: false,
  },
  {
    id: "sop-real-17",
    teamId: "team-tac",
    code: "SOP-TAC-17",
    title: "POD- Detail",
    category: "Firmware Triage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.6",
    author: "TAC Administration",
    updatedAt: "2026-10-24",
    summary: "TAC team- Members POD distribution list.",
    triggerCondition: "Ticket routing or assignment to specific robotics technology pods.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/AKB/pages/136283129/POD+Details",
    linkText: "POD_Detail Wiki",
    steps: [
      { id: "pod-1", order: 1, title: "Locate Subsystem POD", description: "Find the designated POD (Navigation, Power, Solvers, or UI) for ticket routing." },
    ],
    escalation: { level1: "TAC POD Lead", level2: "TAC Manager", slaMinutes: 60 },
    gx: 22.0,
    gy: 27.0,
    row: 6,
    load: 78,
    alert: false,
  },
  {
    id: "sop-real-18",
    teamId: "team-tac",
    code: "SOP-TAC-18",
    title: "RTP || TTP Software Team",
    category: "AI Routing & Latency",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.1",
    author: "RTP Engineering",
    updatedAt: "2026-10-24",
    summary: "Daily shift assignments, engineer availability, and operational coverage for RTP/TTP software.",
    triggerCondition: "Real-time path planning or traffic solver latency spikes requiring engineering intervention.",
    contentLink: "https://docs.google.com/spreadsheets/d/1Vgm_iHhyT4MwTxJ7bjX9-afUfFvSEfNUwYvzt7IIcoA/edit?gid=499437875#gid=499437875",
    linkText: "POD_Roster (RTP/TTP)",
    steps: [
      { id: "rtp-1", order: 1, title: "Contact On-Duty RTP Engineer", description: "Review rota and engage engineer on dedicated traffic dispatch Slack channel." },
    ],
    escalation: { level1: "RTP Tech Lead", level2: "AI Solutions Director", slaMinutes: 20 },
    gx: 24.0,
    gy: 27.0,
    row: 6,
    load: 90,
    alert: false,
  },
  {
    id: "sop-real-19",
    teamId: "team-cac",
    code: "SOP-CAC-19",
    title: "Site Downtime Windows",
    category: "Butler Fleet Protocols",
    priority: "HIGH",
    status: "ACTIVE",
    version: "1.4",
    author: "CAC Site Operations",
    updatedAt: "2026-10-24",
    summary: "To maintain a daily record of planned site downtime and maintenance windows for monitoring, coordination.",
    triggerCondition: "Planned preventive maintenance, customer shutdown, or scheduled building power cycles.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/CAC/pages/159450135/Operational+Downtime+Schedule+All+Sites",
    linkText: "Downtime_window Schedule",
    steps: [
      { id: "dt-1", order: 1, title: "Record Planned Outage", description: "Verify start/end time and enter maintenance window in monitoring blacklist." },
    ],
    escalation: { level1: "CAC Duty Officer", level2: "Customer Operations Lead", slaMinutes: 30 },
    gx: 20.0,
    gy: 30.0,
    row: 7,
    load: 85,
    alert: false,
  },
  {
    id: "sop-real-20",
    teamId: "team-cac",
    code: "SOP-CAC-20",
    title: "All Site MD || Tower || Grafana",
    category: "Butler Fleet Protocols",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.3",
    author: "Telemetry Infrastructure",
    updatedAt: "2026-10-24",
    summary: "Central index of monitoring dashboards, Tower endpoints, and Grafana URLs across all customer facilities.",
    triggerCondition: "Live metric analysis, battery degradation tracking, or Butler heatmaps across sites.",
    contentLink: "https://docs.google.com/spreadsheets/d/1UNQqHglBJYUuyflc5PkJtDOz6RdvC1QBpC8PDs96ViQ/edit?gid=0#gid=0",
    linkText: "MD_Tower_Grafana Directory",
    steps: [
      { id: "graf-1", order: 1, title: "Locate Site Dashboard URL", description: "Select customer site and launch regional Grafana dashboard." },
    ],
    escalation: { level1: "Monitoring Team", level2: "Infrastructure Lead", slaMinutes: 45 },
    gx: 22.0,
    gy: 30.0,
    row: 7,
    load: 88,
    alert: false,
  },
  {
    id: "sop-real-21",
    teamId: "team-cem",
    code: "SOP-CEM-21",
    title: "Site Asset Information",
    category: "Drive Unit Overhauls",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "2.0",
    author: "CEM Hardware Lead",
    updatedAt: "2026-10-24",
    summary: "Site CEM Information and Asset detail.",
    triggerCondition: "Robot serial number lookup, spare parts inventory verification, or replacement drive dispatch.",
    contentLink: "https://docs.google.com/spreadsheets/d/1RBFPtmL8Mw_v54BfUOGqX8FIFHohDmk_noyWT1WYpDY/edit?gid=0#gid=0&fvid=128522741",
    linkText: "Asset_Detail Tracker",
    steps: [
      { id: "asset-1", order: 1, title: "Search Bot Serial / MAC Address", description: "Confirm hardware revision and component lifecycle history." },
    ],
    escalation: { level1: "CEM Site Engineer", level2: "Field Service Manager", slaMinutes: 60 },
    gx: 24.0,
    gy: 30.0,
    row: 7,
    load: 80,
    alert: false,
  },
  {
    id: "sop-real-22",
    teamId: "team-pm",
    code: "SOP-PM-22",
    title: "Maintainence Procedure",
    category: "Mechanical & Gearbox RCA",
    priority: "HIGH",
    status: "ACTIVE",
    version: "3.2",
    author: "Preventive Maintenance Lead",
    updatedAt: "2026-10-24",
    summary: "This SOP defines the step-by-step process to perform scheduled maintenance.",
    triggerCondition: "Scheduled bi-weekly/monthly robot or conveyor preventive maintenance cycle.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/CAC/pages/62293651/0.6+Maintenance+Activity+-+Step+by+Step+Procedure",
    linkText: "Maintainence_SOP Confluence",
    steps: [
      { id: "maint-1", order: 1, title: "Lockout / Tagout (LOTO)", description: "Isolate power supply and engage safety pins per protocol." },
      { id: "maint-2", order: 2, title: "Execute Lubrication & Inspection", description: "Follow checklist for gearbox oil, belt tension, and sensor cleans." },
    ],
    escalation: { level1: "PM Specialist", level2: "Maintenance Director", slaMinutes: 60 },
    gx: 20.0,
    gy: 33.0,
    row: 8,
    load: 86,
    alert: false,
  },
  {
    id: "sop-real-23",
    teamId: "team-tac",
    code: "SOP-TAC-23",
    title: "Handling QA/ Staging Ticket",
    category: "Firmware Triage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.3",
    author: "QA Engineering",
    updatedAt: "2026-10-24",
    summary: "How to Triage QA and Staging Environment ticket.",
    triggerCondition: "Issues detected on internal test grids, pre-release staging clusters, or simulator environments.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/spaces/CAC/pages/171508920/1.0+Handling+Staging+QA+Tickets",
    linkText: "QA/Staging Triage SOP",
    steps: [
      { id: "qa-1", order: 1, title: "Verify Environment Tag", description: "Ensure ticket is flagged with QA-STAGING and not production." },
    ],
    escalation: { level1: "QA Duty Engineer", level2: "Release Manager", slaMinutes: 120 },
    gx: 22.0,
    gy: 33.0,
    row: 8,
    load: 76,
    alert: false,
  },
  {
    id: "sop-real-24",
    teamId: "team-cac",
    code: "SOP-CAC-24",
    title: "RPE Roster",
    category: "Rosters & Coverage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.1",
    author: "RPE Team",
    updatedAt: "2026-10-24",
    summary: "Engineer availability, and operational coverage for Robotic Process Engineers (RPE).",
    triggerCondition: "Process optimization or station layout tuning request.",
    contentLink: "https://docs.google.com/spreadsheets/d/1_q9BYC9m5ztcFjzmvMdxuYhIKfHXeFjr_Y8SC8UkS34/edit?gid=1384070455#gid=1384070455",
    linkText: "RPE_Roster",
    steps: [
      { id: "rpe-1", order: 1, title: "Check Regional RPE Contact", description: "Identify duty RPE engineer for regional customer account." },
    ],
    escalation: { level1: "RPE Lead", level2: "Solution Lead", slaMinutes: 60 },
    gx: 24.0,
    gy: 33.0,
    row: 8,
    load: 81,
    alert: false,
  },
  {
    id: "sop-real-25",
    teamId: "team-cac",
    code: "SOP-CAC-25",
    title: "Solution Team Roster",
    category: "Rosters & Coverage",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "1.2",
    author: "Solution Architecture",
    updatedAt: "2026-10-24",
    summary: "Engineer availability, and operational coverage for Solution Design & Integration.",
    triggerCondition: "WMS API integration issues, custom workflow adaptations, or solution design bugs.",
    contentLink: "https://docs.google.com/spreadsheets/d/1Bso9m0JVdXIfy9HcbelerpedtEJB-zw62xrBMRGF8eg/edit?gid=242227126#gid=242227126",
    linkText: "Solution_Team_Roster",
    steps: [
      { id: "sol-1", order: 1, title: "Locate Solution Architect", description: "Match customer tenant ID with designated Solution Architect." },
    ],
    escalation: { level1: "Solution Lead", level2: "Head of Architecture", slaMinutes: 60 },
    gx: 20.0,
    gy: 36.0,
    row: 9,
    load: 83,
    alert: false,
  },
  {
    id: "sop-real-26",
    teamId: "team-cac",
    code: "SOP-CAC-26",
    title: "CAC Team Bucket",
    category: "Buckets & Triage",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "CAC Dispatch",
    updatedAt: "2026-10-24",
    summary: "New tickets are consistently appearing in this bucket.",
    triggerCondition: "Incoming customer support cases routed to CAC triage queue.",
    contentLink: "https://greyorangeorg.lightning.force.com/lightning/o/Case/list?filterName=CAC_Team_Case",
    linkText: "CAC_Team Cases in Salesforce",
    steps: [
      { id: "cac-b-1", order: 1, title: "Claim Case", description: "Assign case to yourself and set initial investigation status within 15 minutes." },
    ],
    escalation: { level1: "CAC Queue Lead", level2: "Ops Manager", slaMinutes: 15 },
    gx: 22.0,
    gy: 36.0,
    row: 9,
    load: 92,
    alert: false,
  },
  {
    id: "sop-real-27",
    teamId: "team-cac",
    code: "SOP-CAC-27",
    title: "Opsgenie Bucket (Alert Bucket)",
    category: "Buckets & Triage",
    priority: "CRITICAL",
    status: "ALERT",
    version: "2.4",
    author: "Monitoring Center",
    updatedAt: "2026-10-24",
    summary: "This bucket displays all alerts, including alerts assigned to all teams. New Alerts tickets are consistently appearing here regardless of team ownership.",
    triggerCondition: "High priority telemetry threshold breached and ingested into Salesforce alert pipeline.",
    contentLink: "https://greyorangeorg.lightning.force.com/lightning/o/Case/list?filterName=OpsGenie_Alert",
    linkText: "OpsGenie_Alert Salesforce Bucket",
    steps: [
      { id: "ops-1", order: 1, title: "Review New Alerts", description: "Check unacknowledged alerts and route to appropriate squad (CAC, TAC, or CloudOps)." },
    ],
    escalation: { level1: "Duty Dispatcher", level2: "CAC Shift Lead", slaMinutes: 10 },
    gx: 24.0,
    gy: 36.0,
    row: 9,
    load: 97,
    alert: true,
  },
  {
    id: "sop-real-28",
    teamId: "team-cac",
    code: "SOP-CAC-28",
    title: "NEW CAC Alerts Bucket",
    category: "Buckets & Triage",
    priority: "CRITICAL",
    status: "ALERT",
    version: "2.1",
    author: "NOC Triage",
    updatedAt: "2026-10-24",
    summary: "This bucket displays new alerts, including those for which the FR has not been updated in the ticket. It also includes alerts across all teams.",
    triggerCondition: "Fresh alerts awaiting initial First Response (FR) update.",
    contentLink: "https://greyorangeorg.lightning.force.com/lightning/o/Case/list?filterName=Copy_of_CAC_Alert_Latest",
    linkText: "New_CAC_Alert Queue",
    steps: [
      { id: "fr-1", order: 1, title: "Update First Response (FR)", description: "Post initial customer acknowledgement within FR SLA target." },
    ],
    escalation: { level1: "FR Duty Analyst", level2: "Ops Coordinator", slaMinutes: 10 },
    gx: 20.0,
    gy: 39.0,
    row: 10,
    load: 95,
    alert: true,
  },
  {
    id: "sop-real-29",
    teamId: "team-tac",
    code: "SOP-TAC-29",
    title: "Network Team Alignment",
    category: "AI Routing & Latency",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "Network Operations",
    updatedAt: "2026-10-24",
    summary: "If anywhere on incident / project / deployment Network Team help is required, run command on Slack.",
    triggerCondition: "Warehouse Wi-Fi packet loss, switch failover issue, or firewall blocking RCS traffic.",
    contentLink: "slack://app?team=greyorange&command=/nwops-oncall",
    linkText: "Slack: /nwops-oncall",
    steps: [
      { id: "net-1", order: 1, title: "Run Slack Command", description: "Type `/nwops-oncall` in your channel to page the on-duty network engineer." },
    ],
    escalation: { level1: "Network Engineer On-Call", level2: "Head of Networking", slaMinutes: 15 },
    gx: 22.0,
    gy: 39.0,
    row: 10,
    load: 89,
    alert: false,
  },
  {
    id: "sop-real-30",
    teamId: "team-cac",
    code: "SOP-CAC-30",
    title: "Support Ticket Triage Process",
    category: "Buckets & Triage",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.3",
    author: "Customer Support Ops",
    updatedAt: "2026-10-24",
    summary: "This document outlines the Standard Operating Procedure (SOP) for triaging tickets in Salesforce.",
    triggerCondition: "Receiving unclassified customer inquiry or case reassignment.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/x/sLm2Aw",
    linkText: "Ticket Triage SOP on Confluence",
    steps: [
      { id: "tri-1", order: 1, title: "Apply Classification Taxonomies", description: "Set priority, category, component, and root cause classification fields." },
    ],
    escalation: { level1: "Triage Lead", level2: "Support Operations Director", slaMinutes: 30 },
    gx: 24.0,
    gy: 39.0,
    row: 10,
    load: 87,
    alert: false,
  },
  {
    id: "sop-real-31",
    teamId: "team-cac",
    code: "SOP-CAC-31",
    title: "Alert Ticket Triage Process",
    category: "Buckets & Triage",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0",
    author: "Operations Governance",
    updatedAt: "2026-10-24",
    summary: "This SOP defines the standard process for updating alert statuses in Salesforce to ensure consistent tracking, ownership, and visibility throughout the alert lifecycle.",
    triggerCondition: "Lifecycle status progression (New -> In Progress -> Resolved) for automated alerts.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/x/9oDHCg",
    linkText: "Alert Status Lifecycle SOP",
    steps: [
      { id: "stat-1", order: 1, title: "Update Alert State in Salesforce", description: "Set correct investigation stage and append telemetry evidence." },
    ],
    escalation: { level1: "Quality Analyst", level2: "Ops Governance Manager", slaMinutes: 30 },
    gx: 20.0,
    gy: 42.0,
    row: 11,
    load: 86,
    alert: false,
  },
  {
    id: "sop-real-32",
    teamId: "team-cac",
    code: "SOP-CAC-32",
    title: "Alert Action Process",
    category: "Alert & Incident SOPs",
    priority: "CRITICAL",
    status: "ALERT",
    version: "2.5",
    author: "NOC / Operations Command",
    updatedAt: "2026-10-24",
    summary: "This SOP defines the standard actions to be performed by the NOC / Operations team for system alerts based on priority (P0, P1, P2).",
    triggerCondition: "Triggered on receipt of system alerts graded P0, P1, or P2.",
    contentLink: "https://greyorange-work.atlassian.net/wiki/x/_Lm2Aw",
    linkText: "Alert Action Process (P0/P1/P2)",
    steps: [
      { id: "act-1", order: 1, title: "Verify Priority Banding", description: "Correlate severity with customer contract SLA and begin immediate mitigation cadence." },
    ],
    escalation: { level1: "Operations Commander", level2: "VP Operations", slaMinutes: 10 },
    gx: 22.0,
    gy: 42.0,
    row: 11,
    load: 96,
    alert: true,
  },
];

const STORAGE_KEY_TEAMS = "greyorange_teams_v3";
const STORAGE_KEY_SOPS = "greyorange_sops_v3";

export function loadStoredTeams(): Team[] {
  if (typeof window === "undefined") return INITIAL_TEAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    const parsed: Team[] = JSON.parse(raw);
    const merged = parsed.map((t) => {
      const init = INITIAL_TEAMS.find((it) => it.id === t.id);
      return {
        ...t,
        categories:
          t.categories && t.categories.length > 0
            ? t.categories
            : init?.categories || ["General Protocols", "Alert & Incident SOPs"],
        mandate: t.mandate || init?.mandate,
        contact: t.contact || init?.contact,
        fleets: t.fleets || init?.fleets,
        slaMinutes: t.slaMinutes || init?.slaMinutes,
      };
    });
    return merged;
  } catch (err) {
    console.error("Failed to read teams from storage", err);
    return INITIAL_TEAMS;
  }
}

export function saveStoredTeams(teams: Team[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
  } catch (err) {
    console.error("Failed to write teams to storage", err);
  }
}

export function loadStoredSOPs(): SOP[] {
  if (typeof window === "undefined") return INITIAL_SOPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SOPS, JSON.stringify(INITIAL_SOPS));
      return INITIAL_SOPS;
    }
    const parsed: SOP[] = JSON.parse(raw);
    return parsed.map((s) => {
      const init = INITIAL_SOPS.find((is) => is.id === s.id);
      if (init) {
        return {
          ...s,
          contentLink: s.contentLink || init.contentLink,
          linkText: s.linkText || init.linkText,
          ...(s.category === "WMS/RCS" ||
          s.category === "Robotics" ||
          s.category === "Hardware" ||
          s.category === "Safety" ||
          s.category === "Firmware"
            ? { category: init.category }
            : {}),
        };
      }
      return s;
    });
  } catch (err) {
    console.error("Failed to read SOPs from storage", err);
    return INITIAL_SOPS;
  }
}

export function saveStoredSOPs(sops: SOP[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SOPS, JSON.stringify(sops));
  } catch (err) {
    console.error("Failed to write SOPs to storage", err);
  }
}
