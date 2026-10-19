import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Tip = { text: string; centerX: number; top: number; bottom: number };

const SHOW_DELAY_MS = 120;
/** After one tooltip has been shown, moving to the next control shows its tooltip with no delay. */
const WARM_WINDOW_MS = 450;

/**
 * Native `title` tooltips wait one to two seconds in Electron. This layer reads each control's `title` (moving it to
 * `data-tip` so the native tooltip never appears) and shows a styled tooltip after a short delay, immediately when a
 * tooltip was just visible, and on keyboard focus.
 */
export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const bubble = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer = 0;
    let current: HTMLElement | null = null;
    let warmUntil = 0;
    let visible = false;

    const textOf = (element: HTMLElement): string => {
      const title = element.getAttribute('title');
      if (title) {
        element.dataset.tip = title;
        element.removeAttribute('title');
      }
      return element.dataset.tip ?? '';
    };
    const hide = () => {
      window.clearTimeout(timer);
      if (visible) warmUntil = performance.now() + WARM_WINDOW_MS;
      visible = false;
      current = null;
      setTip(null);
    };
    const show = (element: HTMLElement) => {
      const text = textOf(element);
      if (!text || !element.isConnected) return;
      const rect = element.getBoundingClientRect();
      visible = true;
      setTip({ text, centerX: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom });
    };
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[title], [data-tip]') : null;
      if (target === current) return;
      hide();
      if (!target || !textOf(target)) return;
      current = target;
      const delay = performance.now() < warmUntil ? 0 : SHOW_DELAY_MS;
      timer = window.setTimeout(() => show(target), delay);
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[title], [data-tip]') : null;
      if (!target || !target.matches(':focus-visible') || !textOf(target)) return;
      hide();
      current = target;
      show(target);
    };

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    document.addEventListener('scroll', hide, true);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', hide);
    window.addEventListener('blur', hide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', hide, true);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  useLayoutEffect(() => {
    const element = bubble.current;
    if (!tip || !element) return;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, tip.centerX - width / 2));
    const below = tip.bottom + 8;
    element.style.left = `${left}px`;
    element.style.top = `${below + height > window.innerHeight - 8 ? tip.top - height - 8 : below}px`;
    element.style.visibility = 'visible';
  }, [tip]);

  return tip ? <div ref={bubble} className="tooltip" role="tooltip" style={{ visibility: 'hidden' }}>{tip.text}</div> : null;
}
