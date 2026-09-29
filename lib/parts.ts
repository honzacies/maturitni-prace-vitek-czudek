/**
 * The build, described once and used twice: as callouts over the cover photo
 * and as geometry in the 3D scene.
 *
 * Scene units: 1 = 100 mm. X runs across the case (the motherboard tray is on
 * the left, parts stick out towards +X), Y is up, Z is front (+) to back (−),
 * so the I/O panel faces −Z. Sizes are roughly the real components.
 */

export type Vec3 = [number, number, number];

/** A connector on the board that lights up when its part is hovered. */
export type Slot = { id: string; size: Vec3; at: Vec3 };

export type Part = {
  id: string;
  label: string;
  /** Section of the thesis describing its installation. */
  step: string;
  /** Position on the cover photo, in percent. Parts not in the photo omit it. */
  photo?: { n: number; x: number; y: number };
  /** One box per piece — RAM is two modules in one part. */
  boxes: { size: Vec3; at: Vec3 }[];
  /**
   * How far the part rises out of the case (+Y) when exploded. It keeps its X
   * and Z, so it lifts straight out of the spot it was installed in instead of
   * passing through a side panel. The heights are staggered because parts that
   * sit on top of each other in the case would otherwise still overlap.
   */
  explode: Vec3;
  /** Slot it plugs into, highlighted together with the part. */
  slot?: string;
  /**
   * Matches the first column of the component table in the thesis, so the model
   * and its parameters come from the document instead of being repeated here.
   */
  specKey?: string;
  color: string;
};

/** The callout coordinates below describe this photo only. */
export const COVER_IMAGE = "image2.jpeg";

export const CASE = { width: 2.0, height: 4.5, depth: 4.0, wall: 0.05 };

/** Board surface sits just proud of the tray wall. */
const BOARD_X = -0.88;
const ON_BOARD = BOARD_X + 0.015;

export const SLOTS: Slot[] = [
  { id: "socket", size: [0.02, 0.4, 0.4], at: [ON_BOARD, 3.4, -0.85] },
  { id: "dimm", size: [0.03, 1.33, 0.06], at: [ON_BOARD, 3.3, -0.2] },
  { id: "dimm", size: [0.03, 1.33, 0.06], at: [ON_BOARD, 3.3, -0.05] },
  { id: "m2", size: [0.02, 0.22, 0.8], at: [ON_BOARD, 2.85, -0.4] },
  { id: "pcie16", size: [0.03, 0.1, 0.89], at: [ON_BOARD, 2.55, -1.3] },
  { id: "pcie1", size: [0.03, 0.08, 0.25], at: [ON_BOARD, 2.15, -1.55] },
];

/** In the order they were installed — 3.2.1 through 3.2.8. */
export const PARTS: Part[] = [
  {
    id: "cpu",
    specKey: "procesor",
    label: "Procesor",
    step: "3.2.1",
    photo: { n: 1, x: 28, y: 77 },
    boxes: [{ size: [0.04, 0.4, 0.4], at: [ON_BOARD + 0.02, 3.4, -0.85] }],
    explode: [0, 4.7, 0],
    slot: "socket",
    color: "#c3c7cb",
  },
  {
    id: "ssd",
    specKey: "ssd",
    label: "SSD disk",
    step: "3.2.2",
    photo: { n: 2, x: 10, y: 51 },
    boxes: [{ size: [0.03, 0.22, 0.8], at: [ON_BOARD + 0.02, 2.85, -0.4] }],
    explode: [0, 4.65, 0],
    slot: "m2",
    color: "#48535c",
  },
  {
    id: "cooler",
    label: "Chladič",
    step: "3.2.3",
    photo: { n: 3, x: 47, y: 78 },
    boxes: [
      { size: [0.72, 1.25, 0.78], at: [-0.46, 3.4, -0.85] }, // žebra
      { size: [0.1, 1.15, 1.15], at: [-0.05, 3.4, -0.85] }, // ventilátor
    ],
    explode: [0, 6.4, 0],
    slot: "socket",
    color: "#9aa3a8",
  },
  {
    id: "ram",
    specKey: "pamet",
    label: "Paměť RAM",
    step: "3.2.4",
    boxes: [
      { size: [0.31, 1.33, 0.07], at: [-0.71, 3.3, -0.2] },
      { size: [0.31, 1.33, 0.07], at: [-0.71, 3.3, -0.05] },
    ],
    explode: [0, 5.5, 0],
    slot: "dimm",
    color: "#554d63",
  },
  {
    id: "board",
    specKey: "deska",
    label: "Základní deska",
    step: "3.2.5",
    photo: { n: 4, x: 79, y: 54 },
    boxes: [{ size: [0.03, 2.44, 2.44], at: [BOARD_X, 2.9, -0.55] }],
    explode: [0, 0, 0],
    color: "#1f4030",
  },
  {
    id: "psu",
    specKey: "zdroj",
    label: "Zdroj",
    step: "3.2.6",
    photo: { n: 5, x: 35, y: 26 },
    boxes: [{ size: [1.5, 0.86, 1.4], at: [0, 0.5, -1.25] }],
    explode: [0, 4.7, 0],
    color: "#33383c",
  },
  {
    id: "gpu",
    specKey: "grafika",
    label: "Grafická karta",
    step: "3.2.7",
    photo: { n: 6, x: 59, y: 25 },
    boxes: [
      { size: [1.11, 0.38, 2.41], at: [-0.31, 2.36, -0.54] },
      { size: [0.9, 0.06, 0.9], at: [-0.25, 2.16, -0.9] }, // ventilátor
    ],
    explode: [0, 4.44, 0],
    slot: "pcie16",
    color: "#2b3236",
  },
  {
    id: "nic",
    specKey: "sitova",
    label: "Síťová karta",
    step: "3.2.8",
    photo: { n: 7, x: 68, y: 77 },
    boxes: [{ size: [0.9, 0.2, 1.2], at: [-0.42, 2.05, -1.08] }],
    explode: [0, 3.95, 0],
    slot: "pcie1",
    color: "#26384f",
  },
];

/** Not a numbered step, but section 3.2.9 installs it. */
export const FIXTURES: { size: Vec3; at: Vec3; color: string }[] = [
  { size: [1.46, 0.42, 1.7], at: [0, 4.05, 1.05], color: "#202427" }, // optická mechanika
];

export const partsOnPhoto = PARTS.filter(
  (p): p is Part & { photo: NonNullable<Part["photo"]> } => p.photo !== undefined,
).sort((a, b) => a.photo.n - b.photo.n);
