/* eslint-disable unicorn/no-array-sort */
/* eslint-disable sonarjs/super-linear-regex */
/* eslint-disable no-shadow */
/* eslint-disable unicorn/no-array-callback-reference */
/* eslint-disable unicorn/consistent-function-scoping */

const mergeExports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      mergeExports:
        "Combine and move exports into a single export block at the end of the file",
    },
  },

  create(context) {
    const { sourceCode } = context;

    const isNamedExport = (node) =>
      node?.type === "ExportNamedDeclaration" &&
      !node.source &&
      !node.declaration &&
      node.specifiers?.length > 0;

    const isDefaultExport = (node) => node?.type === "ExportDefaultDeclaration";

    const isExport = (node) => isNamedExport(node) || isDefaultExport(node);

    const getExportedName = (specifier) =>
      specifier.exported.name ?? specifier.exported.value;

    const isSorted = (specifiers) =>
      specifiers.every(
        (specifier, index) =>
          index === 0 ||
          getExportedName(specifiers[index - 1]).localeCompare(
            getExportedName(specifier),
          ) <= 0,
      );

    const isAlreadyMerged = (body, exportNodes) => {
      const namedExports = exportNodes.filter(isNamedExport);
      const defaultExport = exportNodes.find(isDefaultExport);

      const expectedExportCount =
        Number(namedExports.length > 0) + Number(Boolean(defaultExport));

      const exportsAreAtEnd =
        exportNodes.length === expectedExportCount &&
        body
          .slice(-exportNodes.length)
          .every((node, index) => node === exportNodes[index]);

      const hasCorrectOrder =
        !defaultExport || exportNodes.at(-1) === defaultExport;

      const namedExportsAreSorted =
        namedExports.length <= 1 &&
        namedExports.every(({ specifiers }) => isSorted(specifiers));

      return exportsAreAtEnd && hasCorrectOrder && namedExportsAreSorted;
    };

    return {
      Program(program) {
        const { body } = program;

        const exportNodes = body.filter(isExport);

        if (exportNodes.length === 0 || isAlreadyMerged(body, exportNodes)) {
          return;
        }

        const namedExports = exportNodes.filter(isNamedExport);
        const defaultExport = exportNodes.find(isDefaultExport);

        const specifiers = namedExports
          .flatMap(({ specifiers }) => specifiers)
          .map((specifier) => ({
            name: getExportedName(specifier),
            text: sourceCode.getText(specifier),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const mergedNamedExport =
          specifiers.length > 0
            ? `export { ${specifiers.map(({ text }) => text).join(", ")} };`
            : "";

        const defaultExportText = defaultExport
          ? sourceCode.getText(defaultExport)
          : "";

        const exportBlock = [mergedNamedExport, defaultExportText]
          .filter(Boolean)
          .join("\n");

        /*
         * Remove ONLY the export statements.
         *
         * Everything else stays byte-for-byte untouched:
         * - comments
         * - blank lines
         * - indentation
         * - normal statements
         * - imports
         */
        const exportRanges = exportNodes
          .map(({ range }) => range)
          .sort((a, b) => b[0] - a[0]);

        let remainingCode = sourceCode.text;

        for (const [start, end] of exportRanges) {
          remainingCode =
            remainingCode.slice(0, start) + remainingCode.slice(end);
        }

        /*
         * Only clean the whitespace at the END of the original file.
         * Nothing else is reformatted.
         */
        const content = remainingCode.replace(/\s+$/, "");

        const expectedCode = `${
          content ? `${content}\n\n` : ""
        }${exportBlock}\n`;

        context.report({
          node: exportNodes[0],
          messageId: "mergeExports",

          fix(fixer) {
            return fixer.replaceTextRange(
              [0, sourceCode.text.length],
              expectedCode,
            );
          },
        });
      },
    };
  },
};

export default mergeExports;
