/* eslint-disable unicorn/consistent-function-scoping */

import { eventHandlersOrder, propsOrder } from "../props-order";

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
    const firstGroupSet = new Set(propsOrder);

    const isEventHandler = (attrName) => /^on[A-Z]/.test(attrName);

    const getEventPriority = (handlerName) => {
      const index = eventHandlersOrder.indexOf(handlerName);

      return index === -1 ? 999 : index;
    };

    return {
      JSXOpeningElement(node) {
        const allAttrs = node.attributes;

        const spreads = allAttrs.filter(
          (attr) => attr.type === "JSXSpreadAttribute",
        );

        const normalAttrs = allAttrs.filter(
          (attr) => attr.type === "JSXAttribute",
        );

        if (normalAttrs.length === 0 && spreads.length === 0) return;

        const firstGroup = propsOrder.flatMap((name) =>
          normalAttrs.filter((attr) => attr.name.name === name),
        );

        const eventHandlers = normalAttrs
          .filter((attr) => isEventHandler(attr.name.name))
          .sort((a, b) => {
            const priorityA = getEventPriority(a.name.name);
            const priorityB = getEventPriority(b.name.name);

            return priorityA === 999 && priorityB === 999
              ? 0
              : priorityA - priorityB;
          });

        const classStyle = normalAttrs
          .filter((attr) => ["className", "style"].includes(attr.name.name))
          .sort((a, b) => {
            if (a.name.name === "className" && b.name.name === "style") {
              return -1;
            }

            return a.name.name === "style" && b.name.name === "className"
              ? 1
              : 0;
          });

        const otherProps = normalAttrs.filter((attr) => {
          const { name } = attr.name;

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

        for (const attr of allAttrs) {
          if (
            attr.type === "JSXAttribute" ||
            attr.type === "JSXSpreadAttribute"
          ) {
            currentOrder.push(attr);
          }
        }

        if (currentOrder.length === sortedNormal.length) {
          for (const [i, element] of currentOrder.entries()) {
            if (element === sortedNormal[i]) {
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
          .map((attr) => sourceCode.getText(attr))
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
