/**
 * Isometric projection + shared scene constants for the Brickwatt site view.
 * The scene is a hand-rolled SVG isometric renderer — no 3D dependency.
 */

export interface Hall {
  id: string;
  name: string;
  /** grid position of the hall's back-left corner */
  gx: number;
  gy: number;
  /** load percentage 0-100 */
  load: number;
  alert: boolean;
  /** 0 = back row, 1 = front row */
  row: number;
  teamId?: string;
  teamCode?: string;
  title?: string;
}

export interface View {
  x: number;
  y: number;
  k: number;
}

export const FRONT_GY = 10.6;
export const BACK_GY = 6;
export const HALL_STEP = 3.6;
/** left viewBox edge (px) the front row should stay inside of */
export const HALL_LEFT_EDGE_PX = 30;

/**
 * Classic 2:1 Dimetric ("Clash of Clans" Isometric) Projection
 * Exactly 2 horizontal pixels per 1 vertical ground pixel (26.565° pitch angle).
 * Z axis projects directly upward for realistic volumetric building presence.
 */
export const ISO_STEP_X = 28;
export const ISO_STEP_Y = 14;
export const ISO_STEP_Z = 32;

/** Project scene-grid coords (x, y ground plane, z up) to screen px. */
export function project(x: number, y: number, z = 0) {
  return {
    px: (x - y) * ISO_STEP_X + 75,
    py: (x + y) * ISO_STEP_Y - 20 - z * ISO_STEP_Z,
  };
}

/** Reverse project screen px back to scene-grid coords on the z=0 ground plane. */
export function unproject(px: number, py: number) {
  const u = (px - 75) / ISO_STEP_X;
  const v = (py + 20) / ISO_STEP_Y;
  return {
    x: (u + v) / 2,
    y: (v - u) / 2,
  };
}

/** Default fitted view — framed on the hall cluster like the reference. */
export const INITIAL_VIEW: View = { x: 1.7, y: -253.6, k: 1.3 };

