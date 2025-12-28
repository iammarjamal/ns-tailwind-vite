/**
 * @nativescript/tailwind - Vite Plugin for TailwindCSS v4 + NativeScript
 *
 * This plugin wraps @tailwindcss/vite and transforms the CSS output
 * to be compatible with NativeScript's CSS engine.
 *
 * Features:
 * - Full HMR support via @tailwindcss/vite
 * - Automatic CSS transformation for NativeScript compatibility
 * - rem/em to px conversion
 * - Removal of unsupported CSS features (@media, @supports, etc.)
 * - Animation shorthand expansion
 *
 * Usage:
 * ```js
 * // vite.config.js
 * import nativescriptTailwind from '@nativescript/tailwind/vite';
 *
 * export default defineConfig({
 *   plugins: [nativescriptTailwind()]
 * });
 * ```
 *
 * Or auto-configured via nativescript.vite.mjs (recommended)
 */

import tailwindcss from "@tailwindcss/vite";
import { transformNativeScriptCSS } from "./css-transformer.js";

/**
 * Creates the NativeScript Tailwind Vite plugin
 * @param {Object} options - Plugin options
 * @param {boolean} options.debug - Enable debug logging
 * @param {boolean} options.includeTailwind - Include @tailwindcss/vite plugin (default: true)
 * @returns {import('vite').Plugin[]} Array of Vite plugins
 */
export default function nativescriptTailwind(options = {}) {
  const {
    debug = process.env.VITE_DEBUG_LOGS === "1",
    includeTailwind = true,
  } = options;

  const plugins = [];

  // Include the official TailwindCSS v4 Vite plugin (optional)
  if (includeTailwind) {
    plugins.push(...tailwindcss());
  }

  // NativeScript CSS transformation plugin
  plugins.push({
    name: "nativescript-tailwind",
    enforce: "post",

    // Transform CSS files for NativeScript compatibility
    transform(code, id) {
      // Only process CSS files and Vue style blocks
      const isCSSFile = id.endsWith(".css");
      const isVueStyle =
        id.includes("?vue&type=style") || id.includes("&lang.css");
      const isSCSS = id.includes("scss") || id.includes("sass");

      if (!isCSSFile && !isVueStyle) {
        return null;
      }

      // Skip SCSS/SASS files (they need preprocessing first)
      if (isSCSS) {
        return null;
      }

      // Skip if no CSS content
      if (!code || typeof code !== "string") {
        return null;
      }

      // Skip node_modules except for tailwind
      if (id.includes("node_modules") && !id.includes("tailwindcss")) {
        return null;
      }

      try {
        const transformed = transformNativeScriptCSS(code, { debug });

        if (debug) {
          console.log(`[nativescript-tailwind] Transformed: ${id}`);
        }

        return {
          code: transformed,
          map: null, // Source maps not needed for CSS in NativeScript
        };
      } catch (error) {
        console.error(
          `[nativescript-tailwind] Error transforming ${id}:`,
          error
        );
        return null;
      }
    },

    // Handle HMR for CSS updates
    handleHotUpdate({ file, server, modules }) {
      if (file.endsWith(".css")) {
        if (debug) {
          console.log(`[nativescript-tailwind] HMR update: ${file}`);
        }
      }
      // Let Vite handle the HMR normally
      return modules;
    },
  });

  return plugins;
}
