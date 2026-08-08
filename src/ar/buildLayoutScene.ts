/**
 * Maps a BorderLayout arrangement to a small set of flat "plates," scaled
 * to sit on a real desk (~18cm wide footprint) for the AR view.
 *
 * Scoped deliberately to ONE layout manager (BorderLayout) for the MIPAC
 * bolt-on, per the "minimal, honest" brief — FlowLayout/GridLayout scenes
 * are a straightforward follow-on once this shape is validated on device.
 *
 * Kept pure (no Three.js types here) so the placement math can be unit
 * tested without a WebGL context or a browser.
 */

export type BorderRegion = "NORTH" | "SOUTH" | "EAST" | "WEST" | "CENTER";

export interface RegionOccupant {
  region: BorderRegion;
  label: string;
  colorHex: string;
}

export interface PlateDescriptor {
  region: BorderRegion;
  label: string;
  colorHex: string;
  /** meters, centered on the desk anchor */
  position: { x: number; y: number; z: number };
  /** meters */
  size: { w: number; h: number; d: number };
}

const FOOTPRINT_WIDTH_M = 0.18; // ~18cm, business-card-and-a-bit wide
const FOOTPRINT_DEPTH_M = 0.12;
const PLATE_HEIGHT_M = 0.01;
const BAND_FRACTION = 0.22; // NORTH/SOUTH/EAST/WEST band thickness as a fraction of footprint

export function buildBorderLayoutScene(
  occupants: RegionOccupant[]
): PlateDescriptor[] {
  const byRegion = new Map(occupants.map((o) => [o.region, o]));
  const bandW = FOOTPRINT_WIDTH_M * BAND_FRACTION;
  const bandD = FOOTPRINT_DEPTH_M * BAND_FRACTION;
  const halfW = FOOTPRINT_WIDTH_M / 2;
  const halfD = FOOTPRINT_DEPTH_M / 2;

  const plates: PlateDescriptor[] = [];

  const north = byRegion.get("NORTH");
  if (north) {
    plates.push({
      region: "NORTH",
      label: north.label,
      colorHex: north.colorHex,
      position: { x: 0, y: PLATE_HEIGHT_M / 2, z: -halfD + bandD / 2 },
      size: { w: FOOTPRINT_WIDTH_M, h: PLATE_HEIGHT_M, d: bandD },
    });
  }

  const south = byRegion.get("SOUTH");
  if (south) {
    plates.push({
      region: "SOUTH",
      label: south.label,
      colorHex: south.colorHex,
      position: { x: 0, y: PLATE_HEIGHT_M / 2, z: halfD - bandD / 2 },
      size: { w: FOOTPRINT_WIDTH_M, h: PLATE_HEIGHT_M, d: bandD },
    });
  }

  const midDepth = FOOTPRINT_DEPTH_M - (north ? bandD : 0) - (south ? bandD : 0);
  const midZ =
    ((north ? bandD : 0) - (south ? bandD : 0)) / 2; // shift center if only one of N/S present

  const west = byRegion.get("WEST");
  if (west) {
    plates.push({
      region: "WEST",
      label: west.label,
      colorHex: west.colorHex,
      position: { x: -halfW + bandW / 2, y: PLATE_HEIGHT_M / 2, z: midZ },
      size: { w: bandW, h: PLATE_HEIGHT_M, d: midDepth },
    });
  }

  const east = byRegion.get("EAST");
  if (east) {
    plates.push({
      region: "EAST",
      label: east.label,
      colorHex: east.colorHex,
      position: { x: halfW - bandW / 2, y: PLATE_HEIGHT_M / 2, z: midZ },
      size: { w: bandW, h: PLATE_HEIGHT_M, d: midDepth },
    });
  }

  const midWidth = FOOTPRINT_WIDTH_M - (west ? bandW : 0) - (east ? bandW : 0);
  const midX = ((west ? bandW : 0) - (east ? bandW : 0)) / 2;

  const center = byRegion.get("CENTER");
  if (center) {
    plates.push({
      region: "CENTER",
      label: center.label,
      colorHex: center.colorHex,
      position: { x: midX, y: PLATE_HEIGHT_M / 2, z: midZ },
      size: { w: midWidth, h: PLATE_HEIGHT_M, d: midDepth },
    });
  }

  return plates;
}
