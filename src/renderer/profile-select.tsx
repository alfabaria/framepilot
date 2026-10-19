import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown } from './icons';
import type { DeviceProfile } from '../shared/devices';
import { DeviceThumb } from './device-thumb';

type Props = {
  /** Accessible name of the control. */
  label: string;
  /** Tooltip for the closed control. */
  tip: string;
  profiles: readonly DeviceProfile[];
  value: string;
  onChange: (profileId: string) => void;
  /** Called when the list opens or closes, so the host can freeze native web views that would cover it. */
  onOpenChange: (open: boolean) => void;
};

type Placement = { left: number; top: number; maxHeight: number; minWidth: number };

/** A styled replacement for the OS dropdown: the native list ignores the app theme and cannot show the screen size. */
export function ProfileSelect({ label, tip, profiles, value, onChange, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [highlight, setHighlight] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = profiles.find((profile) => profile.id === value);

  function close(restoreFocus: boolean): void {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function choose(profileId: string): void {
    close(true);
    if (profileId !== value) onChange(profileId);
  }

  function toggle(): void {
    if (open) return close(false);
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const top = rect.bottom + 4;
    setPlacement({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)),
      top,
      maxHeight: Math.max(160, window.innerHeight - top - 12),
      minWidth: Math.max(220, rect.width),
    });
    setHighlight(Math.max(0, profiles.findIndex((profile) => profile.id === value)));
    setOpen(true);
  }

  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    const onScroll = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open) menu.current?.focus({ preventScroll: true });
  }, [open]);

  useLayoutEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[data-highlighted="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, highlight]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!open) toggle();
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const last = profiles.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setHighlight((index) => Math.min(last, index + 1)),
      ArrowUp: () => setHighlight((index) => Math.max(0, index - 1)),
      Home: () => setHighlight(0),
      End: () => setHighlight(last),
      Enter: () => { const profile = profiles[highlight]; if (profile) choose(profile.id); },
      Escape: () => close(true),
      Tab: () => close(false),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  return (
    <div className="title-select">
      <button
        ref={trigger}
        type="button"
        className="title-trigger"
        aria-label={`${label}: ${current?.name ?? ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={tip}
        onClick={(event) => { event.stopPropagation(); toggle(); }}
        onKeyDown={onTriggerKeyDown}
      >
        <span>{current?.name ?? 'Device'}</span>
        <ChevronDown size={12} strokeWidth={1.7} aria-hidden="true" />
      </button>
      {open && placement && (
        <div
          ref={menu}
          className="popover select-menu"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          style={{ left: placement.left, top: placement.top, maxHeight: placement.maxHeight, minWidth: placement.minWidth }}
          onKeyDown={onMenuKeyDown}
          onClick={(event) => event.stopPropagation()}
        >
          {profiles.map((profile, index) => (
            <div key={profile.id} role="presentation">
              {(index === 0 || profiles[index - 1]?.group !== profile.group) && <div className="select-group" role="presentation">{profile.group}</div>}
              <div
                role="option"
                aria-selected={profile.id === value}
                data-highlighted={index === highlight}
                className={`select-option ${index === highlight ? 'is-highlighted' : ''}`}
                onMouseMove={() => setHighlight(index)}
                onClick={() => choose(profile.id)}
              >
                <Check size={13} strokeWidth={2} aria-hidden="true" className="select-check" style={{ visibility: profile.id === value ? 'visible' : 'hidden' }} />
                <DeviceThumb profile={profile} />
                <span className="select-name">{profile.name}</span>
                <small>{profile.width}×{profile.height}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
