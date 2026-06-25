import { Cursor, DEFAULT_OPTIONS } from './index';

const setMatchMedia = (options?: { fineHover?: boolean; reducedMotion?: boolean }): void => {
  const { fineHover = true, reducedMotion = false } = options ?? {};

  (window as unknown as Window & { matchMedia: jest.Mock }).matchMedia = jest
    .fn()
    .mockImplementation((query: string) => {
      let matches = false;

      if (query === '(hover: hover) and (pointer: fine)') {
        matches = fineHover;
      } else if (query === '(prefers-reduced-motion: reduce)') {
        matches = reducedMotion;
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    });
};

describe('Cursor', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.body.removeAttribute('style');
    document.body.innerHTML = '';
    (window as unknown as Window & { matchMedia: jest.Mock }).matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('mounts and creates cursor elements with default options', () => {
    setMatchMedia();

    const cursor = new Cursor();
    cursor.mount();

    const outer = document.querySelector<HTMLDivElement>('.halo-cursor-outer');
    const inner = document.querySelector<HTMLDivElement>('.halo-cursor-inner');
    const styleEl = document.querySelector<HTMLStyleElement>('style[data-halo-cursor="halo-cursor"]');

    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(styleEl).not.toBeNull();
  });

  it('does not mount when pointer is not fine', () => {
    setMatchMedia({ fineHover: false });

    const cursor = new Cursor();
    cursor.mount();

    expect(document.querySelector('.halo-cursor-outer')).toBeNull();
    expect(document.querySelector('.halo-cursor-inner')).toBeNull();
  });

  it('respects prefers-reduced-motion when disableOnReducedMotion is true', () => {
    setMatchMedia({ fineHover: true, reducedMotion: true });

    const cursor = new Cursor({ disableOnReducedMotion: true });
    cursor.mount();

    expect(document.querySelector('.halo-cursor-outer')).toBeNull();
    expect(document.querySelector('.halo-cursor-inner')).toBeNull();
  });

  it('creates elements and hides native cursor when requested', () => {
    setMatchMedia();

    const cursor = new Cursor({ hideNativeCursor: true });
    cursor.mount();

    const outer = document.querySelector<HTMLDivElement>('.halo-cursor-outer');
    const inner = document.querySelector<HTMLDivElement>('.halo-cursor-inner');

    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(document.documentElement.style.cursor).toBe('none');
    expect(document.body.style.cursor).toBe('none');

    cursor.destroy();

    expect(document.querySelector('.halo-cursor-outer')).toBeNull();
    expect(document.querySelector('.halo-cursor-inner')).toBeNull();
    expect(document.documentElement.style.cursor).toBe('');
    expect(document.body.style.cursor).toBe('');
  });

  it('preserves a pre-existing inline cursor when hiding and restores it on destroy', () => {
    setMatchMedia();

    document.body.style.cursor = 'pointer';

    const cursor = new Cursor({ hideNativeCursor: true });
    cursor.mount();
    expect(document.body.style.cursor).toBe('none');

    cursor.destroy();
    expect(document.body.style.cursor).toBe('pointer');
  });

  it('re-mounts into the new container when rootElement changes via updateOptions', () => {
    setMatchMedia();

    const firstScope = document.createElement('div');
    const secondScope = document.createElement('div');
    document.body.append(firstScope, secondScope);

    const cursor = new Cursor({ rootElement: firstScope });
    cursor.mount();
    expect(firstScope.querySelector('.halo-cursor-outer')).not.toBeNull();

    cursor.updateOptions({ rootElement: secondScope });

    expect(firstScope.querySelector('.halo-cursor-outer')).toBeNull();
    expect(secondScope.querySelector('.halo-cursor-outer')).not.toBeNull();
  });

  it('updates options safely when mounted', () => {
    setMatchMedia();

    const cursor = new Cursor();
    cursor.mount();

    const originalStyle = document.querySelector<HTMLStyleElement>('style[data-halo-cursor="halo-cursor"]');
    expect(originalStyle).not.toBeNull();
    expect(originalStyle!.textContent).toContain(`${DEFAULT_OPTIONS.outerSize}px`);

    expect(() => cursor.updateOptions({ outerSize: 50 })).not.toThrow();

    const updatedStyle = document.querySelector<HTMLStyleElement>('style[data-halo-cursor="halo-cursor"]');
    expect(updatedStyle).not.toBeNull();
  });

  it('responds to mouse events and hover state', () => {
    setMatchMedia();

    const cursor = new Cursor({ hideNativeCursor: true });
    cursor.mount();

    const outer = document.querySelector<HTMLDivElement>('.halo-cursor-outer');
    const inner = document.querySelector<HTMLDivElement>('.halo-cursor-inner');
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();

    // First move initializes rx/ry branch and updates target positions
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }));

    // Mouse down / up toggle click class
    document.dispatchEvent(new MouseEvent('mousedown'));
    expect(outer!.classList.contains('click')).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(outer!.classList.contains('click')).toBe(false);

    // Hover over an interactive element toggles hover classes
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(outer!.classList.contains('hover')).toBe(true);
    expect(inner!.classList.contains('hover')).toBe(true);

    // Leaving the document resets target position branch
    document.dispatchEvent(new MouseEvent('mouseleave'));
  });

  it('ignores synthetic mouse events shortly after a touch (mobile/webview safety net)', () => {
    setMatchMedia();

    const cursor = new Cursor();
    cursor.mount();

    const outer = document.querySelector<HTMLDivElement>('.halo-cursor-outer');
    const inner = document.querySelector<HTMLDivElement>('.halo-cursor-inner');
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();

    // A real touch followed by the synthetic mouse events some browsers replay on tap.
    document.dispatchEvent(new Event('touchstart'));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));

    // The cursor must stay hidden instead of jumping to the tap position.
    expect(outer!.classList.contains('halo-cursor-hidden')).toBe(true);
    expect(inner!.classList.contains('halo-cursor-hidden')).toBe(true);

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousedown'));

    expect(outer!.classList.contains('hover')).toBe(false);
    expect(outer!.classList.contains('click')).toBe(false);
  });

  it('reactively toggles native cursor hiding via updateOptions while mounted', () => {
    setMatchMedia();

    const cursor = new Cursor({ hideNativeCursor: false });
    cursor.mount();

    expect(document.documentElement.style.cursor).toBe('');

    cursor.updateOptions({ hideNativeCursor: true });
    expect(document.documentElement.style.cursor).toBe('none');
    expect(document.body.style.cursor).toBe('none');

    cursor.updateOptions({ hideNativeCursor: false });
    expect(document.documentElement.style.cursor).toBe('');
    expect(document.body.style.cursor).toBe('');
  });

  it('supports pause and resume', () => {
    setMatchMedia();

    const cursor = new Cursor();
    cursor.mount();

    const outer = document.querySelector<HTMLDivElement>('.halo-cursor-outer');
    expect(outer).not.toBeNull();

    cursor.pause();
    document.dispatchEvent(new MouseEvent('mousedown'));
    expect(outer!.classList.contains('click')).toBe(false);

    cursor.resume();
    document.dispatchEvent(new MouseEvent('mousedown'));
    expect(outer!.classList.contains('click')).toBe(true);
  });

  it('scopes cursor to a root element when provided', () => {
    setMatchMedia();

    const scope = document.createElement('div');
    document.body.appendChild(scope);

    const insideButton = document.createElement('button');
    scope.appendChild(insideButton);

    const outsideButton = document.createElement('button');
    document.body.appendChild(outsideButton);

    const cursor = new Cursor({ rootElement: scope, hideNativeCursor: true });
    cursor.mount();

    const outer = scope.querySelector<HTMLDivElement>('.halo-cursor-outer');
    const inner = scope.querySelector<HTMLDivElement>('.halo-cursor-inner');
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();

    // Hover inside the scoped root enables hover state
    insideButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(outer!.classList.contains('hover')).toBe(true);
    expect(inner!.classList.contains('hover')).toBe(true);

    // Leaving the scoped root clears hover state
    scope.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(outer!.classList.contains('hover')).toBe(false);
    expect(inner!.classList.contains('hover')).toBe(false);
  });
});
