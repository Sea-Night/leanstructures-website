/** One-shot channel for handing the swipe gesture's velocity from
 * PageSwipeNav to MobileNavDots without coupling them directly — set
 * right before a swipe-triggered navigation, consumed (and cleared) by
 * the dots' pathname-change effect. A tap-triggered navigation never
 * sets this, so it reads back 0 (no initial kick) for taps. */
let lastSwipeVelocityX = 0;

export function setLastSwipeVelocity(v: number) {
  lastSwipeVelocityX = v;
}

export function consumeLastSwipeVelocity(): number {
  const v = lastSwipeVelocityX;
  lastSwipeVelocityX = 0;
  return v;
}
