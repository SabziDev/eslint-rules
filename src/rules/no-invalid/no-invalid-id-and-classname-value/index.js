/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable max-depth */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable max-lines-per-function */
/* eslint-disable complexity */

const noInvalidIdAndClassNameValue = {
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      invalid: "{{attribute}} cannot be {{value}}!",
      singleItemArray:
        "{{attribute}} should not use an array with only one item!",
    },
  },

  create(context) {
    const attributes = new Set(["className", "id"]);
    const sourceCode = context.sourceCode || context.getSourceCode();

    const checkArrayElements = (elements) => {
      if (elements.length === 0) {
        return { invalidValue: "empty", index: -2 };
      }

      for (const [index, element] of elements.entries()) {
        if (element.type === "Literal") {
          if (element.value === "") {
            return { invalidValue: "empty", index };
          }
          if ([false, null, true].includes(element.value)) {
            return { invalidValue: String(element.value), index };
          }
        } else if (
          element.type === "Identifier" &&
          element.name === "undefined"
        ) {
          return { invalidValue: "undefined", index };
        }
      }

      return null;
    };

    return {
      JSXAttribute(node) {
        const attribute = node.name.name;

        if (!attributes.has(attribute) || !node.value) {
          return;
        }

        let invalidValue;
        let invalidElementIndex = -1;
        let isArrayExpression = false;

        if (node.value.type === "Literal" && node.value.value === "") {
          invalidValue = "empty";
        } else if (node.value.type === "JSXExpressionContainer") {
          const { expression } = node.value;

          if (
            expression.type === "Literal" &&
            [false, null, true].includes(expression.value)
          ) {
            invalidValue = String(expression.value);
          } else if (
            expression.type === "Identifier" &&
            expression.name === "undefined"
          ) {
            invalidValue = "undefined";
          } else if (expression.type === "ArrayExpression") {
            isArrayExpression = true;
            const result = checkArrayElements(expression.elements);

            if (result) {
              ({ invalidValue, index: invalidElementIndex } = result);
            }
          } else if (expression.type === "ObjectExpression") {
            if (expression.properties.length === 0) {
              invalidValue = "empty";
            }
          } else if (
            expression.type === "CallExpression" &&
            expression.callee.name === "clsx" &&
            expression.arguments.length === 1
          ) {
            const argument = expression.arguments[0];

            if (argument.type === "ArrayExpression") {
              isArrayExpression = true;
              const result = checkArrayElements(argument.elements);

              if (result) {
                ({ invalidValue, index: invalidElementIndex } = result);
              }
              if (
                isArrayExpression &&
                expression.type === "CallExpression" &&
                expression.callee.name === "clsx"
              ) {
                const clsxArgument = expression.arguments[0];

                if (
                  clsxArgument?.type === "ArrayExpression" &&
                  clsxArgument.elements.length === 1 &&
                  clsxArgument.elements[0]?.type === "Literal"
                ) {
                  context.report({
                    data: { value: "single-item-array", attribute },
                    node,
                    messageId: "singleItemArray",
                    fix: (fixer) =>
                      fixer.replaceText(
                        node.value,
                        `{${clsxArgument.elements[0].raw}}`,
                      ),
                  });

                  return;
                }
              }
            } else if (argument.type === "Literal" && argument.value === "") {
              invalidValue = "empty";
            } else if (
              argument.type === "Literal" &&
              [false, null, true].includes(argument.value)
            ) {
              invalidValue = String(argument.value);
            } else if (
              argument.type === "Identifier" &&
              argument.name === "undefined"
            ) {
              invalidValue = "undefined";
            } else if (
              argument.type === "ObjectExpression" &&
              argument.properties.length === 0
            ) {
              invalidValue = "empty";
            }
          }
        }

        if (!invalidValue) return;

        context.report({
          data: { value: invalidValue, attribute },
          node,
          messageId:
            invalidValue === "single-item-array"
              ? "singleItemArray"
              : "invalid",
          fix: (fixer) => {
            if (
              invalidElementIndex === -2 ||
              invalidElementIndex === -1 ||
              !isArrayExpression
            ) {
              return fixer.remove(node);
            }

            const arrayNode = node.value.expression.arguments
              ? node.value.expression.arguments[0]
              : node.value.expression;

            const { elements } = arrayNode;

            if (elements.length === 1) {
              return fixer.remove(node);
            }

            const invalidElement = elements[invalidElementIndex];
            const nextElement = elements[invalidElementIndex + 1];
            const prevElement = elements[invalidElementIndex - 1];

            let rangeToRemove;

            if (nextElement) {
              const start = invalidElement.range[0];
              const end = nextElement.range[0];
              rangeToRemove = [start, end];
            } else if (prevElement) {
              const start = prevElement.range[1];
              const end = invalidElement.range[1];
              rangeToRemove = [start, end];
            } else {
              rangeToRemove = invalidElement.range;
            }

            const textBefore = sourceCode.getText().slice(0, rangeToRemove[0]);
            const textAfter = sourceCode.getText().slice(rangeToRemove[1]);
            const newText = textBefore + textAfter;

            return fixer.replaceTextRange(
              [0, sourceCode.getText().length],
              newText,
            );
          },
        });
      },
    };
  },
};

export default noInvalidIdAndClassNameValue;
