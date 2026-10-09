const noUselessTemplateLiteral = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      remove:
        "This template literal has a single expression and can be replaced with the expression itself",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      TemplateLiteral(node) {
        const hasOneExpression = node.expressions.length === 1;

        if (!hasOneExpression) {
          return;
        }

        const isBeforeEmpty = node.quasis[0].value.raw === "";
        const isAfterEmpty = node.quasis[1].value.raw === "";

        const isBothSidesEmpty = isBeforeEmpty && isAfterEmpty;

        if (!isBothSidesEmpty) {
          return;
        }

        const expression = node.expressions[0];
        const expressionText = sourceCode.getText(expression);

        context.report({
          node,
          messageId: "remove",
          fix: (fixer) => fixer.replaceText(node, expressionText),
        });
      },
    };
  },
};

export default noUselessTemplateLiteral;
