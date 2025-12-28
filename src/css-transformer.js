/**
 * CSS Transformer for NativeScript
 *
 * Transforms TailwindCSS v4 output to be compatible with NativeScript's CSS engine.
 * This is a pure JavaScript implementation without PostCSS dependency.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { parseSingle, serialize } = require("@hookun/parse-animation-shorthand");

const remRE = /(\d*\.?\d+)\s*r?em/g;

// Supported CSS properties in NativeScript
const supportedProperties = {
  "align-content": true,
  "align-items": true,
  "align-self": true,
  "android-selected-tab-highlight-color": true,
  "android-elevation": true,
  "android-dynamic-elevation-offset": true,
  animation: true,
  "animation-delay": true,
  "animation-direction": true,
  "animation-duration": true,
  "animation-fill-mode": true,
  "animation-iteration-count": true,
  "animation-name": true,
  "animation-timing-function": true,
  background: true,
  "background-color": true,
  "background-image": true,
  "background-position": true,
  "background-repeat": ["repeat", "repeat-x", "repeat-y", "no-repeat"],
  "background-size": true,
  "border-bottom-color": true,
  "border-bottom-left-radius": true,
  "border-bottom-right-radius": true,
  "border-bottom-width": true,
  "border-color": true,
  "border-left-color": true,
  "border-left-width": true,
  "border-radius": true,
  "border-right-color": true,
  "border-right-width": true,
  "border-top-color": true,
  "border-top-left-radius": true,
  "border-top-right-radius": true,
  "border-top-width": true,
  "border-width": true,
  "box-shadow": true,
  "clip-path": true,
  color: true,
  flex: true,
  "flex-grow": true,
  "flex-direction": true,
  "flex-shrink": true,
  "flex-wrap": true,
  font: true,
  "font-family": true,
  "font-size": true,
  "font-style": ["italic", "normal"],
  "font-weight": true,
  "font-variation-settings": true,
  height: true,
  "highlight-color": true,
  "horizontal-align": ["left", "center", "right", "stretch"],
  "justify-content": true,
  "justify-items": true,
  "justify-self": true,
  "letter-spacing": true,
  "line-height": true,
  margin: true,
  "margin-bottom": true,
  "margin-left": true,
  "margin-right": true,
  "margin-top": true,
  "margin-block": true,
  "margin-block-start": true,
  "margin-block-end": true,
  "margin-inline": true,
  "margin-inline-start": true,
  "margin-inline-end": true,
  "min-height": true,
  "min-width": true,
  "max-height": true,
  "max-width": true,
  "off-background-color": true,
  opacity: true,
  order: true,
  padding: true,
  "padding-block": true,
  "padding-bottom": true,
  "padding-inline": true,
  "padding-left": true,
  "padding-right": true,
  "padding-top": true,
  "place-content": true,
  "placeholder-color": true,
  "place-items": true,
  "place-self": true,
  "selected-tab-text-color": true,
  "tab-background-color": true,
  "tab-text-color": true,
  "tab-text-font-size": true,
  "text-transform": ["none", "capitalize", "uppercase", "lowercase"],
  "text-align": ["left", "center", "right"],
  "text-decoration": ["none", "line-through", "underline"],
  "text-shadow": true,
  transform: true,
  rotate: true,
  "vertical-align": ["top", "center", "bottom", "stretch"],
  visibility: ["visible", "collapse"],
  width: true,
  "z-index": true,
};

const unsupportedPseudoSelectors = [":focus-within", ":hover"];
const unsupportedValues = ["max-content", "min-content", "vh", "vw"];
const unsupportedAtRules = ["@media", "@supports", "@property", "@keyframes"];

/**
 * Check if a CSS property is supported in NativeScript
 */
function isSupportedProperty(prop, val = null) {
  const rules = supportedProperties[prop];
  if (!rules) return false;

  if (val) {
    if (unsupportedValues.some((unit) => val.endsWith(unit))) {
      return false;
    }

    if (Array.isArray(rules)) {
      return rules.includes(val);
    }
  }

  return true;
}

/**
 * Check if a selector is supported in NativeScript
 */
function isSupportedSelector(selector) {
  return !unsupportedPseudoSelectors.some((pseudo) =>
    selector.includes(pseudo)
  );
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(input) {
  return input.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Expand animation shorthand to individual properties
 */
function expandAnimation(value) {
  try {
    const styles = parseSingle(value);
    if (styles.duration && Number.isInteger(styles.duration)) {
      styles.duration = `${styles.duration / 1000}s`;
    }

    Object.entries(styles)
      .filter(([, v]) => typeof v === "object")
      .forEach(([key, v]) => {
        styles[key] = serialize({ [key]: v }).split(" ")[0];
      });

    return Object.entries(styles)
      .filter(([, v]) => v !== "unset")
      .map(([key, v]) => `animation-${camelToKebab(key)}: ${v}`)
      .join(";\n  ");
  } catch {
    return `animation: ${value}`;
  }
}

/**
 * Transform a CSS value (convert rem/em to px equivalent)
 */
function transformValue(value, debug = false) {
  if (!value) return value;

  // Convert em/rem to device pixels (16px base)
  if (value.includes("rem") || value.includes("em")) {
    value = value.replace(remRE, (match, num) => {
      const converted = String(parseFloat(num) * 16);
      if (debug) {
        console.log(
          `[nativescript-tailwind] Converting ${match} to ${converted}`
        );
      }
      return converted;
    });
  }

  return value;
}

/**
 * Transform a single CSS declaration
 */
function transformDeclaration(prop, value, debug = false) {
  // Skip CSS variables that define unsupported features
  if (
    [
      "tw-ring",
      "tw-shadow",
      "tw-ordinal",
      "tw-slashed-zero",
      "tw-numeric",
    ].some((varName) => prop.startsWith(`--${varName}`))
  ) {
    return null;
  }

  // Skip divide/space reverse variables in specific contexts
  if (prop.match(/--tw-(divide|space)-[xy]-reverse/)) {
    return null;
  }

  // Skip color-mix values (not supported yet)
  if (value?.includes("color-mix")) {
    return null;
  }

  // Skip currentColor values
  if (value?.includes("currentColor")) {
    return null;
  }

  // Transform visibility: hidden -> collapse
  if (prop === "visibility" && value === "hidden") {
    return { prop, value: "collapse" };
  }

  // Transform vertical-align: middle -> center
  if (prop === "vertical-align" && value === "middle") {
    return { prop, value: "center" };
  }

  // Expand animation shorthand
  if (prop === "animation") {
    return { prop: "__expanded__", value: expandAnimation(value) };
  }

  // Transform value (rem/em conversion)
  const transformedValue = transformValue(value, debug);

  // Check if property is supported
  if (!prop.startsWith("--") && !isSupportedProperty(prop, transformedValue)) {
    return null;
  }

  return { prop, value: transformedValue };
}

/**
 * Transform a CSS selector
 */
function transformSelector(selector) {
  // Replace :root and :host with NativeScript equivalents
  const rootClasses = ".ns-root, .ns-modal";
  selector = selector
    .replace(/:root/g, rootClasses)
    .replace(/:host/g, rootClasses);

  // Remove :where() wrapper
  selector = selector.replace(/:where\(([^)]+)\)/g, "$1");

  // Transform space/divide selectors
  selector = selector.replace(/:not\(:last-child\)/g, "* + *");
  selector = selector.replace(
    /:not\(\[hidden\]\) ~ :not\(\[hidden\]\)/g,
    "* + *"
  );

  // Handle ::placeholder (convert to base selector for placeholder-color)
  if (selector.includes("::placeholder")) {
    selector = selector.replace(/::placeholder/g, "");
  }

  return selector.trim();
}

/**
 * Parse CSS into rules and at-rules (simple parser)
 */
function parseCSS(css) {
  const result = [];
  let i = 0;

  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    // Check for at-rule
    if (css[i] === "@") {
      const atRuleMatch = css.slice(i).match(/^@(\w+)([^{;]*)(;|\{)/);
      if (atRuleMatch) {
        const atRuleName = atRuleMatch[1];
        const atRuleParams = atRuleMatch[2].trim();
        const atRuleEnd = atRuleMatch[3];

        i += atRuleMatch[0].length;

        if (atRuleEnd === "{") {
          // Find matching closing brace
          let braceCount = 1;
          let bodyStart = i;
          while (i < css.length && braceCount > 0) {
            if (css[i] === "{") braceCount++;
            if (css[i] === "}") braceCount--;
            i++;
          }
          const body = css.slice(bodyStart, i - 1);
          result.push({
            type: "at-rule",
            name: atRuleName,
            params: atRuleParams,
            body: body,
          });
        } else {
          result.push({
            type: "at-rule",
            name: atRuleName,
            params: atRuleParams,
            body: null,
          });
        }
        continue;
      }
    }

    // Parse rule (selector + declarations)
    const selectorEnd = css.indexOf("{", i);
    if (selectorEnd === -1) break;

    const selector = css.slice(i, selectorEnd).trim();
    i = selectorEnd + 1;

    // Find closing brace
    let braceCount = 1;
    let bodyStart = i;
    while (i < css.length && braceCount > 0) {
      if (css[i] === "{") braceCount++;
      if (css[i] === "}") braceCount--;
      i++;
    }

    const body = css.slice(bodyStart, i - 1).trim();

    if (selector && body) {
      result.push({
        type: "rule",
        selector,
        body,
      });
    }
  }

  return result;
}

/**
 * Parse declarations from a rule body
 */
function parseDeclarations(body) {
  const declarations = [];
  const parts = body.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const prop = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (prop && value) {
      declarations.push({ prop, value });
    }
  }

  return declarations;
}

/**
 * Main CSS transformation function
 */
export function transformNativeScriptCSS(css, options = {}) {
  const { debug = false } = options;
  const rules = parseCSS(css);
  const output = [];

  for (const rule of rules) {
    if (rule.type === "at-rule") {
      // Handle @layer - flatten by processing its contents
      if (rule.name === "layer") {
        if (rule.body) {
          const nested = transformNativeScriptCSS(rule.body, options);
          output.push(nested);
        }
        continue;
      }

      // Handle @keyframes - keep as-is (supported in NativeScript)
      if (rule.name === "keyframes") {
        output.push(`@keyframes ${rule.params} {\n${rule.body}\n}`);
        continue;
      }

      // Skip unsupported at-rules (@media, @supports, @property)
      if (["media", "supports", "property"].includes(rule.name)) {
        if (debug) {
          console.log(`[nativescript-tailwind] Skipping @${rule.name}`);
        }
        continue;
      }

      continue;
    }

    if (rule.type === "rule") {
      // Skip rules with CSS nesting (& selector)
      if (rule.selector.includes("&")) {
        continue;
      }

      // Check if selector is supported
      if (!isSupportedSelector(rule.selector)) {
        continue;
      }

      // Transform selector
      let selector = transformSelector(rule.selector);
      if (!selector) continue;

      // Handle ::placeholder conversion
      const isPlaceholder = rule.selector.includes("::placeholder");

      // Parse and transform declarations
      const declarations = parseDeclarations(rule.body);
      const transformedDecls = [];

      for (const { prop, value } of declarations) {
        // For placeholder rules, convert color to placeholder-color
        let actualProp = prop;
        if (isPlaceholder && prop === "color") {
          actualProp = "placeholder-color";
        }

        const transformed = transformDeclaration(actualProp, value, debug);
        if (transformed) {
          if (transformed.prop === "__expanded__") {
            // Expanded animation properties
            transformedDecls.push(transformed.value);
          } else {
            transformedDecls.push(`${transformed.prop}: ${transformed.value}`);
          }
        }
      }

      if (transformedDecls.length > 0) {
        output.push(`${selector} {\n  ${transformedDecls.join(";\n  ")};\n}`);
      }
    }
  }

  return output.join("\n\n");
}

export default transformNativeScriptCSS;
