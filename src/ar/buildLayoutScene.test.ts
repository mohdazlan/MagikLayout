import { describe, it, expect } from "vitest";
import { buildBorderLayoutScene, type RegionOccupant } from "./buildLayoutScene";

describe("buildBorderLayoutScene", () => {
  it("produces one plate per occupied region, none for empty regions", () => {
    const occupants: RegionOccupant[] = [
      { region: "NORTH", label: "Title", colorHex: "#E8590C" },
      { region: "CENTER", label: "Content", colorHex: "#1D1D1F" },
    ];
    const plates = buildBorderLayoutScene(occupants);
    expect(plates.map((p) => p.region).sort()).toEqual(["CENTER", "NORTH"]);
  });

  it("gives CENTER the full remaining footprint when it is the only occupant", () => {
    const plates = buildBorderLayoutScene([
      { region: "CENTER", label: "Only", colorHex: "#fff" },
    ]);
    expect(plates).toHaveLength(1);
    expect(plates[0].size.w).toBeCloseTo(0.18, 5);
    expect(plates[0].size.d).toBeCloseTo(0.12, 5);
  });

  it("shrinks CENTER symmetrically when all five regions are occupied", () => {
    const all: RegionOccupant[] = (
      ["NORTH", "SOUTH", "EAST", "WEST", "CENTER"] as const
    ).map((region) => ({ region, label: region, colorHex: "#000" }));
    const plates = buildBorderLayoutScene(all);
    expect(plates).toHaveLength(5);
    const center = plates.find((p) => p.region === "CENTER")!;
    // center should be narrower than full footprint on both axes
    expect(center.size.w).toBeLessThan(0.18);
    expect(center.size.d).toBeLessThan(0.12);
    // and centered at the origin when layout is symmetric
    expect(center.position.x).toBeCloseTo(0, 5);
    expect(center.position.z).toBeCloseTo(0, 5);
  });

  it("never produces overlapping plates outside floating point tolerance", () => {
    const all: RegionOccupant[] = (
      ["NORTH", "SOUTH", "EAST", "WEST", "CENTER"] as const
    ).map((region) => ({ region, label: region, colorHex: "#000" }));
    const plates = buildBorderLayoutScene(all);
    const totalArea = plates.reduce((sum, p) => sum + p.size.w * p.size.d, 0);
    // full footprint area (allow tiny floating point slack)
    expect(totalArea).toBeCloseTo(0.18 * 0.12, 5);
  });
});
