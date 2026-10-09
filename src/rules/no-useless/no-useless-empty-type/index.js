const noUselessEmptyType = {
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      emptyType: "Empty type alias is not allowed.",
      emptyInterface: "Empty interface is not allowed.",
    },
    schema: [],
  },

  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        if (
          node.typeAnnotation.type === "TSTypeLiteral" &&
          node.typeAnnotation.members.length === 0
        ) {
          context.report({
            node,
            messageId: "emptyType",
            fix(fixer) {
              return fixer.remove(node);
            },
          });
        }
      },

      TSInterfaceDeclaration(node) {
        if (node.body.body.length === 0) {
          context.report({
            node,
            messageId: "emptyInterface",
            fix(fixer) {
              return fixer.remove(node);
            },
          });
        }
      },
    };
  },
};

export default noUselessEmptyType;
