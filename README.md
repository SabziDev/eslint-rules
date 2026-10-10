# 🛠️ @sabzidev/eslint-rules

A collection of custom ESLint rules for improving code quality, consistency, and maintainability.

---

## 👀 Overview

<div align="center">
  <img src="https://img.shields.io/npm/dm/@sabzidev/eslint-rules?style=flat-square&&color=16A34A&label=DOWNLOADS" alt="DOWNLOADS" />
  <img src="https://img.shields.io/npm/v/@sabzidev/eslint-rules?style=flat-square&color=16A34A&label=VERSION" alt="VERSION" />

  <br />

  <img src="./docs/images/logo.webp" alt="SabziDev logo" height="300" width="70%" />

[GITHUB](https://github.com/SabziDev/eslint-rules) | [NPM](https://npmjs.com/package/@sabzidev/eslint-rules)
</div>

---

## ✨ Features

- Recommended configuration for ESLint Flat Config.
- Easy integration into existing ESLint setups.

---

## 🚀📦 Installation & Usage

Install the package as a development dependency:

```bash
pnpm i -D @sabzidev/eslint-rules
```

Choose **one** of the following configuration methods for your `eslint.config.js` file:

### ● Recommended Configuration

Add the recommended configuration:

```js
import sabzidev from "@sabzidev/eslint-rules";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Your existing configurations
  sabzidev.configs.recommended,
]);
```

This enables all recommended rules with their predefined severity levels.

### ● Custom Configuration

Alternatively, register the plugin and configure each rule individually:

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
      "@sabzidev/sort-props": "warn",
    },
  },
]);
```

---

## ⭐ Recommended ESLint & Prettier Setup

Install the required dependencies:

```bash
pnpm i -D eslint prettier @fullstacksjs/eslint-config @sabzidev/eslint-rules eslint-plugin-sonarjs eslint-plugin-unicorn
```

For a comprehensive code-quality setup, combine `ESLint`, `Prettier`, [`@fullstacksjs/eslint-config`](https://npmjs.com/package/@fullstacksjs/eslint-config), [`@sabzidev/eslint-rules`](https://npmjs.com/package/@sabzidev/eslint-rules), [`eslint-plugin-sonarjs`](https://npmjs.com/package/eslint-plugin-sonarjs), and [`eslint-plugin-unicorn`](https://npmjs.com/package/eslint-plugin-unicorn).

This setup combines code formatting, code-quality checks, bug detection, maintainability rules, and custom ESLint rules.

This setup combines code-quality rules, bug detection, maintainability checks, and custom linting rules.

**Configuration for `eslint.config.js`:**

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
  "unicorn/name-replacements": [
    "error",
    {
      replacements: {
        prop: false,
        props: false,
        param: false,
        params: false,
        ref: false,
        refs: false,
        prev: false,
        e: false,
        res: false,
        err: false,
      },
    },
  ],
  "unicorn/no-null": "off",
  "unicorn/prefer-global-this": "off",
  "unicorn/default-export-style": "off",
};

const config = defineConfig(
  { rules: baseRules, tailwind: { entryPoint: "./src/input.css" } },

  plugins,
  { rules: pluginsRules },
);

export default config;
```

**Note:** Adjust the rules to suit your project and ensure compatibility with your installed plugin versions.

---

## 📋 Available Rules

| Rule                                     | Description                                                                |
| :--------------------------------------- | :------------------------------------------------------------------------- |
| `merge-duplicate-id-and-classname-props` | Merges duplicate id and className props.                                   |
| `merge-exports`                          | Merges or organizes export declarations.                                   |
| `no-invalid-id-and-classname-value`      | Detects invalid id and className values.                                   |
| `no-useless-empty-type`                  | Detects unnecessary empty types.                                           |
| `no-useless-template-literal`            | Detects unnecessary template literals.                                     |
| `padding-before-jump-statement`          | Enforces padding before jump statements.                                   |
| `sort-comments`                          | Sorts comments.                                                            |
| `sort-jsx-props`                         | Sorts JSX props.                                                           |
| `sort-props`                             | Sorts object properties, function parameters, and TypeScript type members. |

---

## 👨‍💻 Developer

Developed by **Abolfazl Sabzmohammadi**.

- GitHub: [github.com/SabziDev](https://github.com/SabziDev)
- Website: [Sabzi.Dev](https://Sabzi.Dev)
