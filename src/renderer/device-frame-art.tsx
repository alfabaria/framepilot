import { useId, type CSSProperties } from 'react';
import type { DeviceFrameSpec, Finish, FrameGeometry } from '../shared/frame-geometry';

type Metal = { light: string; mid: string; dark: string };

const METALS: Record<Finish, Metal> = {
  graphite: { light: '#7b7d85', mid: '#3a3b41', dark: '#1d1e22' },
  black: { light: '#5a5c63', mid: '#26272b', dark: '#111214' },
  silver: { light: '#f4f5f7', mid: '#cdd0d5', dark: '#9da1a8' },
  white: { light: '#ffffff', mid: '#e7e8eb', dark: '#bfc2c9' },
  gold: { light: '#f8e9cd', mid: '#dcc193', dark: '#a98c5f' },
  rose: { light: '#f8dcd4', mid: '#e2b5a8', dark: '#b6877c' },
  blue: { light: '#8fb2d1', mid: '#46708f', dark: '#243f58' },
  red: { light: '#ff7684', mid: '#d3182f', dark: '#790a18' },
  purple: { light: '#d6c4ee', mid: '#a186cd', dark: '#634a88' },
  green: { light: '#b4d6c0', mid: '#659879', dark: '#36594c' },
  yellow: { light: '#faeb9a', mid: '#e8c735', dark: '#9d8419' },
  pink: { light: '#f9d0e1', mid: '#e898b8', dark: '#a9617f' },
  titanium: { light: '#c7c4be', mid: '#85837e', dark: '#4c4b48' },
  natural: { light: '#e0dbd2', mid: '#aea89d', dark: '#6f6b61' },
  midnight: { light: '#566074', mid: '#272d3b', dark: '#11141c' },
  starlight: { light: '#f8f4ec', mid: '#dad4c6', dark: '#a9a294' },
  orange: { light: '#ffbd94', mid: '#f27d3d', dark: '#a9481b' },
  teal: { light: '#a6dedb', mid: '#52aaa7', dark: '#2c6a68' },
};

const GLASS = '#050506';

function rr(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
}

type Props = {
  spec: DeviceFrameSpec;
  geometry: FrameGeometry;
  className?: string;
  style?: CSSProperties;
};

/** Vector artwork for a device frame. The screen opening is transparent so the live page shows through. */
export function DeviceFrameArt({ spec, geometry, className, style }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const metal = METALS[spec.finish];
  const handheld = spec.family === 'phone' || spec.family === 'tablet';
  return (
    <svg className={className} style={style} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}h`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={metal.light} />
          <stop offset="0.14" stopColor={metal.mid} />
          <stop offset="0.86" stopColor={metal.mid} />
          <stop offset="1" stopColor={metal.dark} />
        </linearGradient>
        <linearGradient id={`${uid}v`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={metal.light} />
          <stop offset="0.45" stopColor={metal.mid} />
          <stop offset="1" stopColor={metal.dark} />
        </linearGradient>
      </defs>
      {handheld ? <Handheld spec={spec} g={geometry} uid={uid} metal={metal} /> : <Desktop spec={spec} g={geometry} uid={uid} metal={metal} />}
    </svg>
  );
}

function Buttons({ spec, g, uid }: { spec: DeviceFrameSpec; g: FrameGeometry; uid: string }) {
  if (spec.buttons === 'none') return null;
  const { body } = g;
  const reach = 3;
  const left = body.x - reach;
  const right = body.x + body.width - 1;
  const fill = `url(#${uid}v)`;
  const bar = (x: number, y: number, h: number) => <rect key={`${x}-${y}`} x={x} y={y} width={reach + 1} height={h} rx={1.5} fill={fill} />;
  if (spec.family === 'tablet') {
    return (
      <>
        <rect x={body.x + body.width - 110} y={body.y - reach} width={46} height={reach + 1} rx={1.5} fill={fill} />
        {bar(right, body.y + 90, 40)}
        {bar(right, body.y + 140, 40)}
      </>
    );
  }
  if (spec.buttons === 'ios') {
    return (
      <>
        {bar(left, body.y + 78, 22)}
        {bar(left, body.y + 124, 46)}
        {bar(left, body.y + 182, 46)}
        {bar(right, body.y + 150, 78)}
      </>
    );
  }
  return (
    <>
      {bar(right, body.y + 130, 62)}
      {bar(right, body.y + 215, 36)}
    </>
  );
}

function Handheld({ spec, g, uid, metal }: { spec: DeviceFrameSpec; g: FrameGeometry; uid: string; metal: Metal }) {
  const { body, glass, screen } = g;
  const cx = screen.x + screen.width / 2;
  const cutout = spec.cutout;
  const tablet = spec.family === 'tablet';
  return (
    <g>
      <Buttons spec={spec} g={g} uid={uid} />
      <path fillRule="evenodd" fill={`url(#${uid}h)`} d={`${rr(body.x, body.y, body.width, body.height, body.radius)}${rr(glass.x, glass.y, glass.width, glass.height, glass.radius)}`} />
      <path fillRule="evenodd" fill={GLASS} d={`${rr(glass.x, glass.y, glass.width, glass.height, glass.radius)}${rr(screen.x, screen.y, screen.width, screen.height, g.screenRadius)}`} />
      <path fill="none" stroke={metal.light} strokeOpacity={0.55} strokeWidth={0.8} d={rr(body.x + 0.4, body.y + 0.4, body.width - 0.8, body.height - 0.8, body.radius)} />
      <path fill="none" stroke="#000" strokeOpacity={0.55} strokeWidth={0.8} d={rr(glass.x - 0.3, glass.y - 0.3, glass.width + 0.6, glass.height + 0.6, glass.radius)} />
      {spec.speaker && cutout.kind === 'none' && (
        <g fill="#15161a">
          {!tablet && <rect x={cx - 28} y={glass.y + spec.top / 2 - 3} width={56} height={6} rx={3} />}
          <circle cx={tablet ? cx : cx - 46} cy={glass.y + spec.top / 2} r={tablet ? 4 : 4.5} />
        </g>
      )}
      {spec.homeButton && (
        <circle cx={cx} cy={screen.y + screen.height + spec.bottom / 2} r={tablet ? 24 : 21} fill="#050506" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.6} />
      )}
      {cutout.kind === 'notch' && (
        <path fill="#000" d={`M${cx - cutout.width / 2 - 7} ${screen.y}Q${cx - cutout.width / 2} ${screen.y} ${cx - cutout.width / 2} ${screen.y + 7}V${screen.y + cutout.height - 16}Q${cx - cutout.width / 2} ${screen.y + cutout.height} ${cx - cutout.width / 2 + 16} ${screen.y + cutout.height}H${cx + cutout.width / 2 - 16}Q${cx + cutout.width / 2} ${screen.y + cutout.height} ${cx + cutout.width / 2} ${screen.y + cutout.height - 16}V${screen.y + 7}Q${cx + cutout.width / 2} ${screen.y} ${cx + cutout.width / 2 + 7} ${screen.y}Z`} />
      )}
      {cutout.kind === 'island' && (
        <rect x={cx - cutout.width / 2} y={screen.y + cutout.top} width={cutout.width} height={cutout.height} rx={cutout.height / 2} fill="#000" />
      )}
      {cutout.kind === 'punch' && (
        <g>
          <circle cx={cutout.position === 'center' ? cx : screen.x + 30} cy={screen.y + cutout.top + cutout.radius} r={cutout.radius + 1.6} fill="#000" />
          <circle cx={cutout.position === 'center' ? cx : screen.x + 30} cy={screen.y + cutout.top + cutout.radius} r={cutout.radius * 0.45} fill="#14151f" />
        </g>
      )}
    </g>
  );
}

function Desktop({ spec, g, uid, metal }: { spec: DeviceFrameSpec; g: FrameGeometry; uid: string; metal: Metal }) {
  const { body, glass, screen } = g;
  const cx = body.x + body.width / 2;
  const laptop = spec.family === 'laptop';
  const imac = spec.family === 'imac';
  const glassHeight = imac ? screen.y + screen.height + (screen.x - glass.x) - glass.y : glass.height;
  return (
    <g>
      {g.stand && (
        <g>
          <path fill={`url(#${uid}v)`} d={`M${cx - g.stand.neckWidth / 2} ${g.stand.top - 2}H${cx + g.stand.neckWidth / 2}L${cx + g.stand.neckWidth * 0.62} ${g.stand.top + g.stand.neckHeight}H${cx - g.stand.neckWidth * 0.62}Z`} />
          <rect x={cx - g.stand.baseWidth / 2} y={g.stand.top + g.stand.neckHeight - 1} width={g.stand.baseWidth} height={g.stand.baseHeight + 1} rx={g.stand.baseHeight / 2} fill={`url(#${uid}h)`} />
        </g>
      )}
      <path fillRule="evenodd" fill={`url(#${uid}h)`} d={`${rr(body.x, body.y, body.width, body.height, body.radius)}${rr(screen.x, screen.y, screen.width, screen.height, g.screenRadius)}`} />
      <path fillRule="evenodd" fill={GLASS} d={`${rr(glass.x, glass.y, glass.width, glassHeight, glass.radius)}${rr(screen.x, screen.y, screen.width, screen.height, g.screenRadius)}`} />
      {imac && (
        <path fill={`url(#${uid}v)`} d={`M${glass.x} ${glass.y + glassHeight}H${glass.x + glass.width}V${glass.y + glass.height - glass.radius * 0.6}Q${glass.x + glass.width} ${glass.y + glass.height} ${glass.x + glass.width - glass.radius * 0.6} ${glass.y + glass.height}H${glass.x + glass.radius * 0.6}Q${glass.x} ${glass.y + glass.height} ${glass.x} ${glass.y + glass.height - glass.radius * 0.6}Z`} opacity={0.96} />
      )}
      <path fill="none" stroke={metal.light} strokeOpacity={0.5} strokeWidth={Math.max(0.8, g.band * 0.3)} d={rr(body.x + 0.4, body.y + 0.4, body.width - 0.8, body.height - 0.8, body.radius)} />
      {laptop && (
        <circle cx={cx} cy={glass.y + (screen.y - glass.y) / 2} r={Math.max(1.6, screen.width * 0.0024)} fill="#16171c" />
      )}
      {g.base && (
        <g>
          <path fill={`url(#${uid}v)`} d={`M${g.base.x} ${g.base.y}H${g.base.x + g.base.width}L${g.base.x + g.base.width - g.base.height * 0.4} ${g.base.y + g.base.height}Q${cx} ${g.base.y + g.base.height * 1.05} ${g.base.x + g.base.height * 0.4} ${g.base.y + g.base.height}Z`} />
          <path fill={metal.dark} opacity={0.55} d={rr(cx - g.base.width * 0.075, g.base.y, g.base.width * 0.15, g.base.height * 0.42, g.base.height * 0.3)} />
        </g>
      )}
    </g>
  );
}
