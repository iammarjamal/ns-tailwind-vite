/**
 * NativeScript Vite Configuration for TailwindCSS v4
 *
 * This configuration file is automatically merged with the project's vite.config
 * by NativeScript's Vite plugin.
 */

import nativescriptTailwind from "@nativescript/tailwind";

export default () => {
  return {
    plugins: [nativescriptTailwind()],
  };
};
