export interface CursorOptions {
  outerSize?: number;
  innerSize?: number;
  hoverOuterSize?: number;
  clickOuterSize?: number;
  color?: string;
  hoverColor?: string;
  outerBorderColor?: string;
  hoverBorderColor?: string;
  outerBackground?: string;
  hoverBackground?: string;
  clickBackground?: string;
  zIndex?: number;
  lerp?: number;
  hideNativeCursor?: boolean;
  interactiveSelectors?: string;
  classPrefix?: string;
  disableOnReducedMotion?: boolean;
  rootElement?: HTMLElement | null;
}

export const DEFAULT_OPTIONS: Required<CursorOptions> = {
  outerSize: 36,
  innerSize: 6,
  hoverOuterSize: 52,
  clickOuterSize: 26,
  color: '#6366f1',
  hoverColor: '#818cf8',
  outerBorderColor: 'rgba(99, 102, 241, 0.7)',
  hoverBorderColor: 'rgba(129, 140, 248, 1)',
  outerBackground: 'transparent',
  hoverBackground: 'rgba(99, 102, 241, 0.08)',
  clickBackground: 'rgba(99, 102, 241, 0.18)',
  zIndex: 9999,
  lerp: 0.12,
  hideNativeCursor: true,
  interactiveSelectors: 'a, button, [role="button"], input, textarea, select, label, [tabindex="0"]',
  classPrefix: 'halo-cursor',
  disableOnReducedMotion: true,
  rootElement: null,
};

export class Cursor {
  private cleanupFns: Array<() => void> = [];
  private innerEl: HTMLDivElement | null = null;
  private mounted = false;
  private options: Required<CursorOptions>;
  private outerEl: HTMLDivElement | null = null;
  private paused = false;
  private rafId = 0;
  private rx = -999;
  private ry = -999;
  private styleEl: HTMLStyleElement | null = null;
  private tx = -999;
  private ty = -999;

  constructor(options: CursorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.options.lerp = Math.min(1, Math.max(0, this.options.lerp));
  }

  public destroy(): void {
    if (!this.mounted) return;

    globalThis.window.cancelAnimationFrame(this.rafId);
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];

    this.outerEl?.remove();
    this.innerEl?.remove();
    this.styleEl?.remove();
    this.outerEl = null;
    this.innerEl = null;
    this.styleEl = null;
    this.paused = false;

    if (this.options.hideNativeCursor) {
      const prefix = this.options.classPrefix;
      const root = this.options.rootElement ?? document.documentElement;
      root.classList.remove(`${prefix}-hide-native`);
      root.style.removeProperty('cursor');
      if (!this.options.rootElement) {
        document.body.style.removeProperty('cursor');
      }
    }

    this.mounted = false;
  }

  public mount(): void {
    if (this.mounted) return;
    if (globalThis.window === undefined || typeof document === 'undefined') return;

    // Only enable on devices that can hover and have a fine pointer.
    // This prevents the cursor rendering at (0,0) on touch devices.
    const fineHover = globalThis.window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches ?? false;
    if (!fineHover) return;

    const reducedMotion = globalThis.window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (this.options.disableOnReducedMotion && reducedMotion) return;

    this.injectStyles();
    this.createElements();
    this.attachEvents();
    this.mounted = true;
    this.tick();
  }

  public pause(): void {
    if (!this.mounted || this.paused) return;
    this.paused = true;
    // Move off-screen
    this.tx = -999;
    this.ty = -999;
    // Hide cursor elements
    this.outerEl?.classList.add('halo-cursor-paused');
    this.innerEl?.classList.add('halo-cursor-paused');
    // Restore native cursor if hidden
    if (this.options.hideNativeCursor) {
      const prefix = this.options.classPrefix;
      const root = this.options.rootElement ?? document.documentElement;
      root.classList.remove(`${prefix}-hide-native`);
      root.style.removeProperty('cursor');
      if (!this.options.rootElement) {
        document.body.style.removeProperty('cursor');
      }
    }
  }

  public resume(): void {
    if (!this.mounted || !this.paused) return;
    this.paused = false;
    // Restore cursor elements
    this.outerEl?.classList.remove('halo-cursor-paused');
    this.innerEl?.classList.remove('halo-cursor-paused');
    // Hide native cursor again if needed
    if (this.options.hideNativeCursor) {
      const prefix = this.options.classPrefix;
      const root = this.options.rootElement ?? document.documentElement;
      root.classList.add(`${prefix}-hide-native`);
      root.style.cursor = 'none';
      if (!this.options.rootElement) {
        document.body.style.cursor = 'none';
      }
    }
  }

  public updateOptions(options: CursorOptions): void {
    this.options = { ...this.options, ...options };
    this.options.lerp = Math.min(1, Math.max(0, this.options.lerp));

    if (this.mounted) {
      this.styleEl?.remove();
      this.injectStyles();
    }
  }

  private attachEvents(): void {
    const onMove = (event: MouseEvent): void => {
      if (this.paused) return;

      this.tx = event.clientX;
      this.ty = event.clientY;

      if (this.rx < -100) {
        this.rx = event.clientX;
        this.ry = event.clientY;
      }

      // Avoid any initial top-left flash until we have a real pointer position.
      const prefix = this.options.classPrefix;
      this.outerEl?.classList.remove(`${prefix}-hidden`);
      this.innerEl?.classList.remove(`${prefix}-hidden`);
    };

    const onDown = (): void => {
      if (this.paused) return;
      this.outerEl?.classList.remove('hover');
      this.outerEl?.classList.add('click');
    };

    const onUp = (): void => {
      if (this.paused) return;
      this.outerEl?.classList.remove('click');
    };

    const onOver = (event: MouseEvent): void => {
      if (this.paused) return;

      const target = event.target as Element | null;
      const isInteractive = !!target?.closest(this.options.interactiveSelectors);
      this.outerEl?.classList.toggle('hover', isInteractive);
      this.innerEl?.classList.toggle('hover', isInteractive);
    };

    const onLeaveScope = (): void => {
      if (this.paused) return;
      this.tx = -999;
      this.ty = -999;
      this.outerEl?.classList.remove('hover');
      this.innerEl?.classList.remove('hover');
    };

    const eventTarget: Document | HTMLElement = this.options.rootElement ?? document;

    eventTarget.addEventListener('mousemove', onMove as EventListener, { passive: true });
    eventTarget.addEventListener('mousedown', onDown as EventListener, { passive: true });
    eventTarget.addEventListener('mouseup', onUp as EventListener, { passive: true });
    eventTarget.addEventListener('mouseover', onOver as EventListener, { passive: true });
    eventTarget.addEventListener('mouseleave', onLeaveScope as EventListener, { passive: true });

    this.cleanupFns.push(
      () => eventTarget.removeEventListener('mousemove', onMove as EventListener),
      () => eventTarget.removeEventListener('mousedown', onDown as EventListener),
      () => eventTarget.removeEventListener('mouseup', onUp as EventListener),
      () => eventTarget.removeEventListener('mouseover', onOver as EventListener),
      () => eventTarget.removeEventListener('mouseleave', onLeaveScope as EventListener)
    );
  }

  private createElements(): void {
    const prefix = this.options.classPrefix;
    const host = this.options.rootElement ?? document.body;
    const root = this.options.rootElement ?? document.documentElement;

    this.outerEl = document.createElement('div');
    this.outerEl.className = `${prefix}-outer ${prefix}-hidden`;
    this.outerEl.setAttribute('aria-hidden', 'true');

    this.innerEl = document.createElement('div');
    this.innerEl.className = `${prefix}-inner ${prefix}-hidden`;
    this.innerEl.setAttribute('aria-hidden', 'true');

    host.appendChild(this.outerEl);
    host.appendChild(this.innerEl);

    if (this.options.hideNativeCursor) {
      root.classList.add(`${prefix}-hide-native`);
      root.style.cursor = 'none';
      if (!this.options.rootElement) {
        document.body.style.cursor = 'none';
      }
    }
  }

  private injectStyles(): void {
    const prefix = this.options.classPrefix;
    const o = this.options;

    this.styleEl = document.createElement('style');
    // Use a valid dataset property name (camelCase, no dashes)
    this.styleEl.dataset['haloCursor'] = prefix;
    let css = `
      .${prefix}-outer,
      .${prefix}-inner {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        transform: translate3d(-50%, -50%, 0);
        z-index: ${o.zIndex};
      }

      .${prefix}-hidden {
        opacity: 0 !important;
      }

      .${prefix}-outer.halo-cursor-paused,
      .${prefix}-inner.halo-cursor-paused {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.2s;
      }

      .${prefix}-outer {
        width: ${o.outerSize}px;
        height: ${o.outerSize}px;
        border-radius: 9999px;
        border: 1.5px solid ${o.outerBorderColor};
        background: ${o.outerBackground};
        transition:
          width 0.18s ease,
          height 0.18s ease,
          background-color 0.18s ease,
          border-color 0.18s ease,
          opacity 0.3s ease;
        will-change: left, top, width, height;
      }

      .${prefix}-outer.hover {
        width: ${o.hoverOuterSize}px;
        height: ${o.hoverOuterSize}px;
        background: ${o.hoverBackground};
        border-color: ${o.hoverBorderColor};
      }

      .${prefix}-outer.click {
        width: ${o.clickOuterSize}px;
        height: ${o.clickOuterSize}px;
        background: ${o.clickBackground};
        border-color: ${o.hoverBorderColor};
      }

      .${prefix}-inner {
        width: ${o.innerSize}px;
        height: ${o.innerSize}px;
        border-radius: 9999px;
        background: ${o.color};
        transition: opacity 0.3s ease, background-color 0.18s ease;
        will-change: left, top;
      }

      .${prefix}-inner.hover {
        background: ${o.hoverColor};
      }
    `;

    if (o.hideNativeCursor) {
      css += `
      .${prefix}-hide-native,
      .${prefix}-hide-native * {
        cursor: none !important;
      }
      `;
    }

    this.styleEl.textContent = css;

    document.head.appendChild(this.styleEl);
  }

  private readonly tick = (): void => {
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    this.rx = lerp(this.rx, this.tx, this.options.lerp);
    this.ry = lerp(this.ry, this.ty, this.options.lerp);

    if (this.outerEl) {
      this.outerEl.style.left = `${this.rx}px`;
      this.outerEl.style.top = `${this.ry}px`;
    }

    if (this.innerEl) {
      this.innerEl.style.left = `${this.tx}px`;
      this.innerEl.style.top = `${this.ty}px`;
    }

    this.rafId = globalThis.window.requestAnimationFrame(this.tick);
  };
}
