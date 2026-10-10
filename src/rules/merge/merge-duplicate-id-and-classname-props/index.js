/* eslint-disable unicorn/consistent-function-scoping */

const mergeDuplicateIdAndClassNameProps = {
  meta: {
    type: "suggestion",

    fixable: "code",

    messages: {
      merge: "Duplicate '{{prop}}' props should be merged into one",
    },
  },

  create(context) {
    const getStringValue = (attribute) => {
      const { value } = attribute;

      if (!value) {
        return null;
      }

      if (value.type === "Literal") {
        return value.value;
      }

      return value.type === "JSXExpressionContainer" &&
        value.expression.type === "Literal"
        ? value.expression.value
        : null;
    };

    return {
      JSXOpeningElement(node) {
        for (const propName of ["className", "id"]) {
          const attributes = node.attributes.filter(
            (attribute) =>
              attribute.type === "JSXAttribute" &&
              attribute.name?.name === propName,
          );

          if (attributes.length < 2) {
            continue;
          }

          const values = [];

          for (const attribute of attributes) {
            const value = getStringValue(attribute);

            if (typeof value !== "string") {
              return;
            }

            values.push(value);
          }

          context.report({
            data: {
              prop: propName,
            },
            node: attributes[1],
            messageId: "merge",
            fix(fixer) {
              const mergedValue = [...new Set(values)].join(" ").trim();

              const fixes = [
                fixer.replaceText(
                  attributes[0],
                  `${propName}="${mergedValue}"`,
                ),
              ];

              for (let index = 1; index < attributes.length; index++) {
                fixes.push(fixer.remove(attributes[index]));
              }

              return fixes;
            },
          });
        }
      },
    };
  },
};

export default mergeDuplicateIdAndClassNameProps;
