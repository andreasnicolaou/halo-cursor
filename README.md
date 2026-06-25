# Halo Cursor – Framework‑Agnostic Animated Cursor

Halo Cursor is a lightweight, framework‑agnostic animated cursor halo for modern web apps. It follows the pointer, highlights interactive elements, and can completely hide the native cursor – all in plain TypeScript with zero runtime dependencies. ([demo](https://andreasnicolaou.github.io/halo-cursor/))

It works great with:

- Angular
- React
- Vue
- Svelte
- plain HTML / TypeScript / JavaScript

---

![TypeScript](https://img.shields.io/badge/TS-TypeScript-3178c6?logo=typescript&logoColor=white)
![GitHub contributors](https://img.shields.io/github/contributors/andreasnicolaou/halo-cursor)
![GitHub License](https://img.shields.io/github/license/andreasnicolaou/halo-cursor)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/andreasnicolaou/halo-cursor/build.yaml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/andreasnicolaou/halo-cursor)

![ESLint](https://img.shields.io/badge/linter-eslint-4B32C3.svg?logo=eslint)
![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier)
![Jest](https://img.shields.io/badge/tested_with-jest-99424f.svg?logo=jest)
![Maintenance](https://img.shields.io/maintenance/yes/2026)
![NPM Downloads](https://img.shields.io/npm/dm/%40andreasnicolaou%2Fhalo-cursor)

## Key Features

- **Framework‑agnostic** – Works in any app that can run JavaScript in the browser
- **Animated halo** – Smooth lerped motion with inner dot + outer halo
- **Interactive‑aware** – Highlights buttons/links and other interactive elements
- **Motion‑safe** – Respects `prefers-reduced-motion` and coarse pointers (e.g. touch)
- **Cursor control** – Optional full native cursor hiding with `hideNativeCursor`
- **Scoped & controllable** – Scope to a container with `rootElement`, and use `pause` / `resume`
- **Tiny & dependency‑free** – Just one class and sensible defaults

## Installation

```sh
# npm
npm install @andreasnicolaou/halo-cursor

# yarn
yarn add @andreasnicolaou/halo-cursor

# pnpm
pnpm add @andreasnicolaou/halo-cursor
```

### CDN / Direct Usage (UMD)

```html
<!-- unpkg CDN (latest version, unminified) -->
<script src="https://unpkg.com/@andreasnicolaou/halo-cursor/dist/index.umd.js"></script>

<!-- unpkg CDN (latest version, minified) -->
<script src="https://unpkg.com/@andreasnicolaou/halo-cursor/dist/index.umd.min.js"></script>

<!-- jsDelivr CDN (unminified) -->
<script src="https://cdn.jsdelivr.net/npm/@andreasnicolaou/halo-cursor/dist/index.umd.js"></script>

<!-- jsDelivr CDN (minified) -->
<script src="https://cdn.jsdelivr.net/npm/@andreasnicolaou/halo-cursor/dist/index.umd.min.js"></script>
```

**UMD (global `halo` variable):**

```html
<script src="https://unpkg.com/@andreasnicolaou/halo-cursor/dist/index.umd.min.js"></script>
<script>
  // window.halo is the UMD global
  const cursor = new halo.Cursor({
    hideNativeCursor: true,
  });

  cursor.mount();

  // later: cursor.destroy();
</script>
```

### ESM (recommended for bundlers)

```ts
import { Cursor } from '@andreasnicolaou/halo-cursor';

const cursor = new Cursor({
  outerSize: 40,
  innerSize: 8,
  hideNativeCursor: true,
});

cursor.mount();
```

### CJS (Node / CommonJS)

```js
const { Cursor } = require('@andreasnicolaou/halo-cursor');

const cursor = new Cursor({
  hideNativeCursor: true,
});

cursor.mount();
```

## Quick Usage Example

```ts
import { Cursor } from '@andreasnicolaou/halo-cursor';

const cursor = new Cursor({
  color: '#6366f1',
  hoverColor: '#818cf8',
  outerSize: 36,
  hoverOuterSize: 52,
  hideNativeCursor: true,
  lerp: 0.12,
});

// Attach to the whole document
cursor.mount();

// Temporarily pause animation/interaction (e.g. while a modal is open)
cursor.pause();
cursor.resume();

// Clean up when leaving the page / unmounting your app
// cursor.destroy();
```

## API

### `Cursor` methods

| Method                   | Description                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `new Cursor(options?)`   | Creates a new halo cursor instance with the given options.                                 |
| `mount()`                | Injects styles, creates DOM elements, attaches events, and starts the animation loop.      |
| `destroy()`              | Stops the loop, removes event listeners, DOM nodes, and restores the native cursor.        |
| `updateOptions(options)` | Merges new options into the existing ones and reinjects the stylesheet while mounted.      |
| `pause()`                | Temporarily pauses tracking and hides the halo off‑screen without destroying the instance. |
| `resume()`               | Resumes tracking and animation after a previous `pause()`.                                 |

### `CursorOptions`

| Property                 | Type                  | Default                                                                        | Description                                                                                       |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `outerSize`              | `number`              | `36`                                                                           | Size of the outer halo ring in pixels                                                             |
| `innerSize`              | `number`              | `6`                                                                            | Size of the inner dot in pixels                                                                   |
| `hoverOuterSize`         | `number`              | `52`                                                                           | Outer ring size on hover                                                                          |
| `clickOuterSize`         | `number`              | `26`                                                                           | Outer ring size on click                                                                          |
| `color`                  | `string`              | `'#6366f1'`                                                                    | Base color of the cursor halo                                                                     |
| `hoverColor`             | `string`              | `'#818cf8'`                                                                    | Color on hover state                                                                              |
| `outerBorderColor`       | `string`              | `'rgba(99, 102, 241, 0.7)'`                                                    | Outer ring border color                                                                           |
| `hoverBorderColor`       | `string`              | `'rgba(129, 140, 248, 1)'`                                                     | Outer ring border color on hover                                                                  |
| `outerBackground`        | `string`              | `'transparent'`                                                                | Outer ring background fill                                                                        |
| `hoverBackground`        | `string`              | `'rgba(99, 102, 241, 0.08)'`                                                   | Background fill on hover                                                                          |
| `clickBackground`        | `string`              | `'rgba(99, 102, 241, 0.18)'`                                                   | Background fill on click                                                                          |
| `zIndex`                 | `number`              | `9999`                                                                         | CSS z-index for cursor elements                                                                   |
| `lerp`                   | `number`              | `0.12`                                                                         | Smoothing factor for cursor movement (0–1, clamped). Higher = snappier, lower = smoother/more lag |
| `hideNativeCursor`       | `boolean`             | `true`                                                                         | Hide the native browser cursor                                                                    |
| `interactiveSelectors`   | `string`              | `'a, button, [role="button"], input, textarea, select, label, [tabindex="0"]'` | CSS selectors for interactive elements                                                            |
| `classPrefix`            | `string`              | `'halo-cursor'`                                                                | CSS class name prefix for generated elements                                                      |
| `disableOnReducedMotion` | `boolean`             | `true`                                                                         | Disable animations if reduced motion is preferred                                                 |
| `rootElement`            | `HTMLElement \| null` | `null`                                                                         | Root element to mount cursor into                                                                 |

## Framework Examples

### Angular

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Cursor } from '@andreasnicolaou/halo-cursor';

@Component({
  selector: 'app-root',
  template: ` <div #scope class="app-shell"><ng-content></ng-content></div> `,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scope', { static: true }) scopeRef!: ElementRef<HTMLDivElement>;

  private cursor: Cursor | null = null;

  ngAfterViewInit(): void {
    this.cursor = new Cursor({ rootElement: this.scopeRef.nativeElement, hideNativeCursor: true });
    this.cursor.mount();
  }

  ngOnDestroy(): void {
    this.cursor?.destroy();
  }
}
```

### React

```tsx
import { useEffect, useRef } from 'react';
import { Cursor } from '@andreasnicolaou/halo-cursor';

export function AppCursorScope() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const cursor = new Cursor({ rootElement: ref.current, hideNativeCursor: true });
    cursor.mount();

    return () => cursor.destroy();
  }, []);

  return <div ref={ref}>{/* your app */}</div>;
}
```

### Vue

```ts
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Cursor } from '@andreasnicolaou/halo-cursor';

const scopeRef = ref<HTMLElement | null>(null);
let cursor: Cursor | null = null;

onMounted(() => {
  if (!scopeRef.value) return;
  cursor = new Cursor({ rootElement: scopeRef.value, hideNativeCursor: true });
  cursor.mount();
});

onBeforeUnmount(() => {
  cursor?.destroy();
});
```

Use in your template:

```vue
<template>
  <div ref="scopeRef">
    <!-- your content -->
  </div>
</template>
```

## Notes & Accessibility

- The cursor **auto‑disables** itself on coarse pointers (e.g. touch devices).
- When `disableOnReducedMotion` is `true` (default), it also **disables itself** when `prefers-reduced-motion: reduce` is enabled.
- All DOM access happens inside `mount()` / `destroy()`, keeping the class safe to instantiate in SSR environments.

---

## Contributing

Contributions, ideas, and bug reports are welcome. Feel free to open an issue or PR on the GitHub repository.
