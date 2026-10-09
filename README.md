# 🛠️ @sabzidev/eslint-rules

A collection of custom ESLint rules for improving code quality, consistency, and maintainability.

---

## 👀 Overview

<div align="center">
  <img src="https://img.shields.io/npm/dm/@sabzidev/eslint-rules?style=flat-square&&color=16A34A&label=DOWNLOADS" alt="DOWNLOADS"/>
  <img src="https://img.shields.io/npm/v/@sabzidev/eslint-rules?style=flat-square&color=16A34A&label=VERSION" alt="VERSION"/>
  <br />
  <img src="./docs/images/logo.webp" alt="SabziDev logo" height="300" width="80%"/>

[GITHUB](https://github.com/SabziDev/eslint-rules) | [NPM](https://npmjs.com/package/@sabzidev/eslint-rules)
</div>

---

## ✨ Features

- Recommended configuration for ESLint Flat Config.
- Easy integration into existing ESLint setups.

---

## 📦 Installation

Install the package as a development dependency:

```bash
pnpm add -D @sabzidev/eslint-rules
```

---

## 🚀 Usage

Choose **one** of the following configuration methods.

### ● Recommended Configuration

Add the recommended configuration to your existing `eslint.config.js` file:

```js
import sabzidev from "@sabzidev/eslint-rules";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Your existing configurations
  sabzidev.configs.recommended,
]);
```

This enables all rules included in the recommended configuration with their predefined severity levels.

### ● Custom Configuration

Alternatively, register the plugin and configure each rule individually in your existing `eslint.config.js` file:

```js
import sabzidev from "@sabzidev/eslint-rules";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    plugins: {
      "@sabzidev": sabzidev,
    },
    rules: {
      "@sabzidev/merge-duplicate-id-and-classname-props": "warn",
      "@sabzidev/merge-exports": "warn",
      "@sabzidev/no-invalid-id-and-classname-value": "warn",
      "@sabzidev/no-useless-empty-type": "warn",
      "@sabzidev/no-useless-template-literal": "warn",
      "@sabzidev/padding-before-jump-statement": "warn",
      "@sabzidev/sort-comments": "warn",
      "@sabzidev/sort-jsx-props": "warn",
      "@sabzidev/sort-object-props": "warn",
    },
  },
]);
```

---

## ⭐ Recommended Tooling Setup

For a more comprehensive linting setup, combine `@sabzidev/eslint-rules` with [`@fullstacksjs/eslint-config`](https://www.npmjs.com/package/@fullstacksjs/eslint-config), [`eslint-plugin-sonarjs`](https://www.npmjs.com/package/eslint-plugin-sonarjs), and [`eslint-plugin-unicorn`](https://www.npmjs.com/package/eslint-plugin-unicorn).

This combination brings together code-quality rules, bug detection, maintainability checks, and custom linting rules.

```js
import { defineConfig } from "@fullstacksjs/eslint-config";
import sabzidev from "@sabzidev/eslint-rules";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";

const baseRules = {
  "func-style": ["warn", "expression"],
  quotes: [
    "error",
    "double",
    { avoidEscape: true, allowTemplateLiterals: false },
  ],
  eqeqeq: ["error", "always"],
  "no-console": "warn",
};
const plugins = [
  sabzidev.configs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs.recommended,
];
const pluginsRules = {
  "unicorn/filename-case": "off",
  "unicorn/prefer-global-this": "off",
  "unicorn/name-replacements": "off",
  "unicorn/no-array-sort": "off",
  "unicorn/no-null": "off",
  "unicorn/default-export-style": "off",

  "jsx-a11y/click-events-have-key-events": "off",
  "jsx-a11y/no-noninteractive-element-interactions": "off",
};

const config = defineConfig(
  {
    tailwind: { entryPoint: "./src/input.css" },
    rules: baseRules,
  },

  plugins,
  { rules: pluginsRules },
);

export default config;
```

**Note:** Customize the rules to match your project's requirements and verify compatibility with your installed plugin versions.

---

## 📋 Available Rules

| Rule                                     | Description                                  |
| :--------------------------------------- | :------------------------------------------- |
| `merge-duplicate-id-and-classname-props` | Merges duplicate `id` and `className` props. |
| `merge-exports`                          | Merges or organizes export declarations.     |
| `no-invalid-id-and-classname-value`      | Detects invalid `id` and `className` values. |
| `no-useless-empty-type`                  | Detects unnecessary empty types.             |
| `no-useless-template-literal`            | Detects unnecessary template literals.       |
| `padding-before-jump-statement`          | Enforces padding before jump statements.     |
| `sort-comments`                          | Sorts comments.                              |
| `sort-jsx-props`                         | Sorts JSX props.                             |
| `sort-object-props`                      | Sorts object properties.                     |

---

## 👨‍💻 Developer

Developed by **Abolfazl Sabzmohammadi**.

- GitHub: [SabziDev](https://github.com/SabziDev)
- Website: [Sabzi.Dev](https://Sabzi.Dev)
