const sortComments = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      reorganize: "Comments should be ordered!",
    },
  },

  create(context) {
    const { sourceCode } = context;
    const { text } = sourceCode;

    const comments = sourceCode.getAllComments();

    const eslintDisableComments = [];

    for (const comment of comments) {
      const rawText = comment.value.trim();

      const isBlockComment = comment.type === "Block";

      if (!isBlockComment) continue;

      const pattern = /^eslint-disable\s+/;

      if (pattern.test(rawText)) {
        eslintDisableComments.push({
          text: `/* ${rawText} */`,
          line: comment.loc.start.line,
          range: comment.range,
        });
      }
    }

    if (eslintDisableComments.length === 0) return {};

    return {
      Program(node) {
        eslintDisableComments.sort((a, b) => a.line - b.line);

        let eslintSection = "";

        for (let index = 0; index < eslintDisableComments.length; index++) {
          eslintSection += eslintDisableComments[index].text;

          if (index < eslintDisableComments.length - 1) {
            eslintSection += "\n";
          }
        }

        eslintSection += "\n\n";

        let newText = text;

        for (
          let index = eslintDisableComments.length - 1;
          index >= 0;
          index--
        ) {
          const comment = eslintDisableComments[index];
          const before = newText.slice(0, comment.range[0]);
          const after = newText.slice(comment.range[1]);
          newText = before + after;
        }

        while (newText.startsWith("\n")) {
          newText = newText.slice(1);
        }

        const finalCode = eslintSection + newText;

        if (text !== finalCode) {
          context.report({
            node,
            messageId: "reorganize",
            fix: (fixer) => fixer.replaceTextRange([0, text.length], finalCode),
          });
        }
      },
    };
  },
};

export default sortComments;
