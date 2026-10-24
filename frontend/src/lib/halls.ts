import {
  BACK_GY,
  FRONT_GY,
  HALL_LEFT_EDGE_PX,
  HALL_STEP,
  project,
  type Hall,
} from "./iso";

export function createInitialHalls(): Hall[] {
  const frontLoads = [76, 81, 72, 92];
  const backLoads = [88, 74, 79, 71, 83];
  return [
    ...frontLoads.map((load, i) => ({
      id: `h${i + 1}`,
      name: `B${i + 1}`,
      gx: 14.4 + i * HALL_STEP,
      gy: FRONT_GY,
      load,
      alert: load >= 92,
      row: 1,
    })),
    ...backLoads.map((load, i) => ({
      id: `h${i + 5}`,
      name: `B${i + 5}`,
      gx: 18 + i * HALL_STEP,
      gy: BACK_GY,
      load,
      alert: false,
      row: 0,
    })),
  ];
}

/**
 * Adds a new hall to the LEFT end of the front row (existing halls keep
 * their positions). Returns a pan shift that keeps the new hall inside
 * the left edge of the viewport when it would land off-screen.
 */
export function addHallToLeft(halls: Hall[]): {
  halls: Hall[];
  added: Hall;
  panShift: number;
} {
  const front = halls.filter((h) => h.row === 1);
  const minX = front.length ? Math.min(...front.map((h) => h.gx)) : 18;
  const gx = minX - HALL_STEP;
  const nextNum =
    halls.reduce((m, h) => Math.max(m, Number(h.name.replace("B", "")) || 0), 0) + 1;
  const added: Hall = {
    id: `h${nextNum}`,
    name: `B${nextNum}`,
    gx,
    gy: FRONT_GY,
    load: 55 + Math.round(Math.random() * 40),
    alert: false,
    row: 1,
  };
  // leftmost projected screen px of the new hall (front-bottom corner)
  const leftPx = project(gx, FRONT_GY + 2).px;
  return {
    halls: [...halls, added],
    added,
    panShift: leftPx < HALL_LEFT_EDGE_PX ? HALL_LEFT_EDGE_PX - leftPx : 0,
  };
}
