/* eslint-disable unicorn/no-array-sort */
/* eslint-disable unicorn/consistent-function-scoping */

import { eventHandlersOrder, propsOrder } from "../sort-order";

const sortProps = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      wrongDestructure: "Destructured properties should be ordered!",
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const firstGroupSet = new Set(propsOrder);

    const isEventHandler = (name) => /^on[A-Z]/.test(name);

    const getEventPriority = (handlerName) => {
      const index = eventHandlersOrder.indexOf(handlerName);

      return index === -1 ? 999 : index;
    };

    const getKeyName = (prop) => {
      if (!prop) return "";

      if (prop.type === "Property") {
        return prop.key?.name ?? prop.key?.value ?? "";
      }

      return prop.type === "Identifier" ? prop.name : "";
    };

    const isRestElement = (item) =>
      ["ExperimentalRestProperty", "RestElement"].includes(item.type);

    const sortItems = (items) => {
      if (items.length <= 1) return items;

      const firstGroup = propsOrder.flatMap((name) =>
        items.filter((item) => getKeyName(item) === name),
      );

      const otherProps = items.filter((item) => {
        const keyName = getKeyName(item);

        return (
          !firstGroupSet.has(keyName) &&
          !isEventHandler(keyName) &&
          !["activeClassName", "activeStyle", "className", "style"].includes(
            keyName,
          )
        );
      });

      const eventHandlers = items
        .filter((item) => isEventHandler(getKeyName(item)))
        .sort((a, b) => {
          const priorityA = getEventPriority(getKeyName(a));
          const priorityB = getEventPriority(getKeyName(b));

          return priorityA === 999 && priorityB === 999
            ? 0
            : priorityA - priorityB;
        });

      const classStyleOrder = [
        "className",
        "style",
        "activeClassName",
        "activeStyle",
      ];

      const classStyle = items
        .filter((item) => classStyleOrder.includes(getKeyName(item)))
        .sort(
          (a, b) =>
            classStyleOrder.indexOf(getKeyName(a)) -
            classStyleOrder.indexOf(getKeyName(b)),
        );

      return [...firstGroup, ...otherProps, ...eventHandlers, ...classStyle];
    };

    const sortPropertiesWithRestBarriers = (properties) => {
      const result = [];
      let currentChunk = [];

      for (const prop of properties) {
        if (isRestElement(prop)) {
          if (currentChunk.length > 0) {
            result.push(...sortItems(currentChunk));
            currentChunk = [];
          }

          result.push(prop);
        } else {
          currentChunk.push(prop);
        }
      }

      if (currentChunk.length > 0) {
        result.push(...sortItems(currentChunk));
      }

      return result;
    };

    const areItemsDifferent = (current, sorted) =>
      current.some((item, index) => item !== sorted[index]);

    const hasCommentsInRange = (start, end) =>
      sourceCode
        .getAllComments()
        .some(
          (comment) => comment.range[0] >= start && comment.range[1] <= end,
        );

    const reportSortedItems = (node, items, sorted) => {
      if (!areItemsDifferent(items, sorted)) return;

      const firstItem = items[0];
      const lastItem = items.at(-1);

      const start = firstItem.range[0];
      const end = lastItem.range[1];

      const report = {
        node,
        messageId: "wrongDestructure",
      };

      // Avoid autofixing when comments could be lost or repositioned.
      if (!hasCommentsInRange(start, end)) {
        report.fix = (fixer) => {
          const sortedText = sorted
            .map((item) => sourceCode.getText(item))
            .join(", ");

          return fixer.replaceTextRange([start, end], sortedText);
        };
      }

      context.report(report);
    };

    const processObjectPattern = (node) => {
      const { properties } = node;

      if (!properties || properties.length <= 1) return;

      const sorted = sortPropertiesWithRestBarriers(properties);

      reportSortedItems(node, properties, sorted);
    };

    return {
      ObjectPattern: processObjectPattern,
    };
  },
};

export default sortProps;
