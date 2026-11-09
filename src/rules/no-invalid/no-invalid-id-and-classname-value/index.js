/* eslint-disable max-params */
/* eslint-disable sonarjs/cognitive-complexity */

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
    schema: [],
  },

  create(context) {
    const attributes = new Set(["className", "id"]);
    const classNameUtilities = new Set(["clsx", "cn"]);

    const sourceCode = context.sourceCode || context.getSourceCode();

    const isLiteral = (node) =>
      node &&
      (node.type === "Literal" ||
        [
          "BooleanLiteral",
          "NullLiteral",
          "NumericLiteral",
          "StringLiteral",
        ].includes(node.type));

    const getLiteralValue = (node) => {
      return isLiteral(node) ? node.value : undefined;
    };

    const getInvalidLiteralValue = (node) => {
      if (!isLiteral(node)) return null;

      const value = getLiteralValue(node);

      if (value === "") return "empty";

      return [false, null, true].includes(value) ? String(value) : null;
    };

    const isUndefined = (node) =>
      node?.type === "Identifier" && node.name === "undefined";

    const isEmptyObject = (node) =>
      node?.type === "ObjectExpression" && node.properties.length === 0;

    const getCalleeName = (node) => {
      if (node.type === "Identifier") {
        return node.name;
      }

      if (node.type === "MemberExpression") {
        if (!node.computed && node.property.type === "Identifier") {
          return node.property.name;
        }

        if (node.computed && isLiteral(node.property)) {
          return String(node.property.value);
        }
      }

      return null;
    };

    const unwrapExpression = (node) => {
      const wrappers = new Set([
        "ChainExpression",
        "ParenthesizedExpression",
        "TSAsExpression",
        "TSNonNullExpression",
        "TSTypeAssertion",
        "TypeCastExpression",
      ]);

      let expression = node;

      while (wrappers.has(expression?.type)) {
        expression = expression.expression ?? expression.argument;
      }

      return expression;
    };

    const inspectExpression = (node) => {
      if (!node) return null;

      const expression = unwrapExpression(node);

      const invalidValue = getInvalidLiteralValue(expression);

      if (invalidValue !== null) {
        return {
          invalidValue,
          node: expression,
        };
      }

      if (isUndefined(expression)) {
        return {
          invalidValue: "undefined",
          node: expression,
        };
      }

      if (expression.type === "ArrayExpression") {
        if (expression.elements.length === 0) {
          return {
            invalidValue: "empty",
            node: expression,
          };
        }

        for (const [index, element] of expression.elements.entries()) {
          if (!element || element.type === "SpreadElement") {
            continue;
          }

          const result = inspectExpression(element);

          if (result) {
            return {
              ...result,
              arrayNode: result.arrayNode ?? expression,
              elementIndex: result.arrayNode ? result.elementIndex : index,
            };
          }
        }

        return null;
      }

      if (expression.type === "ObjectExpression") {
        if (isEmptyObject(expression)) {
          return {
            invalidValue: "empty",
            node: expression,
          };
        }

        // Non-empty objects can represent conditional class maps.
        return null;
      }

      if (
        expression.type === "CallExpression" ||
        expression.type === "NewExpression"
      ) {
        for (const argument of expression.arguments) {
          if (!argument || argument.type === "SpreadElement") {
            continue;
          }

          const result = inspectExpression(argument);

          if (result) return result;
        }

        return null;
      }

      if (expression.type === "ConditionalExpression") {
        return (
          inspectExpression(expression.consequent) ||
          inspectExpression(expression.alternate)
        );
      }

      if (expression.type === "LogicalExpression") {
        return inspectExpression(expression.right);
      }

      if (expression.type === "SequenceExpression") {
        return inspectExpression(expression.expressions.at(-1));
      }

      if (expression.type === "AssignmentExpression") {
        return inspectExpression(expression.right);
      }

      return expression.type === "AwaitExpression"
        ? inspectExpression(expression.argument)
        : null;
    };

    const getSingleItemArray = (expression) => {
      if (expression.type !== "CallExpression") {
        return null;
      }

      const calleeName = getCalleeName(expression.callee);

      if (
        !classNameUtilities.has(calleeName) ||
        expression.arguments.length !== 1
      ) {
        return null;
      }

      const argument = expression.arguments[0];

      if (
        argument.type !== "ArrayExpression" ||
        argument.elements.length !== 1
      ) {
        return null;
      }

      const element = argument.elements[0];

      return !element ||
        element.type !== "Literal" ||
        getInvalidLiteralValue(element) !== null
        ? null
        : element;
    };

    const getArrayElementRemovalRange = (arrayNode, index) => {
      const { elements } = arrayNode;
      const element = elements[index];

      if (!element) return null;

      let start;
      let end;

      if (index < elements.length - 1) {
        const nextToken = sourceCode.getTokenAfter(element);

        if (nextToken?.value !== ",") {
          return null;
        }

        start = element.range[0];
        end = nextToken.range[1];
      } else {
        const previousToken = sourceCode.getTokenBefore(element);

        if (previousToken?.value !== ",") {
          return null;
        }

        start = previousToken.range[0];
        end = element.range[1];
      }

      // Never remove comments as part of an automatic fix.
      const hasComments = sourceCode
        .getAllComments()
        .some(
          (comment) => comment.range[0] >= start && comment.range[1] <= end,
        );

      return hasComments ? null : [start, end];
    };

    const getInvalidValueFix = (fixer, node, expression, result) => {
      if (
        expression.type !== "ArrayExpression" ||
        result.arrayNode !== expression
      ) {
        return null;
      }

      const { elements } = expression;

      if (elements.length === 1) {
        return fixer.remove(node);
      }

      const range = getArrayElementRemovalRange(
        expression,
        result.elementIndex,
      );

      return range ? fixer.removeRange(range) : null;
    };

    return {
      JSXAttribute(node) {
        const attribute = node.name.name;

        if (!attributes.has(attribute) || !node.value) {
          return;
        }

        if (node.value.type === "Literal" && node.value.value === "") {
          context.report({
            node,
            messageId: "invalid",
            data: {
              attribute,
              value: "empty",
            },
            fix: (fixer) => fixer.remove(node),
          });

          return;
        }

        if (node.value.type !== "JSXExpressionContainer") {
          return;
        }

        const { expression } = node.value;

        const result = inspectExpression(expression);

        if (result) {
          context.report({
            node,
            messageId: "invalid",
            data: {
              attribute,
              value: result.invalidValue,
            },
            fix: (fixer) =>
              getInvalidValueFix(
                fixer,
                node,
                unwrapExpression(expression),
                result,
              ),
          });

          return;
        }

        const singleItem = getSingleItemArray(unwrapExpression(expression));

        if (!singleItem) return;

        context.report({
          node,
          messageId: "singleItemArray",
          data: {
            attribute,
          },
          fix: (fixer) =>
            fixer.replaceText(
              node.value,
              `{${sourceCode.getText(singleItem)}}`,
            ),
        });
      },
    };
  },
};

export default noInvalidIdAndClassNameValue;
