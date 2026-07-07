/** Point on a 4-cusped hypocycloid (astroid): a small circle of radius
 * R/4 rolling inside a fixed circle of radius R. Cusps land every 90°
 * (theta = 0, pi/2, pi, 3pi/2); between cusps the curve dips inward
 * toward roughly half of R. */
export function hypocycloidPoint(theta: number, R: number): { x: number; y: number } {
  const r = R / 4;
  const k = (R - r) / r; // = 3
  return {
    x: (R - r) * Math.cos(theta) + r * Math.cos(k * theta),
    y: (R - r) * Math.sin(theta) - r * Math.sin(k * theta),
  };
}
