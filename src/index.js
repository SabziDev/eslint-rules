import packageJson from "../package.json" with { type: "json" };
import mergeDuplicateIdAndClassNameProps from "./rules/merge/merge-duplicate-id-and-classname-props";
import mergeExports from "./rules/merge/merge-exports";
import noInvalidIdAndClassNameValue from "./rules/no-invalid/no-invalid-id-and-classname-value";
import noUselessEmptyType from "./rules/no-useless/no-useless-empty-type";
import noUselessTemplateLiteral from "./rules/no-useless/no-useless-template-literal";
import paddingBeforeJumpStatement from "./rules/padding/padding-before-jump-statement";
import sortComments from "./rules/sort/sort-comments";
import sortJsxProps from "./rules/sort/sort-jsx-props";
import sortObjectProps from "./rules/sort/sort-object-props";

const rules = {
  "merge-duplicate-id-and-classname-props": mergeDuplicateIdAndClassNameProps,
  "merge-exports": mergeExports,
  "no-invalid-id-and-classname-value": noInvalidIdAndClassNameValue,
  "no-useless-empty-type": noUselessEmptyType,
  "no-useless-template-literal": noUselessTemplateLiteral,
  "padding-before-jump-statement": paddingBeforeJumpStatement,
  "sort-comments": sortComments,
  "sort-jsx-props": sortJsxProps,
  "sort-object-props": sortObjectProps,
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
