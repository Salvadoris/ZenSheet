/** A 2D coordinate represented as [x, y]. */
export type Point = [number, number];

/** A rectangle defined as [xmin, ymin, xmax, ymax]. */
export type Rect = [number, number, number, number];

export function rectsOverlap(a: Rect, b: Rect): boolean {
  if (a[2] < b[0] || b[2] < a[0]) return false;
  if (a[3] < b[1] || b[3] < a[1]) return false;
  return true;
}
