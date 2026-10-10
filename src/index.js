import packageJson from "../package.json" with { type: "json" };
import * as rulesRegistry from "./rules/rules-registry";

const rules = {
  "merge-duplicate-id-and-classname-props":
    rulesRegistry.mergeDuplicateIdAndClassNameProps,
  "merge-exports": rulesRegistry.mergeExports,
  "no-invalid-id-and-classname-value":
    rulesRegistry.noInvalidIdAndClassNameValue,
  "no-useless-empty-type": rulesRegistry.noUselessEmptyType,
  "no-useless-template-literal": rulesRegistry.noUselessTemplateLiteral,
  "padding-before-jump-statement": rulesRegistry.paddingBeforeJumpStatement,
  "sort-comments": rulesRegistry.sortComments,
  "sort-jsx-props": rulesRegistry.sortJsxProps,
  "sort-props": rulesRegistry.sortProps,
};

const plugin = {
  meta: { name: packageJson.name, version: packageJson.version },
  rules,
  configs: {},
};
plugin.configs.recommended = {
  plugins: { "@sabzidev": plugin },
  rules: Object.fromEntries(
    Object.keys(rules).map((rule) => [`@sabzidev/${rule}`, "warn"]),
  ),
};

export default plugin;
