# @nativescript/tailwind

Makes using [Tailwind CSS v4](https://tailwindcss.com/) in NativeScript a whole lot easier!

```html
<label
  text="Tailwind CSS is awesome!"
  class="px-2 py-1 text-center text-blue-600 bg-blue-200 rounded-full"
/>
```

![Tailwind CSS is awesome!](https://user-images.githubusercontent.com/879060/81098285-73e3ad80-8f09-11ea-8cfa-7e2ec2eebcde.png)

## Features

- ✅ **TailwindCSS v4** - Full support for the latest Tailwind
- ✅ **HMR Support** - Hot Module Replacement works out of the box
- ✅ **Vite Native** - Uses `@tailwindcss/vite` directly, no PostCSS required
- ✅ **Auto Transform** - Automatically converts CSS for NativeScript compatibility

## Installation

```bash
npm install @nativescript/tailwind tailwindcss @tailwindcss/vite
```

## Setup

### Automatic Setup (Recommended)

The plugin auto-configures via `nativescript.vite.mjs`. Just install and import TailwindCSS in your project.

Add to your `app.css`:

```css
@import "tailwindcss";
```

That's it! Start using Tailwind classes in your app.

### Manual Setup

If you need more control, configure in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import nativescriptTailwind from "@nativescript/tailwind/vite";

export default defineConfig({
  plugins: [
    nativescriptTailwind({
      debug: false, // Enable debug logging
      includeTailwind: true, // Include @tailwindcss/vite (set false if adding separately)
    }),
  ],
});
```

### Without TailwindCSS Vite Plugin

If you're adding `@tailwindcss/vite` separately:

```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import nativescriptTailwind from "@nativescript/tailwind/vite";

export default defineConfig({
  plugins: [tailwindcss(), nativescriptTailwind({ includeTailwind: false })],
});
```

## CSS Transformations

The plugin automatically handles:

| Transformation           | Description                               |
| ------------------------ | ----------------------------------------- |
| `rem/em` → `px`          | Converts to pixels (16px base)            |
| `@media` rules           | Removed (unsupported in NativeScript)     |
| `@supports` rules        | Removed (unsupported in NativeScript)     |
| `@property` rules        | Removed (unsupported in NativeScript)     |
| `@layer` blocks          | Flattened (lifted to parent)              |
| `:root/:host`            | Converted to `.ns-root, .ns-modal`        |
| `::placeholder`          | Converted to `placeholder-color` property |
| `animation` shorthand    | Expanded to individual properties         |
| `visibility: hidden`     | Converted to `visibility: collapse`       |
| `vertical-align: middle` | Converted to `vertical-align: center`     |

## NativeScript Root Class

Add the `ns-root` class to your root layout for CSS variables to work:

```vue
<template>
  <Frame class="ns-root">
    <Page>
      <!-- Your content -->
    </Page>
  </Frame>
</template>
```

## Platform Variants

Use Tailwind v4's variant syntax with NativeScript platform classes:

```css
/* In your app.css */
@import "tailwindcss";

@custom-variant android (&:where(.ns-android, .ns-android *));
@custom-variant ios (&:where(.ns-ios, .ns-ios *));
```

Then use in your templates:

```html
<label
  class="android:text-red-500 ios:text-blue-500"
  text="Platform specific!"
/>
```

## Dark Mode

NativeScript applies `.ns-dark` class automatically. Configure in your CSS:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.ns-dark, .ns-dark *));
```

## Debug Mode

Enable debug logging:

```bash
VITE_DEBUG_LOGS=1 ns run ios
```

Or in plugin options:

```ts
nativescriptTailwind({ debug: true });
```

## Compatibility

- NativeScript 8.x+
- TailwindCSS 4.x
- Vite 5.x or 6.x
- @nativescript/vite (latest)

## Upgrading from v4 (Tailwind CSS v3)

1. Update dependencies:

   ```bash
   npm install @nativescript/tailwind@latest tailwindcss@latest @tailwindcss/vite
   ```

2. Replace your `app.css` imports:

   ```css
   /* Old v3 way */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* New v4 way */
   @import "tailwindcss";
   ```

3. Remove `tailwind.config.js` (optional in v4) or migrate to CSS-based config.

4. Remove `postcss.config.js` if you have one (no longer needed).

## License

MIT
