import { defineConfig } from "@fullstacksjs/eslint-config";
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
const plugins = [sonarjs.configs.recommended, unicorn.configs.recommended];
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
  { rules: baseRules },

  plugins,
  { rules: pluginsRules },
);

export default config;
