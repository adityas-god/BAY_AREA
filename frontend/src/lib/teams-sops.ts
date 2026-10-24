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
  escalation: EscalationRule;
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
    description: "Customer Automation Center — Site Operations, Butler Fleet & RCS Orchestration",
    lead: "Arjun Verma (Ops Director)",
    mandate: "Real-time robotics fleet coordination, Mobile Storage Unit (MSU) path clearance, pick station routing, and automated charging dock management across 45,000 sq ft warehouse grid.",
    contact: "Ops Radio Channel #04 · ops-cac@greyorange.com · Ext 401",
    slaMinutes: 15,
    fleets: ["Butler M500 Fleet (120 Units)", "PickPut High-Speed Stations (16 Units)", "Fast-Charge Docks Bank A-F"],
    headquartersZone: "West Plaza · Sector 01-A",
    categories: ["Alert & Incident SOPs", "Butler Fleet Protocols", "Station & Charging"],
  },
  {
    id: "team-tac",
    code: "TAC",
    name: "TAC Team",
    description: "Technical Assistance Center — Level 2/3 Robotics Diagnostics & Firmware Triage",
    lead: "Priya Nair (Lead Systems Architect)",
    mandate: "Tier-2/3 deep systems robotics diagnostics, OTA firmware safety validation, CAN bus telemetry analysis, and GreyMatter AI solver batch latency optimization.",
    contact: "TAC Escalation Pager · tac-eng@greyorange.com · Ext 502",
    slaMinutes: 10,
    fleets: ["OTA Firmware Multicast Cluster", "GreyMatter AI Solver Pods", "CAN Bus Telemetry Probes"],
    headquartersZone: "East Plaza · Sector 02-B",
    categories: ["Firmware Triage", "AI Routing & Latency"],
  },
  {
    id: "team-dws",
    code: "DWS",
    name: "DWS Team",
    description: "Dynamic Warehouse Solutions — Linear Sorters, Vertical Pickers & Conveyors",
    lead: "Marcus Zhao (Hardware Specialist)",
    mandate: "Linear sorting machinery, vertical pickers, cross-belt parcel conveyors, and laser dimensioning optics maintenance and jam mitigation.",
    contact: "Automation Desk #02 · dws-hardware@greyorange.com · Ext 310",
    slaMinutes: 20,
    fleets: ["Cross-Belt Sorter System (Loop 01)", "Volumetric Laser Dimensioners", "VFD Conveyor Segments 01-08"],
    headquartersZone: "West Plaza · Sector 03-A",
    categories: ["Linear Sorters", "Dimensioning & Optics"],
  },
  {
    id: "team-im",
    code: "IM",
    name: "IM Team",
    description: "Incident Management — Rapid P1/P0 Dispatch, Downtime Mitigation & Post-Mortems",
    lead: "Devon Reed (Incident Commander)",
    mandate: "Incident command, rapid P1 triage bridges, executive emergency comms, downtime containment, and mean-time-to-resolution (MTTR) optimization.",
    contact: "War Room Dispatch · im-duty@greyorange.com · Ext 911",
    slaMinutes: 5,
    fleets: ["Emergency Virtual Safety Fencing", "Incident Blackbox Recorders", "Executive Alert Cadence Dispatch"],
    headquartersZone: "East Plaza · Sector 04-B",
    categories: ["P1 Incident Command", "War Room Protocols"],
  },
  {
    id: "team-pm",
    code: "PM",
    name: "Problem Management Team",
    description: "Root Cause Analysis (RCA), CAPA Workflows & Preventive Maintenance Lifecycles",
    lead: "Elena Rostova (Quality Lead)",
    mandate: "Chronic defect root cause analysis (RCA), metallurgical wear investigation, 5-Why Ishikawa audits, and supplier CAPA remediation for mechanical drives.",
    contact: "Quality Engineering · pm-rca@greyorange.com · Ext 620",
    slaMinutes: 120,
    fleets: ["Acoustic Vibration FFT Spectrometers", "Planetary Gearbox Test Cradles", "Component Lifecycle Tracking Store"],
    headquartersZone: "West Plaza · Sector 05-A",
    categories: ["Mechanical & Gearbox RCA", "CAPA Investigations"],
  },
  {
    id: "team-cem",
    code: "CEM",
    name: "CEM Team",
    description: "Customer Engineering & Maintenance — Grid Retrofits, Drive Unit Overhauls & Sensors",
    lead: "Tariq Mansoor (Field Engineering)",
    mandate: "Autonomous optical ground resurvey, 2D datamatrix floor replacement, drive unit overhauls, sensor calibration, and preventative mechanical refurbishment.",
    contact: "Field Engineering Ops · cem-field@greyorange.com · Ext 740",
    slaMinutes: 180,
    fleets: ["Autonomous Photogrammetry Camera Bot", "High-Durability Thermal Tag Printers", "Drive Unit Torque Calibration Rigs"],
    headquartersZone: "East Plaza · Sector 06-B",
    categories: ["Floor Grid Calibration", "Drive Unit Overhauls"],
  },
];

export const INITIAL_SOPS: SOP[] = [
  // --- CAC TEAM ---
  {
    id: "sop-cac-01",
    teamId: "team-cac",
    code: "SOP-CAC-101",
    title: "Butler RCS Grid Communication Loss",
    category: "Alert & Incident SOPs",
    priority: "CRITICAL",
    status: "ALERT",
    version: "2.4.1",
    author: "CAC Shift Lead",
    updatedAt: "2026-10-23",
    summary: "Immediate containment and restoration procedure when Butler robots lose heartbeat with Robot Control Server (RCS).",
    triggerCondition: "RCS heartbeat packet drop > 8% over 30 seconds or > 5 drive units reporting offline simultaneously.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Verify Core Switch and Access Point Health",
        description: "Run diagnostic ping check against AP cluster serving grid zones A1 through D4.",
        command: "greyctl net test --ap-cluster zone-alpha --ping-count 20",
      },
      {
        id: "s2",
        order: 2,
        title: "Engage Emergency E-Stop Virtual Safety Fence",
        description: "Isolate affected sub-grid partition in GreyOrange Fleet Manager to prevent collision hazards.",
        command: "greyctl fleet safety-fence --zone A1-D4 --action isolate",
      },
      {
        id: "s3",
        order: 3,
        title: "Restart RCS Communication Gateway Daemon",
        description: "Cycle the MQTT broker service and inspect queue backlogs.",
        command: "systemctl restart grey-rcs-gateway.service && journalctl -u grey-rcs-gateway -n 50 --no-pager",
      },
      {
        id: "s4",
        order: 4,
        title: "Re-synchronize Robot Spatial Odometry",
        description: "Instruct Butler robots to re-read nearest 2D QR floor barcode markers for position verification.",
        command: "greyctl butler broadcast --action calibrate-qr-odometry",
      },
    ],
    escalation: {
      level1: "On-duty CAC Operations Lead (Ext 401)",
      level2: "TAC Principal Network Engineer & Duty Manager",
      slaMinutes: 15,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 94,
    alert: true,
  },
  {
    id: "sop-cac-02",
    teamId: "team-cac",
    code: "SOP-CAC-102",
    title: "MSU Storage Pod Collision & Obstacle Clearance",
    category: "Butler Fleet Protocols",
    priority: "HIGH",
    status: "ACTIVE",
    version: "1.9.0",
    author: "Safety Officer",
    updatedAt: "2026-10-21",
    summary: "Physical floor protocol for safely disengaging locked Mobile Storage Units (MSU) and resetting navigation paths.",
    triggerCondition: "Lidar sensor collision trip or drive unit tilt error code DU-4091.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Halt Adjacent Zone Traffic",
        description: "Pause incoming Butler trajectories within a 5-meter radius.",
        command: "greyctl traffic pause --radius 5m --coord X:42,Y:18",
      },
      {
        id: "s2",
        order: 2,
        title: "Engage Manual Mechanical Brake Release",
        description: "Floor technician accesses Butler maintenance port with manual brake bypass key.",
      },
      {
        id: "s3",
        order: 3,
        title: "Recalibrate Lidar Obstacle Field",
        description: "Verify optical lens cleanliness and clear fault registers.",
        command: "greyctl butler --id B-204 diagnostics --sensor lidar --clear-faults",
      },
    ],
    escalation: {
      level1: "Floor Safety Supervisor",
      level2: "CEM Mechanical Specialist",
      slaMinutes: 30,
    },
    gx: 18.0,
    gy: 10.6,
    row: 1,
    load: 81,
    alert: false,
  },
  {
    id: "sop-cac-03",
    teamId: "team-cac",
    code: "SOP-CAC-103",
    title: "Pick Station PickPut Light Controller Recovery",
    category: "Station & Charging",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "3.1.2",
    author: "CAC Automation Eng",
    updatedAt: "2026-10-18",
    summary: "Restoring communication and LED sequencing for Pick-to-Light station displays during peak dispatch.",
    triggerCondition: "Operator console timeout error or Modbus controller heartbeat drop.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Run Modbus Loopback Test",
        description: "Verify serial RS-485 line continuity on station 04.",
        command: "greyctl p2l test --station 04 --port /dev/ttyUSB0",
      },
      {
        id: "s2",
        order: 2,
        title: "Flash Station Configuration",
        description: "Reload station routing tables from master RCS store.",
        command: "greyctl p2l sync --station 04 --force",
      },
    ],
    escalation: {
      level1: "Station Lead Tech",
      level2: "TAC Application Engineer",
      slaMinutes: 45,
    },
    gx: 21.6,
    gy: 10.6,
    row: 1,
    load: 76,
    alert: false,
  },
  {
    id: "sop-cac-04",
    teamId: "team-cac",
    code: "SOP-CAC-104",
    title: "Battery Fast-Charging Dock Over-Temperature Trip",
    category: "Alert & Incident SOPs",
    priority: "HIGH",
    status: "ACTIVE",
    version: "2.0.4",
    author: "Energy Systems Eng",
    updatedAt: "2026-10-22",
    summary: "Safety protocol for automated Butler charging docks exceeding 45°C thermal threshold.",
    triggerCondition: "Thermal sensor TS-CHG-08 alarm > 45°C or charging current deviation > 15A.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Isolate Charging Bay Power",
        description: "Remotely open contactors for charger bank 08.",
        command: "greyctl charger --bay 08 --power off --reason THERMAL_LIMIT",
      },
      {
        id: "s2",
        order: 2,
        title: "Reroute Low-Battery Bots",
        description: "Re-assign bots queued for bay 08 to auxiliary bank 12.",
        command: "greyctl fleet reroute-charging --from 08 --to 12",
      },
    ],
    escalation: {
      level1: "Facilities & Power Tech",
      level2: "CEM Electrical Engineer",
      slaMinutes: 20,
    },
    gx: 25.2,
    gy: 10.6,
    row: 1,
    load: 72,
    alert: false,
  },

  // --- TAC TEAM ---
  {
    id: "sop-tac-01",
    teamId: "team-tac",
    code: "SOP-TAC-201",
    title: "Butler OTA Firmware Rollback Procedure",
    category: "Firmware Triage",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "4.0.1",
    author: "Priya Nair",
    updatedAt: "2026-10-20",
    summary: "Emergency reversal procedure for Butler MCU firmware v5.12 down to certified LTS build v5.10.8.",
    triggerCondition: "CAN bus packet error rate > 5% after OTA firmware broadcast.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Halt Ongoing OTA Broadcasts",
        description: "Kill active firmware multicast streamer on master fleet controller.",
        command: "greyctl ota abort --stream-id bota-prod-2026-10",
      },
      {
        id: "s2",
        order: 2,
        title: "Initiate Golden Image Restore",
        description: "Flash golden partition B into bootloader active slot.",
        command: "greyctl ota push --image /opt/grey/images/butler-lts-5.10.8.bin --target active-fleet",
      },
      {
        id: "s3",
        order: 3,
        title: "Validate Motor Inverter Telemetry",
        description: "Confirm dual BLDC motor drives report normal encoder sync.",
        command: "greyctl butler audit --telemetry motor-inverters --min-ok 98%",
      },
    ],
    escalation: {
      level1: "TAC Shift Escalation Lead",
      level2: "Firmware Core Engineering VP",
      slaMinutes: 10,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 88,
    alert: false,
  },
  {
    id: "sop-tac-02",
    teamId: "team-tac",
    code: "SOP-TAC-202",
    title: "GreyMatter AI Order Routing Latency Spike",
    category: "AI Routing & Latency",
    priority: "HIGH",
    status: "ALERT",
    version: "3.2.0",
    author: "TAC AI Systems",
    updatedAt: "2026-10-23",
    summary: "Diagnostic path for GreyMatter algorithmic optimizer processing latency exceeding 400ms SLA.",
    triggerCondition: "Batch optimization queue latency > 400ms sustained over 3 consecutive cycles.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Inspect Redis Task Queue Depths",
        description: "Verify queue backpressure on order batching and allocation shards.",
        command: "greyctl greymatter stats --metric queue-depth --shard all",
      },
      {
        id: "s2",
        order: 2,
        title: "Scale Solver Worker Pods",
        description: "Scale Kubernetes inference workers from 8 to 16 replicas.",
        command: "kubectl scale deployment greymatter-solver --replicas=16 -n greyorange-prod",
      },
    ],
    escalation: {
      level1: "TAC Cloud Operations",
      level2: "GreyMatter Platform Tech Lead",
      slaMinutes: 15,
    },
    gx: 18.0,
    gy: 10.6,
    row: 1,
    load: 93,
    alert: true,
  },

  // --- DWS TEAM ---
  {
    id: "sop-dws-01",
    teamId: "team-dws",
    code: "SOP-DWS-301",
    title: "Cross-Belt High-Speed Sorter Jam Mitigation",
    category: "Linear Sorters",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "2.3.0",
    author: "Marcus Zhao",
    updatedAt: "2026-10-19",
    summary: "Safety chute diversion and mechanical belt clearing protocol when optical photocell indicates chute blockage.",
    triggerCondition: "Photocell PE-CHUTE-14 dark state > 2200ms indicating stationary package on high-speed track.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Trigger Sorter Divert Reject Gate",
        description: "Divert upstream parcels to recirculate loop to prevent pileup.",
        command: "greyctl sorter divert --chute 14 --action recirculate",
      },
      {
        id: "s2",
        order: 2,
        title: "Interlock Belt Section Drive",
        description: "Trip variable frequency drive (VFD) for conveyor segment 04.",
        command: "greyctl vfd stop --zone sorter-seg-04",
      },
      {
        id: "s3",
        order: 3,
        title: "Verify Laser Dimensioner Alignment",
        description: "Ensure Volumetric scanner mirrors are unclouded before conveyor restart.",
        command: "greyctl scanner calibrate --scanner dws-top-01",
      },
    ],
    escalation: {
      level1: "DWS Field Automation Lead",
      level2: "CEM Plant Maintenance Director",
      slaMinutes: 20,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 85,
    alert: false,
  },

  // --- IM TEAM ---
  {
    id: "sop-im-01",
    teamId: "team-im",
    code: "SOP-IM-401",
    title: "Major P1 Incident Bridge & Stakeholder Broadcast",
    category: "P1 Incident Command",
    priority: "CRITICAL",
    status: "ACTIVE",
    version: "5.0.0",
    author: "Devon Reed",
    updatedAt: "2026-10-22",
    summary: "Standard incident orchestration bridge initiation, executive comms cadence, and triage channel establishment.",
    triggerCondition: "Warehouse throughput degradation > 30% or site shutdown > 10 minutes.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Spin Up Dedicated P1 War Room",
        description: "Open automated audio conference and Slack/Teams incident bridge.",
        command: "greyctl incident create --severity P1 --title 'Warehouse Throughput Degradation' --auto-page",
      },
      {
        id: "s2",
        order: 2,
        title: "Publish 15-Minute Cadence Status Blast",
        description: "Send initial notification email to customer operations leads and account executive.",
      },
      {
        id: "s3",
        order: 3,
        title: "Log Event Timeline & Evidence Snapshots",
        description: "Capture metric dashboards, server logs, and camera timestamps into incident bundle.",
        command: "greyctl incident snapshot --id INC-2026-8812 --range 1h",
      },
    ],
    escalation: {
      level1: "IM Commander on Duty",
      level2: "Head of Global Customer Success",
      slaMinutes: 5,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 91,
    alert: false,
  },

  // --- PROBLEM MANAGEMENT ---
  {
    id: "sop-pm-01",
    teamId: "team-pm",
    code: "SOP-PM-501",
    title: "Chronic Gearbox Wear RCA & Metallurgical Audit",
    category: "Mechanical & Gearbox RCA",
    priority: "HIGH",
    status: "ACTIVE",
    version: "1.4.0",
    author: "Elena Rostova",
    updatedAt: "2026-10-15",
    summary: "Root Cause Investigation and 5-Why analysis for Butler M500 planetary gearbox backlash anomalies.",
    triggerCondition: "More than 3 gear drive replacements across identical batch within 90 operating days.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Collect Acoustic Vibration Telemetry",
        description: "Extract accelerometer raw spectra from Butler maintenance cradle test run.",
        command: "greyctl telemetry export --unit B-412 --sensor vibration --duration 5m",
      },
      {
        id: "s2",
        order: 2,
        title: "Initiate Supplier CAPA Protocol",
        description: "Issue Corrective and Preventive Action notice to transmission manufacturing partner.",
      },
    ],
    escalation: {
      level1: "Problem Management Lead",
      level2: "Chief Hardware Quality Engineer",
      slaMinutes: 120,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 79,
    alert: false,
  },

  // --- CEM TEAM ---
  {
    id: "sop-cem-01",
    teamId: "team-cem",
    code: "SOP-CEM-601",
    title: "Quarterly Floor Grid Barcode Tagging Overhaul",
    category: "Floor Grid Calibration",
    priority: "MEDIUM",
    status: "ACTIVE",
    version: "2.1.0",
    author: "Tariq Mansoor",
    updatedAt: "2026-10-10",
    summary: "Systematic floor cleaning, 2D datamatrix barcode replacement, and photogrammetric coordinate resurvey.",
    triggerCondition: "Barcode read failure rate > 0.4% during robot transit or scheduled 90-day maintenance window.",
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Print High-Durability Thermal Polycarbonate Tags",
        description: "Generate replacement batches with cryptographically verified checksum codes.",
        command: "greyctl barcode gen --zone A-EAST --range 1000-1450 --material poly-resin",
      },
      {
        id: "s2",
        order: 2,
        title: "Floor Surface Degreasing & Laser Alignment",
        description: "Apply industrial adhesive prep and position tag using crosshair jig.",
      },
      {
        id: "s3",
        order: 3,
        title: "Resurvey Grid with Autonomous Camera Bot",
        description: "Dispatch inspection robot to verify XYZ coordinate millimetric accuracy.",
        command: "greyctl inspect dispatch --zone A-EAST --mode photogrammetry",
      },
    ],
    escalation: {
      level1: "CEM Site Lead",
      level2: "Regional Facilities Operations Manager",
      slaMinutes: 180,
    },
    gx: 14.4,
    gy: 10.6,
    row: 1,
    load: 86,
    alert: false,
  },
];

const STORAGE_KEY_TEAMS = "greyorange_teams_v1";
const STORAGE_KEY_SOPS = "greyorange_sops_v1";

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
      if (
        init &&
        (s.category === "WMS/RCS" ||
          s.category === "Robotics" ||
          s.category === "Hardware" ||
          s.category === "Safety" ||
          s.category === "Firmware")
      ) {
        return { ...s, category: init.category };
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
