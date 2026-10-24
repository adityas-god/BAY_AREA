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

/** Project scene-grid coords (x, y ground plane, z up) to screen px. */
export function project(x: number, y: number, z = 0) {
  return {
    px: (x - y) * 26 + 75,
    py: (x + y) * 12.5 - 20 - z * 30,
  };
}

/** Reverse project screen px back to scene-grid coords on the z=0 ground plane. */
export function unproject(px: number, py: number) {
  const u = (px - 75) / 26;
  const v = (py + 20) / 12.5;
  return {
    x: (u + v) / 2,
    y: (v - u) / 2,
  };
}

/** Default fitted view — framed on the hall cluster like the reference. */
export const INITIAL_VIEW: View = { x: 1.7, y: -253.6, k: 1.3 };

