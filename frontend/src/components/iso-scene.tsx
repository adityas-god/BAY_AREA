import { Minus, Maximize, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  INITIAL_VIEW,
  project,
  type Hall,
  type View,
} from "@/lib/iso";
import { getTeamBuildingCoords, getCategoryPartitionCoords } from "@/lib/teams-sops";

const HALL_FW = 3;
const HALL_FD = 2;
const HALL_H = 1.15;
// Near-infinite zoom out down to 0.5% scale so all campus bay areas can be seen
const MIN_K = 0.005;
const MAX_K = 5;

const flat = (pts: Array<[number, number, number]>, ox = 0, oy = 0) =>
  pts
    .map(([x, y, z]) => {
      const p = project(x + ox, y + oy, z);
      return `${p.px},${p.py}`;
    })
    .join(" ");

const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

function IsoBox({
  x,
  y,
  fw,
  fd,
  h,
  top,
  front,
  side,
  children,
}: {
  x: number;
  y: number;
  fw: number;
  fd: number;
  h: number;
  top: string;
  front: string;
  side: string;
  children?: ReactNode;
}) {
  return (
    <g>
      <polygon points={flat([[0, 0, h], [fw, 0, h], [fw, fd, h], [0, fd, h]], x, y)} fill={top} />
      <polygon points={flat([[fw, 0, 0], [fw, fd, 0], [fw, fd, h], [fw, 0, h]], x, y)} fill={side} />
      <polygon points={flat([[0, fd, 0], [fw, fd, 0], [fw, fd, h], [0, fd, h]], x, y)} fill={front} />
      {children}
    </g>
  );
}

function HallBox({
  hall,
  selected,
  onHallClick,
  onOpenTerminal,
}: {
  hall: Hall;
  selected: boolean;
  onHallClick: (id: string) => void;
  onOpenTerminal?: (id: string) => void;
}) {
  const { gx, gy, load, alert, id } = hall;
  const fw = HALL_FW;
  const fd = HALL_FD;
  const h = HALL_H;
  const barX = 0.35;
  const barW = 2.3;
  const barY = fd - 0.36;
  const barH = 0.16;
  const fillX = barX + (barW * load) / 100;

  return (
    <g
      className={`hall${selected ? " selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onHallClick(id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenTerminal?.(id);
      }}
    >
      {/* orange corner bracket on the ground */}
      <polyline
        points={flat([
          [gx - 0.45, gy + fd - 0.25, 0],
          [gx - 0.45, gy + fd + 0.45, 0],
          [gx + 0.25, gy + fd + 0.45, 0],
        ])}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <g className="hall-body">
        {/* roof */}
        <polygon points={flat([[0, 0, h], [fw, 0, h], [fw, fd, h], [0, fd, h]], gx, gy)} fill="var(--hall-top)" />
        {/* right face */}
        <polygon points={flat([[fw, 0, 0], [fw, fd, 0], [fw, fd, h], [fw, 0, h]], gx, gy)} fill="var(--hall-side)" />
        {/* front face */}
        <polygon points={flat([[0, fd, 0], [fw, fd, 0], [fw, fd, h], [0, fd, h]], gx, gy)} fill="var(--hall-front)" />
        {/* roof vents */}
        {[0, 1].map((r) =>
          [0, 1, 2].map((c) => {
            const p = project(gx + 0.55 + c * 0.95, gy + 0.5 + r, h);
            return (
              <ellipse
                key={`${r}-${c}`}
                cx={p.px}
                cy={p.py}
                rx={10}
                ry={4.9}
                fill="var(--hall-vent)"
                stroke="var(--hall-rim)"
                strokeWidth="1"
              />
            );
          }),
        )}
        {/* door */}
        <polygon
          points={flat([[1.15, fd, 0], [1.85, fd, 0], [1.85, fd, 0.62], [1.15, fd, 0.62]], gx, gy)}
          fill="var(--hall-door)"
        />
        {/* light dash under the roof edge */}
        <polygon
          points={flat([[0.5, fd, 0.85], [1.1, fd, 0.85], [1.1, fd, 0.95], [0.5, fd, 0.95]], gx, gy)}
          fill="var(--foreground)"
          opacity="0.85"
        />
        {/* load bar */}
        <polygon
          points={flat([[barX, barY, h + 0.01], [barX + barW, barY, h + 0.01], [barX + barW, barY + barH, h + 0.01], [barX, barY + barH, h + 0.01]], gx, gy)}
          fill="oklch(0.17 0.01 260)"
        />
        <polygon
          points={flat([[barX, barY, h + 0.02], [fillX, barY, h + 0.02], [fillX, barY + barH, h + 0.02], [barX, barY + barH, h + 0.02]], gx, gy)}
          fill={alert ? "var(--destructive)" : "var(--accent)"}
        />
      </g>
      {/* selection / hover outline */}
      <polygon
        className="hall-hull"
        points={flat([[0, 0, h], [fw, 0, h], [fw, 0, 0], [fw, fd, 0], [0, fd, 0], [0, fd, h]], gx, gy)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
      />
      {selected && (() => {
        const p = project(gx + fw / 2, gy + fd / 2, h + 0.65);
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTerminal?.(id);
            }}
          >
            <rect
              x={p.px - 64}
              y={p.py - 14}
              width={128}
              height={26}
              rx={3}
              fill="oklch(0.1 0.005 270 / 0.95)"
              stroke="var(--accent)"
              strokeWidth={1.5}
            />
            <text
              x={p.px}
              y={p.py + 4}
              textAnchor="middle"
              className="fill-accent font-mono font-bold text-[10px] tracking-wider pointer-events-none select-none"
            >
              [OPEN TERMINAL]
            </text>
          </g>
        );
      })()}
    </g>
  );
}

const DARK_BOX = {
  top: "oklch(0.16 0.006 260)",
  front: "oklch(0.28 0.008 260)",
  side: "oklch(0.22 0.008 260)",
};

export interface DistrictInfo {
  id: string;
  code: string;
  name: string;
  lead: string;
  index: number;
  sopCount: number;
  alertCount: number;
  avgCompliance: number;
  baseGx: number;
  baseGy: number;
  isActive: boolean;
  bounds: {
    ox: number;
    oy: number;
    width: number;
    depth: number;
    centerX: number;
    centerY: number;
  };
  catCounts?: number[];
}

function TeamHQBuilding({
  district,
  onSelectTeamHQ,
}: {
  district: DistrictInfo;
  onSelectTeamHQ?: (teamId: string) => void;
}) {
  const { id, code, index, isActive, alertCount } = district;
  const { bx, by, isLeft, fw, fd, h } = getTeamBuildingCoords(index);

  const roofCenterP = project(bx + fw / 2, by + fd / 2, h + 0.85);

  return (
    <g
      className="team-hq-building cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelectTeamHQ?.(id);
      }}
    >
      {/* Ground shadow / footprint */}
      <polygon
        points={flat([[0, 0, 0], [fw, 0, 0], [fw, fd, 0], [0, fd, 0]], bx, by)}
        fill="oklch(0.12 0.005 260 / 0.8)"
      />

      {/* Main Operations Building Box */}
      <IsoBox
        x={bx}
        y={by}
        fw={fw}
        fd={fd}
        h={h}
        top="var(--wh-roof)"
        front="var(--wh-front)"
        side="var(--wh-side)"
      >
        {/* 3 Loading Dock Doors along the front face */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <polygon
              points={flat(
                [
                  [1.1 + i * 2.5, fd, 0],
                  [2.3 + i * 2.5, fd, 0],
                  [2.3 + i * 2.5, fd, 0.95],
                  [1.1 + i * 2.5, fd, 0.95],
                ],
                bx,
                by,
              )}
              fill="var(--hall-door)"
            />
            {/* Dock indicator light */}
            <polygon
              points={flat(
                [
                  [1.5 + i * 2.5, fd, 1.05],
                  [1.9 + i * 2.5, fd, 1.05],
                  [1.9 + i * 2.5, fd, 1.12],
                  [1.5 + i * 2.5, fd, 1.12],
                ],
                bx,
                by,
              )}
              fill={isActive ? "var(--accent)" : "oklch(0.7 0.2 145)"}
            />
          </g>
        ))}
      </IsoBox>

      {/* Roof ridge accent */}
      <polyline
        points={flat([[0, 0, h], [fw, 0, h]], bx, by)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.38 0.01 260)"}
        strokeWidth="1.2"
      />

      {/* Adjacent Cargo Crates Stack (on the outer flank of the building) */}
      {isLeft ? (
        <g pointerEvents="none">
          <IsoBox x={bx - 1.2} y={by + 1.1} fw={1.0} fd={0.9} h={0.7} {...DARK_BOX} />
          <IsoBox x={bx - 1.2} y={by + 2.2} fw={0.9} fd={0.8} h={0.65} {...DARK_BOX} />
          <IsoBox x={bx - 0.9} y={by + 1.5} fw={0.8} fd={0.7} h={0.6} {...DARK_BOX} />
        </g>
      ) : (
        <g pointerEvents="none">
          <IsoBox x={bx + fw + 0.3} y={by + 1.1} fw={1.0} fd={0.9} h={0.7} {...DARK_BOX} />
          <IsoBox x={bx + fw + 0.3} y={by + 2.2} fw={0.9} fd={0.8} h={0.65} {...DARK_BOX} />
          <IsoBox x={bx + fw + 0.4} y={by + 1.5} fw={0.8} fd={0.7} h={0.6} {...DARK_BOX} />
        </g>
      )}

      {/* Hover / Active selection perimeter highlight */}
      <polygon
        points={flat(
          [
            [0, 0, h],
            [fw, 0, h],
            [fw, 0, 0],
            [fw, fd, 0],
            [0, fd, 0],
            [0, fd, h],
          ],
          bx,
          by,
        )}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={isActive ? "2" : "1"}
        className="transition-all group-hover:stroke-accent group-hover:stroke-[2px]"
      />

      {/* Floating Holographic HQ Sign */}
      <g transform={`translate(${roofCenterP.px}, ${roofCenterP.py - 14})`}>
        <rect
          x={-68}
          y={-14}
          width={136}
          height={30}
          rx={3}
          fill="oklch(0.1 0.005 260 / 0.95)"
          stroke={isActive ? "var(--accent)" : "oklch(0.35 0.01 260)"}
          strokeWidth={isActive ? 1.5 : 1}
          className="transition-colors group-hover:stroke-accent"
        />
        {/* Pulsing indicator light */}
        <circle
          cx={-56}
          cy={1}
          r={3}
          fill={alertCount > 0 ? "var(--destructive)" : "oklch(0.72 0.2 145)"}
        />
        <text
          x={-46}
          y={-2}
          className="font-mono text-[9px] font-bold tracking-wider select-none pointer-events-none"
          fill={isActive ? "var(--accent)" : "oklch(0.88 0.01 260)"}
        >
          0{index + 1} // {code} HQ
        </text>
        <text
          x={-46}
          y={9}
          className="font-mono text-[8px] font-medium tracking-tight select-none pointer-events-none fill-muted-foreground"
        >
          MANAGER BRIEFING
        </text>
      </g>
    </g>
  );
}

export interface CategoryPartitionInfo {
  id: string;
  teamId: string;
  teamCode: string;
  teamIndex: number;
  catIndex: number;
  name: string;
  sopCount: number;
  originGx: number;
  originGy: number;
  width: number;
  depth: number;
  isActive: boolean;
}

function CategoryPartition({
  partition,
  onAddSopToCategory,
  onDeleteCategory,
}: {
  partition: CategoryPartitionInfo;
  onAddSopToCategory?: (teamId: string, categoryName: string) => void;
  onDeleteCategory?: (teamId: string, categoryName: string) => void;
}) {
  const { teamId, name, sopCount, originGx, originGy, width, depth, isActive } = partition;
  const headerP = project(originGx + 0.6, originGy + 1.2, 0);

  return (
    <g className="category-partition-bay">
      {/* Partition Floor Bay Plate */}
      <polygon
        points={flat([[0, 0, 0], [width, 0, 0], [width, depth, 0], [0, depth, 0]], originGx, originGy)}
        fill={isActive ? "oklch(0.78 0.18 55 / 0.035)" : "oklch(0.18 0.005 260 / 0.12)"}
        stroke={isActive ? "oklch(0.78 0.18 55 / 0.55)" : "oklch(0.3 0.008 260)"}
        strokeWidth={isActive ? 1.3 : 0.9}
        strokeDasharray="4 4"
      />

      {/* 4 Corner cybernetic brackets on partition bay */}
      <polyline
        points={flat([[0, 1.8, 0], [0, 0, 0], [1.8, 0, 0]], originGx, originGy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={1.8}
      />
      <polyline
        points={flat([[width - 1.8, 0, 0], [width, 0, 0], [width, 1.8, 0]], originGx, originGy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={1.8}
      />
      <polyline
        points={flat([[width, depth - 1.8, 0], [width, depth, 0], [width - 1.8, depth, 0]], originGx, originGy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={1.8}
      />
      <polyline
        points={flat([[1.8, depth, 0], [0, depth, 0], [0, depth - 1.8, 0]], originGx, originGy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={1.8}
      />

      {/* Interactive Category Holographic Badge */}
      <g transform={`translate(${headerP.px}, ${headerP.py - 14})`}>
        <rect
          x={0}
          y={-14}
          width={220}
          height={28}
          rx={3}
          fill="oklch(0.09 0.005 260 / 0.95)"
          stroke={isActive ? "var(--accent)" : "oklch(0.35 0.008 260)"}
          strokeWidth={1.2}
          className="shadow-md"
        />
        {/* Accent dot */}
        <circle cx={10} cy={0} r={3} fill={isActive ? "var(--accent)" : "oklch(0.5 0.01 260)"} />

        {/* Category Label */}
        <text
          x={20}
          y={-2}
          className="font-mono text-[9px] font-bold tracking-wider select-none pointer-events-none"
          fill={isActive ? "var(--accent)" : "oklch(0.9 0.01 260)"}
        >
          {name.toUpperCase()}
        </text>
        <text
          x={20}
          y={8}
          className="font-mono text-[8px] select-none pointer-events-none fill-muted-foreground"
        >
          {sopCount} {sopCount === 1 ? "SOP CONFIGURED" : "SOPS CONFIGURED"}
        </text>

        {/* Clickable [+ SOP] Trigger directly inside this bay */}
        {onAddSopToCategory && (
          <g
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onAddSopToCategory(teamId, name);
            }}
          >
            <rect
              x={152}
              y={-10}
              width={60}
              height={20}
              rx={2}
              fill="oklch(0.78 0.18 55 / 0.15)"
              stroke="var(--accent)"
              strokeWidth={1}
              className="transition-colors group-hover:fill-accent/35"
            />
            <text
              x={182}
              y={3}
              textAnchor="middle"
              className="fill-accent font-mono text-[9px] font-bold select-none pointer-events-none"
            >
              + SOP
            </text>
          </g>
        )}

        {/* Delete Category button if empty */}
        {sopCount === 0 && onDeleteCategory && (
          <g
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory(teamId, name);
            }}
          >
            <rect
              x={225}
              y={-10}
              width={20}
              height={20}
              rx={2}
              fill="oklch(0.18 0.01 260 / 0.9)"
              stroke="var(--destructive)"
              strokeWidth={1}
              className="transition-colors group-hover:fill-destructive/30"
            />
            <text
              x={235}
              y={4}
              textAnchor="middle"
              className="fill-destructive font-mono text-[10px] font-bold select-none pointer-events-none"
            >
              ✕
            </text>
          </g>
        )}
      </g>
    </g>
  );
}

function AddCategoryPad({
  teamId,
  teamIndex,
  nextCatIndex,
  catCounts = [],
  onAddCategoryZone,
}: {
  teamId: string;
  teamIndex: number;
  nextCatIndex: number;
  catCounts?: number[];
  onAddCategoryZone?: (teamId: string) => void;
}) {
  const pad = getCategoryPartitionCoords(teamIndex, nextCatIndex, 0, catCounts);
  const padP = project(pad.originGx + pad.width / 2, pad.originGy + 4.0, 0);

  return (
    <g
      className="add-category-pad cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onAddCategoryZone?.(teamId);
      }}
    >
      <polygon
        points={flat([[0, 0, 0], [pad.width, 0, 0], [pad.width, 8.0, 0], [0, 8.0, 0]], pad.originGx, pad.originGy)}
        fill="oklch(0.14 0.005 260 / 0.12)"
        stroke="oklch(0.35 0.01 260)"
        strokeWidth={1}
        strokeDasharray="4 6"
        className="transition-all group-hover:stroke-accent group-hover:stroke-[1.5px] group-hover:fill-accent/5"
      />
      <g transform={`translate(${padP.px}, ${padP.py})`}>
        <rect
          x={-80}
          y={-14}
          width={160}
          height={28}
          rx={3}
          fill="oklch(0.1 0.005 260 / 0.92)"
          stroke="oklch(0.4 0.01 260)"
          strokeWidth={1}
          className="transition-colors group-hover:stroke-accent group-hover:fill-accent/10"
        />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[9px] font-bold tracking-wider select-none pointer-events-none group-hover:fill-accent"
        >
          + ADD CATEGORY ZONE
        </text>
      </g>
    </g>
  );
}

function DistrictGround({ district }: { district: DistrictInfo }) {
  const { code, index, bounds, isActive } = district;
  const { ox, oy, width: W, depth: D } = bounds;

  const groundLabelP = project(ox + 2.0, oy + 2.4, 0);

  return (
    <g className="district-ground pointer-events-none">
      {/* Ground zone boundary - dynamically expands with every category bay and SOP added! */}
      <polygon
        points={flat([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]], ox, oy)}
        fill={isActive ? "oklch(0.78 0.18 55 / 0.04)" : "oklch(0.18 0.005 260 / 0.18)"}
        stroke={isActive ? "var(--accent)" : "oklch(0.32 0.008 260)"}
        strokeWidth={isActive ? 1.6 : 1}
        strokeDasharray={isActive ? "none" : "6 6"}
      />

      {/* Cybernetic Corner Brackets */}
      <polyline
        points={flat([[0, 3.5, 0], [0, 0, 0], [3.5, 0, 0]], ox, oy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.42 0.01 260)"}
        strokeWidth={2.2}
      />
      <polyline
        points={flat([[W - 3.5, 0, 0], [W, 0, 0], [W, 3.5, 0]], ox, oy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.42 0.01 260)"}
        strokeWidth={2.2}
      />
      <polyline
        points={flat([[W, D - 3.5, 0], [W, D, 0], [W - 3.5, D, 0]], ox, oy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.42 0.01 260)"}
        strokeWidth={2.2}
      />
      <polyline
        points={flat([[3.5, D, 0], [0, D, 0], [0, D - 3.5, 0]], ox, oy)}
        fill="none"
        stroke={isActive ? "var(--accent)" : "oklch(0.42 0.01 260)"}
        strokeWidth={2.2}
      />

      {/* Subtle Ground Sector Stamp */}
      <text
        x={groundLabelP.px}
        y={groundLabelP.py}
        className="font-mono text-[11px] font-bold tracking-[0.24em] select-none"
        fill={isActive ? "var(--accent)" : "oklch(0.42 0.01 260)"}
        opacity={isActive ? 0.95 : 0.5}
      >
        // DISTRICT 0{index + 1} · {code} CAMPUS SECTOR
      </text>
    </g>
  );
}

function DistrictBillboard({
  district,
  onSelectDistrict,
  viewK = 1,
}: {
  district: DistrictInfo;
  onSelectDistrict?: (id: string) => void;
  viewK?: number;
}) {
  const { id, code, index, sopCount, alertCount, avgCompliance, baseGx, baseGy, isActive } = district;
  const signGx = baseGx - 0.6;
  const signGy = baseGy - 0.6;
  const groundP = project(signGx, signGy, 0);
  const holoH = 1.6;
  const topP = project(signGx, signGy, holoH);

  // When zoomed out far, scale billboard badge up slightly so district names remain readable as landmarks
  const badgeScale = Math.min(2.5, Math.max(1, 0.75 / viewK));

  return (
    <g
      className="district-billboard cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelectDistrict?.(id);
      }}
    >
      {/* Ground Anchor Pad */}
      <polygon
        points={flat([[-0.4, -0.4, 0], [0.4, -0.4, 0], [0.4, 0.4, 0], [-0.4, 0.4, 0]], signGx, signGy)}
        fill="oklch(0.14 0.005 260)"
        stroke={isActive ? "var(--accent)" : "oklch(0.35 0.01 260)"}
        strokeWidth="1"
      />
      <circle cx={groundP.px} cy={groundP.py} r={3} fill={isActive ? "var(--accent)" : "oklch(0.45 0.01 260)"} />

      {/* Vertical Hologram Projector Light Beam */}
      <line
        x1={groundP.px}
        y1={groundP.py}
        x2={topP.px}
        y2={topP.py}
        stroke={isActive ? "var(--accent)" : "oklch(0.4 0.01 260)"}
        strokeWidth={1.5}
        strokeDasharray="3 3"
        opacity={0.7}
      />

      {/* Floating Holographic Glassmorphic Badge with adaptive scale */}
      <g transform={`translate(${topP.px}, ${topP.py - 22}) scale(${badgeScale})`}>
        <rect
          x={-68}
          y={-14}
          width={136}
          height={32}
          rx={3}
          fill="oklch(0.1 0.005 260 / 0.94)"
          stroke={isActive ? "var(--accent)" : alertCount > 0 ? "var(--destructive)" : "oklch(0.35 0.01 260)"}
          strokeWidth={isActive ? 1.5 : 1}
          className="transition-colors group-hover:stroke-accent"
        />

        {/* Status Indicator Beacon */}
        <circle
          cx={-56}
          cy={2}
          r={3}
          fill={alertCount > 0 ? "var(--destructive)" : "oklch(0.72 0.2 145)"}
        />

        <text
          x={-46}
          y={-2}
          className="font-mono text-[9px] font-bold tracking-wider select-none pointer-events-none"
          fill={isActive ? "var(--accent)" : "oklch(0.88 0.01 260)"}
        >
          0{index + 1} // {code} DISTRICT
        </text>

        <text
          x={-46}
          y={10}
          className="font-mono text-[8px] select-none pointer-events-none"
          fill="oklch(0.55 0.01 260)"
        >
          {sopCount} SOPS · {alertCount > 0 ? `${alertCount} ALERT` : `${avgCompliance}% COMP`}
        </text>
      </g>
    </g>
  );
}

function CampusAvenues() {
  const L = (a: { px: number; py: number }, b: { px: number; py: number }) => ({
    x1: a.px,
    y1: a.py,
    x2: b.px,
    y2: b.py,
  });

  return (
    <g className="campus-avenues pointer-events-none" opacity="0.6">
      {/* Grand Central Boulevard between Left (Col 0) and Right (Col 1) Districts */}
      <line
        {...L(project(105.0, -30), project(105.0, 900))}
        stroke="oklch(0.32 0.01 260)"
        strokeWidth="1.4"
        strokeDasharray="8 8"
      />
      <line
        {...L(project(108.0, -30), project(108.0, 900))}
        stroke="oklch(0.32 0.01 260)"
        strokeWidth="1.4"
        strokeDasharray="8 8"
      />
      <line
        {...L(project(106.5, -30), project(106.5, 900))}
        stroke="oklch(0.24 0.008 260)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* East-West Cross Avenues separating Rows */}
      <line
        {...L(project(0, 130.0), project(300, 130.0))}
        stroke="oklch(0.3 0.008 260)"
        strokeWidth="1.3"
        strokeDasharray="8 8"
      />
      <line
        {...L(project(0, 280.0), project(300, 280.0))}
        stroke="oklch(0.3 0.008 260)"
        strokeWidth="1.3"
        strokeDasharray="8 8"
      />
    </g>
  );
}

export function IsoScene({
  halls,
  districts = [],
  categoryPartitions = [],
  selectedId,
  onSelectHall,
  onSelectDistrict,
  onSelectTeamHQ,
  onOpenTerminal,
  onAddSopToCategory,
  onAddCategoryZone,
  onDeleteCategory,
  view,
  onViewChange,
  onSizeChange,
}: {
  halls: Hall[];
  districts?: DistrictInfo[];
  categoryPartitions?: CategoryPartitionInfo[];
  selectedId: string | null;
  onSelectHall: (id: string | null) => void;
  onSelectDistrict?: (id: string) => void;
  onSelectTeamHQ?: (teamId: string) => void;
  onOpenTerminal?: (id: string) => void;
  onAddSopToCategory?: (teamId: string, categoryName: string) => void;
  onAddCategoryZone?: (teamId: string) => void;
  onDeleteCategory?: (teamId: string, categoryName: string) => void;
  view: View;
  onViewChange: (v: View) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ width: 1920, height: 1080 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const onViewRef = useRef(onViewChange);
  onViewRef.current = onViewChange;
  const dragRef = useRef({ active: false, moved: 0, lastX: 0, lastY: 0, captured: false });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const s = { width: Math.round(rect.width), height: Math.round(rect.height) };
        setSize(s);
        onSizeChange?.(s);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [onSizeChange]);

  const toViewBox = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y, scale: ctm.a };
  };

  // Wheel zoom, anchored at the cursor. Native non-passive listener.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toViewBox(e.clientX, e.clientY);
      if (!p) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const v = viewRef.current;
      const k2 = clampK(v.k * Math.exp(-dy * 0.0015));
      onViewRef.current({
        x: p.x - ((p.x - v.x) * k2) / v.k,
        y: p.y - ((p.y - v.y) * k2) / v.k,
        k: k2,
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const p = toViewBox(r.left + r.width / 2, r.top + r.height / 2);
    if (!p) return;
    const v = viewRef.current;
    const k2 = clampK(v.k * factor);
    onViewRef.current({
      x: p.x - ((p.x - v.x) * k2) / v.k,
      y: p.y - ((p.y - v.y) * k2) / v.k,
      k: k2,
    });
  };

  const animateTo = (target: View, duration = 650) => {
    const startX = viewRef.current.x;
    const startY = viewRef.current.y;
    const startK = viewRef.current.k;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      onViewRef.current({
        x: startX + (target.x - startX) * ease,
        y: startY + (target.y - startY) * ease,
        k: startK + (target.k - startK) * ease,
      });
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  };

  const fitAll = () => {
    let minPx = Infinity;
    let maxPx = -Infinity;
    let minPy = Infinity;
    let maxPy = -Infinity;

    const includePoint = (gx: number, gy: number, gz = 0) => {
      const p = project(gx, gy, gz);
      if (p.px < minPx) minPx = p.px;
      if (p.px > maxPx) maxPx = p.px;
      if (p.py < minPy) minPy = p.py;
      if (p.py > maxPy) maxPy = p.py;
    };

    // Category partition bay plates
    for (const cp of categoryPartitions) {
      includePoint(cp.originGx, cp.originGy);
      includePoint(cp.originGx + cp.width, cp.originGy);
      includePoint(cp.originGx + cp.width, cp.originGy + cp.depth);
      includePoint(cp.originGx, cp.originGy + cp.depth);
    }

    // Districts
    for (const d of districts) {
      includePoint(d.bounds.ox, d.bounds.oy);
      includePoint(d.bounds.ox + d.bounds.width, d.bounds.oy);
      includePoint(d.bounds.ox + d.bounds.width, d.bounds.oy + d.bounds.depth);
      includePoint(d.bounds.ox, d.bounds.oy + d.bounds.depth);
    }

    // SOP Halls
    for (const h of halls) {
      includePoint(h.gx, h.gy, 0);
      includePoint(h.gx + HALL_FW, h.gy + HALL_FD, HALL_H);
    }

    if (!isFinite(minPx) || !isFinite(maxPx) || maxPx <= minPx) {
      animateTo(INITIAL_VIEW);
      return;
    }

    const padding = 100;
    const availW = Math.max(100, size.width - padding * 2);
    const availH = Math.max(100, size.height - padding * 2);
    const fitK = clampK(Math.min(availW / (maxPx - minPx), availH / (maxPy - minPy), 1.0));
    const midPx = (minPx + maxPx) / 2;
    const midPy = (minPy + maxPy) / 2;

    animateTo({
      x: size.width / 2 - midPx * fitK,
      y: size.height / 2 - midPy * fitK,
      k: fitK,
    });
  };

  const handleHallClick = (id: string) => {
    if (dragRef.current.moved >= 6) return;
    onSelectHall(id);
  };

  // Painter's algorithm: draw far objects (small x+y) first.
  const items: Array<{ key: number; el: ReactNode }> = [];
  for (const hall of halls) {
    items.push({
      key: hall.gx + hall.gy,
      el: (
        <HallBox
          key={hall.id}
          hall={hall}
          selected={hall.id === selectedId}
          onHallClick={handleHallClick}
          onOpenTerminal={onOpenTerminal}
        />
      ),
    });
  }

  // Add District Holographic Billboards
  for (const d of districts) {
    items.push({
      key: (d.baseGx - 0.6) + (d.baseGy - 0.6) + 1.6,
      el: (
        <DistrictBillboard
          key={`billboard-${d.id}`}
          district={d}
          onSelectDistrict={onSelectDistrict}
          viewK={view.k}
        />
      ),
    });

    // Add Team Operations Headquarters Building for every team
    const bCoords = getTeamBuildingCoords(d.index);
    items.push({
      key: bCoords.bx + bCoords.by + 2.5,
      el: (
        <TeamHQBuilding
          key={`team-hq-${d.id}`}
          district={d}
          onSelectTeamHQ={onSelectTeamHQ}
        />
      ),
    });
  }

  items.sort((a, b) => a.key - b.key);

  // Dynamic infinite full-screen grid bounds calculated from current view and screen dimensions
  const marginPx = Math.max(size.width, size.height);
  const sxMin = -marginPx;
  const sxMax = size.width + marginPx;
  const syMin = -marginPx;
  const syMax = size.height + marginPx;

  const pxMin = (sxMin - view.x) / view.k;
  const pxMax = (sxMax - view.x) / view.k;
  const pyMin = (syMin - view.y) / view.k;
  const pyMax = (syMax - view.y) / view.k;

  const Umin = (pxMin - 75) / 26;
  const Umax = (pxMax - 75) / 26;
  const Vmin = (pyMin + 20) / 12.5;
  const Vmax = (pyMax + 20) / 12.5;

  const rawMinX = (Umin + Vmin) / 2;
  const rawMaxX = (Umax + Vmax) / 2;
  const rawMinY = (Vmin - Umax) / 2;
  const rawMaxY = (Vmax - Umin) / 2;

  // Adaptive step to keep line count capped (~40-70 lines) even at near-infinite zoom out
  const spanX = Math.abs(rawMaxX - rawMinX);
  const spanY = Math.abs(rawMaxY - rawMinY);
  const maxSpan = Math.max(spanX, spanY);
  let step = 2;
  while (maxSpan / step > 70) {
    step *= 2;
  }

  const startX = Math.floor(rawMinX / step) * step;
  const endX = Math.ceil(rawMaxX / step) * step;
  const startY = Math.floor(rawMinY / step) * step;
  const endY = Math.ceil(rawMaxY / step) * step;

  const gridXValues: number[] = [];
  for (let gx = startX; gx <= endX && gridXValues.length < 100; gx += step) gridXValues.push(gx);

  const gridYValues: number[] = [];
  for (let gy = startY; gy <= endY && gridYValues.length < 100; gy += step) gridYValues.push(gy);

  const L = (a: { px: number; py: number }, b: { px: number; py: number }) => ({
    x1: a.px,
    y1: a.py,
    x2: b.px,
    y2: b.py,
  });

  const alertHalls = halls.filter((h) => h.alert);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[var(--ground)]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="h-full w-full select-none"
        style={{ backgroundColor: "var(--ground)", cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={(e) => {
          dragRef.current = { active: true, moved: 0, lastX: e.clientX, lastY: e.clientY, captured: false };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d.active) return;
          const dx = e.clientX - d.lastX;
          const dy = e.clientY - d.lastY;
          d.moved += Math.abs(dx) + Math.abs(dy);
          d.lastX = e.clientX;
          d.lastY = e.clientY;
          if (d.moved < 4) return;
          // capture only once a real drag starts, so clicks still land on halls
          if (!d.captured) {
            e.currentTarget.setPointerCapture(e.pointerId);
            d.captured = true;
          }
          const p = toViewBox(e.clientX, e.clientY);
          if (!p) return;
          const v = viewRef.current;
          onViewRef.current({
            x: v.x + dx / (p.scale || 1),
            y: v.y + dy / (p.scale || 1),
            k: v.k,
          });
        }}
        onPointerUp={() => {
          dragRef.current.active = false;
          setDragging(false);
        }}
        onPointerCancel={() => {
          dragRef.current.active = false;
          setDragging(false);
        }}
        onClick={() => {
          if (dragRef.current.moved < 6) onSelectHall(null);
        }}
      >
        {/* Base full screen ground fill */}
        <rect x="0" y="0" width={size.width} height={size.height} fill="var(--ground)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* Edge-to-edge full screen isometric grid */}
          {gridXValues.map((gx) => (
            <line
              key={`x-${gx}`}
              {...L(project(gx, gx - Umax), project(gx, gx - Umin))}
              stroke="var(--grid)"
              strokeWidth="1"
            />
          ))}
          {gridYValues.map((gy) => (
            <line
              key={`y-${gy}`}
              {...L(project(gy + Umin, gy), project(gy + Umax, gy))}
              stroke="var(--grid)"
              strokeWidth="1"
            />
          ))}

          {/* Campus Boulevards & Cross Avenues */}
          <CampusAvenues />

          {/* District Ground Zones */}
          {districts.map((d) => (
            <DistrictGround key={`ground-${d.id}`} district={d} />
          ))}

          {/* Categorized Partition Bays with Dynamic Expanding Dimensions */}
          {categoryPartitions.map((cp) => (
            <CategoryPartition
              key={`category-${cp.id}`}
              partition={cp}
              onAddSopToCategory={onAddSopToCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}

          {/* Add Category Bay Interactive Ground Pad for each District */}
          {districts.map((d) => {
            const teamCatCount = categoryPartitions.filter((cp) => cp.teamId === d.id).length;
            return (
              <AddCategoryPad
                key={`add-cat-pad-${d.id}`}
                teamId={d.id}
                teamIndex={d.index}
                nextCatIndex={teamCatCount}
                catCounts={d.catCounts}
                onAddCategoryZone={onAddCategoryZone}
              />
            );
          })}

          {/* diagonal site stripes, lower left */}
          {[2, 5.5, 9, 12.5, 16, 19.5, 23, 26.5].map((x) => (
            <line
              key={x}
              {...L(project(x, 44), project(x, 20))}
              stroke="var(--grid)"
              strokeWidth="1"
              opacity="0.6"
            />
          ))}

          {/* 3D isometric sorted buildings & billboards */}
          {items.map((it) => it.el)}

          {/* alert callouts */}
          {alertHalls.map((alertHall) => {
            const a = project(alertHall.gx + 1.5, alertHall.gy, HALL_H);
            const tx = a.px + 54;
            const ty = a.py - 54;
            return (
              <g key={`alert-callout-${alertHall.id}`} pointerEvents="none">
                <line x1={a.px} y1={a.py - 8} x2={tx} y2={ty + 40} stroke="var(--destructive)" strokeWidth="1.5" opacity="0.8" />
                <circle cx={a.px} cy={a.py} r="3" fill="var(--destructive)" />
                <rect x={tx} y={ty} width="176" height="44" rx="3" fill="var(--tooltip)" stroke="var(--border)" />
                <text x={tx + 10} y={ty + 16} className="fill-destructive font-mono" fontSize="9" letterSpacing="2">
                  ALERT · {alertHall.teamCode || "CRITICAL"}
                </text>
                <text x={tx + 10} y={ty + 34} className="fill-foreground font-mono" fontSize="11">
                  {alertHall.name} · inlet 31.2°C
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 select-none z-20">
        <div className="flex flex-col rounded border border-border/80 bg-panel/90 shadow-2xl backdrop-blur-md overflow-hidden">
          <button
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => zoomBy(1.3)}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent/20 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-border/60" />
          <div
            className="px-1 py-1 text-center font-mono text-[9px] font-bold text-muted-foreground tracking-tighter"
            title={`Current zoom scale: ${(view.k * 100).toFixed(1)}%`}
          >
            {view.k < 0.1 ? `${(view.k * 100).toFixed(1)}%` : `${Math.round(view.k * 100)}%`}
          </div>
          <div className="h-px bg-border/60" />
          <button
            aria-label="Zoom out"
            title="Zoom out (infinite)"
            onClick={() => zoomBy(1 / 1.3)}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent/20 hover:text-accent"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <button
          aria-label="Fit all bay areas"
          title="Fit all bay areas and districts in view"
          onClick={fitAll}
          className="flex h-8 items-center gap-1.5 rounded border border-border/80 bg-panel/90 px-2.5 text-xs font-mono font-bold text-muted-foreground shadow-2xl backdrop-blur-md transition-colors hover:border-accent hover:text-accent hover:bg-accent/10"
        >
          <Maximize className="h-3.5 w-3.5 text-accent" />
          <span>ALL BAYS</span>
        </button>

        <button
          aria-label="Reset view"
          title="Reset to default district view"
          onClick={() => animateTo(INITIAL_VIEW)}
          className="flex h-8 w-8 items-center justify-center rounded border border-border/80 bg-panel/90 text-muted-foreground shadow-2xl backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
