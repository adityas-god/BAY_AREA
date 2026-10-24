import { describe, expect, it } from "vitest";
import { addHallToLeft, createInitialHalls } from "@/lib/halls";

describe("addHallToLeft", () => {
  it("adds the new hall to the LEFT of every existing front-row hall", () => {
    const halls = createInitialHalls();
    const prevMin = Math.min(...halls.filter((h) => h.row === 1).map((h) => h.gx));
    const { halls: next, added } = addHallToLeft(halls);
    expect(added.gx).toBeLessThan(prevMin);
    expect(next).toHaveLength(halls.length + 1);
  });

  it("keeps the same spacing as the rest of the row", () => {
    const { added } = addHallToLeft(createInitialHalls());
    expect(added.gx).toBeCloseTo(14.4 - 3.6, 6);
  });

  it("keeps hall names unique across repeated additions", () => {
    let halls = createInitialHalls();
    for (let i = 0; i < 3; i++) halls = addHallToLeft(halls).halls;
    const names = halls.map((h) => h.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain("B12");
  });

  it("returns a pan shift only when the new hall would sit off-screen left", () => {
    const first = addHallToLeft(createInitialHalls());
    let halls = first.halls;
    let panShift = first.panShift;
    // keep adding until the row reaches the left edge
    for (let i = 0; i < 10 && panShift === 0; i++) {
      const r = addHallToLeft(halls);
      halls = r.halls;
      panShift = r.panShift;
    }
    expect(panShift).toBeGreaterThan(0);
  });
});

describe("deleting a hall", () => {
  it("removes exactly the selected hall and keeps the rest", () => {
    const halls = createInitialHalls();
    const victim = halls[3];
    if (!victim) throw new Error("expected initial halls");
    const next = halls.filter((h) => h.id !== victim.id);
    expect(next).toHaveLength(halls.length - 1);
    expect(next.some((h) => h.id === victim.id)).toBe(false);
    expect(next.some((h) => h.name === victim.name)).toBe(false);
    expect(next.some((h) => h.id === halls[0]?.id)).toBe(true);
  });
});
