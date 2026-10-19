import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { DeviceChromeKind, DeviceInsets } from '../shared/devices';
import type { DeviceFrameSpec } from '../shared/frame-geometry';

type Props = {
  kind: DeviceChromeKind;
  frame: DeviceFrameSpec;
  /** Device screen in CSS pixels. */
  width: number;
  height: number;
  insets: DeviceInsets;
  url: string;
  /** Preview scale applied to the whole chrome layer. */
  scale: number;
};

const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

function useClock(): string {
  const [time, setTime] = useState(formatTime);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return time;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function Icon({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg className="dc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const Back = () => <Icon><path d="m14.5 5-7 7 7 7" /></Icon>;
const Forward = () => <Icon><path d="m9.5 5 7 7-7 7" /></Icon>;
const Share = () => <Icon><path d="M12 15V3.5M8 7l4-4 4 4M6 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H18" /></Icon>;
const Book = () => <Icon><path d="M12 6.5C10 5 7 4.8 4 5.5v12.5c3-.7 6-.5 8 1m0-12.5c2-1.5 5-1.7 8-1v12.5c-3-.7-6-.5-8 1m0-12.5V19" /></Icon>;
const Tabs = () => <Icon><rect x="8" y="3.5" width="12.5" height="12.5" rx="2.5" /><path d="M16 19.5H6A2.5 2.5 0 0 1 3.5 17V8" /></Icon>;
const Reload = () => <Icon size={18}><path d="M19 12a7 7 0 1 1-2.2-5.1M19 4.5v4h-4" /></Icon>;
const Plus = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
const Home = () => <Icon><path d="M4 11.5 12 4l8 7.5V20h-5.5v-5.5h-5V20H4z" /></Icon>;
const Dots = () => <Icon><circle cx="12" cy="5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="19" r="1.2" fill="currentColor" /></Icon>;

function StatusIcons({ time, ios }: { time: string; ios: boolean }) {
  return (
    <>
      <span className="dc-time">{time}</span>
      <span className="dc-status-icons" aria-hidden="true">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1.2 4.2a10 10 0 0 1 14.6 0M3.8 7a6.2 6.2 0 0 1 9.4 0" /><circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none" /></svg>
        <svg width={ios ? 27 : 20} height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor" /><path d="M24 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2S24.900 4.600 24 4.300Z" fill="currentColor" opacity="0.5" /></svg>
      </span>
    </>
  );
}

function UrlPill({ host, compact = false }: { host: string; compact?: boolean }) {
  return (
    <div className={`dc-url-pill ${compact ? 'is-compact' : ''}`}>
      <span className="dc-aa">AA</span>
      <span className="dc-host"><svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor" aria-hidden="true"><path d="M4.500 0A2.600 2.600 0 0 0 1.900 2.600V4.500H1.300A1.300 1.300 0 0 0 0 5.800v3.900A1.300 1.300 0 0 0 1.300 11h6.400A1.300 1.300 0 0 0 9 9.700V5.800a1.300 1.300 0 0 0-1.300-1.300h-.6V2.600A2.600 2.600 0 0 0 4.500 0Zm0 1.300a1.300 1.300 0 0 1 1.300 1.300v1.900H3.200V2.600A1.300 1.300 0 0 1 4.500 1.300Z" /></svg>{host}</span>
      <Reload />
    </div>
  );
}

export function DeviceChrome({ kind, frame, width, height, insets, url, scale }: Props) {
  const time = useClock();
  const host = hostOf(url);
  const landscape = width > height;
  const style: CSSProperties = { width, height, transform: `scale(${scale})` };

  if (kind === 'ios-phone' && !landscape) {
    const cutout = frame.cutout;
    const side = cutout.kind === 'none' || cutout.kind === 'punch' ? 0 : cutout.width / 2 + 18;
    return (
      <div className={`dc-root dc-ios ${frame.homeButton ? 'is-home' : ''}`} style={style}>
        <div className="dc-top dc-status" style={{ height: insets.top, paddingTop: frame.homeButton ? 0 : Math.round(insets.top * 0.22), '--cutout-side': `${side}px` } as CSSProperties}><StatusIcons time={time} ios /></div>
        <div className="dc-bottom dc-ios-bottom" style={{ height: insets.bottom }}>
          <UrlPill host={host} />
          <div className="dc-nav-row"><Back /><Forward /><Share /><Book /><Tabs /></div>
          {!frame.homeButton && <span className="dc-home-indicator" />}
        </div>
      </div>
    );
  }
  if (kind === 'ios-phone') {
    return (
      <div className="dc-root dc-ios" style={style}>
        <div className="dc-top dc-toolbar" style={{ height: insets.top, paddingLeft: insets.left + 6 }}>
          <div className="dc-toolbar-group"><Back /><Forward /><Book /></div>
          <UrlPill host={host} compact />
          <div className="dc-toolbar-group"><Share /><Plus /><Tabs /></div>
        </div>
        <div className="dc-left" style={{ width: insets.left, top: insets.top, bottom: insets.bottom }} />
        <div className="dc-bottom dc-ios-bottom is-landscape" style={{ height: insets.bottom }}><span className="dc-home-indicator" /></div>
      </div>
    );
  }
  if (kind === 'ios-tablet') {
    return (
      <div className="dc-root dc-ios" style={style}>
        <div className="dc-top dc-tablet-top" style={{ height: insets.top }}>
          <div className="dc-tablet-status" style={{ flex: `0 0 ${frame.statusHeight}px` }}><span className="dc-time">{time}</span><span className="dc-status-icons"><svg width="14" height="10" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M1.2 4.2a10 10 0 0 1 14.6 0M3.8 7a6.2 6.2 0 0 1 9.4 0" /><circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none" /></svg>100%<svg width="22" height="11" viewBox="0 0 27 13" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor" /></svg></span></div>
          <div className="dc-toolbar dc-tablet-toolbar">
            <div className="dc-toolbar-group"><Back /><Forward /><Book /></div>
            <UrlPill host={host} compact />
            <div className="dc-toolbar-group"><Share /><Plus /><Tabs /></div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'android') {
    return (
      <div className="dc-root dc-android" style={style}>
        <div className="dc-top" style={{ height: insets.top }}>
          <div className="dc-status dc-android-status" style={{ flex: `0 0 ${frame.statusHeight}px` }}><StatusIcons time={time} ios={false} /></div>
          <div className="dc-toolbar dc-android-toolbar">
            <Home />
            <div className="dc-android-url"><span>{host}</span></div>
            <Plus />
            <span className="dc-tab-count">1</span>
            <Dots />
          </div>
        </div>
        {insets.bottom > 0 && (
          <div className="dc-bottom dc-android-nav" style={{ height: insets.bottom }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M17 4.5v15L6 12z" /></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7.5" /></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>
          </div>
        )}
      </div>
    );
  }
  return null;
}
