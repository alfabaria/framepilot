import type { CSSProperties } from 'react';

/** Tick spacings in CSS pixels, finest first. The finest one that stays readable at the current zoom is used. */
const STEPS = [20, 40, 100];
const MAJOR_EVERY = 5;

/** The minor grid and ruler step for a device drawn at `scale` screen pixels per CSS pixel. */
export function rulerStep(scale: number): number {
  return STEPS.find((step) => step * scale >= 9) ?? 100;
}

type RulerProps = {
  /** Scroll position of the canvas, and the height of its visible area. */
  scrollTop: number;
  height: number;
  /** Where the selected device's page starts, in canvas content pixels. */
  origin: number;
  /** Screen pixels per CSS pixel of the selected device. */
  scale: number;
  /** Height of the selected device's page in CSS pixels. */
  pageHeight: number;
};

/**
 * A vertical ruler for the selected device: zero is the top of its page, units are CSS pixels, so a section's height
 * reads straight off the edge. It follows the canvas scroll, and a bar in the device's slot colour spans its page.
 */
export function Ruler({ scrollTop, height, origin, scale, pageHeight }: RulerProps) {
  const minor = rulerStep(scale);
  const major = minor * MAJOR_EVERY;
  const zero = origin - scrollTop;
  const labels: number[] = [];
  for (let value = Math.max(0, Math.floor((-zero - 14) / (major * scale))) * major; zero + value * scale < height; value += major) {
    if (zero + value * scale > -14) labels.push(value);
  }
  const end = zero + pageHeight * scale;
  return (
    <div className="ruler" aria-hidden="true" style={{ '--step-minor': `${minor * scale}px`, '--step-major': `${major * scale}px`, '--zero': `${zero}px` } as CSSProperties}>
      {labels.map((value) => <span key={value} className="ruler-label" style={{ top: zero + value * scale }}>{value}</span>)}
      <span className="ruler-span" style={{ top: zero, height: pageHeight * scale }} />
      <span className="ruler-end" style={{ top: end }}><b>{Math.round(pageHeight)}</b></span>
    </div>
  );
}
