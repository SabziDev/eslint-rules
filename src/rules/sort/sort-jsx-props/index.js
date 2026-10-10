/* eslint-disable unicorn/no-array-sort */
/* eslint-disable unicorn/consistent-function-scoping */

import { eventHandlersOrder, sortOrder } from "../sort-order";

const sortJsxProps = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      wrongOrder: "Props should be ordered!",
    },
  },

  create(context) {
    const { sourceCode } = context;
    const firstGroupSet = new Set(sortOrder);

    const isEventHandler = (attributeName) => /^on[A-Z]/.test(attributeName);

    const getEventPriority = (handlerName) => {
      const index = eventHandlersOrder.indexOf(handlerName);

      return index === -1 ? 999 : index;
    };

    return {
      JSXOpeningElement(node) {
        const allAttributes = node.attributes;

        const spreads = allAttributes.filter(
          (attribute) => attribute.type === "JSXSpreadAttribute",
        );

        const normalAttributes = allAttributes.filter(
          (attribute) => attribute.type === "JSXAttribute",
        );

        if (normalAttributes.length === 0 && spreads.length === 0) return;

        const firstGroup = sortOrder.flatMap((name) =>
          normalAttributes.filter((attribute) => attribute.name.name === name),
        );

        const eventHandlers = normalAttributes
          .filter((attribute) => isEventHandler(attribute.name.name))
          .sort((a, b) => {
            const priorityA = getEventPriority(a.name.name);
            const priorityB = getEventPriority(b.name.name);

            return priorityA === 999 && priorityB === 999
              ? 0
              : priorityA - priorityB;
          });

        const classStyle = normalAttributes
          .filter((attribute) =>
            ["className", "style"].includes(attribute.name.name),
          )
          .sort((a, b) => {
            if (a.name.name === "className" && b.name.name === "style") {
              return -1;
            }

            return a.name.name === "style" && b.name.name === "className"
              ? 1
              : 0;
          });

        const otherProps = normalAttributes.filter((attribute) => {
          const { name } = attribute.name;

          return (
            !firstGroupSet.has(name) &&
            !isEventHandler(name) &&
            !["className", "style"].includes(name)
          );
        });

        const sortedNormal = [
          ...firstGroup,
          ...otherProps,
          ...eventHandlers,
          ...classStyle,
          ...spreads,
        ];

        let isNeedsFix = false;
        const currentOrder = [];

        for (const attribute of allAttributes) {
          if (
            attribute.type === "JSXAttribute" ||
            attribute.type === "JSXSpreadAttribute"
          ) {
            currentOrder.push(attribute);
          }
        }

        if (currentOrder.length === sortedNormal.length) {
          for (const [index, element] of currentOrder.entries()) {
            if (element === sortedNormal[index]) {
              continue;
            }

            isNeedsFix = true;

            break;
          }
        } else {
          isNeedsFix = true;
        }

        if (!isNeedsFix) return;

        const opening = `<${sourceCode.getText(node.name)} ${sortedNormal
          .map((attribute) => sourceCode.getText(attribute))
          .join(" ")}${node.selfClosing ? " />" : ">"}`;

        context.report({
          node,
          messageId: "wrongOrder",
          fix: (fixer) =>
            fixer.replaceTextRange([node.range[0], node.range[1]], opening),
        });
      },
    };
  },
};

export default sortJsxProps;
