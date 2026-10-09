/* eslint-disable unicorn/prefer-includes-over-repeated-comparisons */
/* eslint-disable max-lines-per-function */
/* eslint-disable unicorn/consistent-function-scoping */

import { eventHandlersOrder, propsOrder } from "../props-order";

const sortObjectProps = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      wrongOrder: "Object properties should be ordered!",
      wrongDestructure: "Destructured properties should be ordered!",
      wrongParams: "Function parameters should be ordered!",
      wrongTypeProperties: "Type properties should be ordered!",
    },
  },

  create(context) {
    const { sourceCode } = context;
    const firstGroupSet = new Set(propsOrder);

    const isEventHandler = (name) => /^on[A-Z]/.test(name);

    const getEventPriority = (handlerName) => {
      const index = eventHandlersOrder.indexOf(handlerName);

      return index === -1 ? 999 : index;
    };

    const getKeyName = (prop) => {
      if (!prop) return "";

      if (
        prop.type === "Property" ||
        prop.type === "TSPropertySignature" ||
        prop.type === "TSMethodSignature" ||
        prop.type === "TSCallSignatureDeclaration" ||
        prop.type === "TSConstructSignatureDeclaration"
      ) {
        return prop.key?.name || prop.key?.value || "";
      }

      return prop.type === "Identifier" ? prop.name : "";
    };

    const isSpread = (item) => {
      return (
        item.type === "SpreadElement" ||
        item.type === "RestElement" ||
        item.type === "ExperimentalRestProperty"
      );
    };

    const isTypeMember = (item) => {
      return (
        item.type === "TSPropertySignature" ||
        item.type === "TSMethodSignature" ||
        item.type === "TSCallSignatureDeclaration" ||
        item.type === "TSConstructSignatureDeclaration" ||
        item.type === "TSIndexSignature"
      );
    };

    const sortItems = (items) => {
      if (items.length === 0) return items;

      const firstGroup = propsOrder.flatMap((name) =>
        items.filter((item) => getKeyName(item) === name),
      );

      const otherProps = items.filter((item) => {
        const keyName = getKeyName(item);

        return (
          !firstGroupSet.has(keyName) &&
          !isEventHandler(keyName) &&
          !["className", "style"].includes(keyName)
        );
      });

      const eventHandlers = items
        .filter((item) => {
          const keyName = getKeyName(item);

          return isEventHandler(keyName);
        })
        .sort((a, b) => {
          const priorityA = getEventPriority(getKeyName(a));
          const priorityB = getEventPriority(getKeyName(b));

          return priorityA === 999 && priorityB === 999
            ? 0
            : priorityA - priorityB;
        });

      const classStyle = items
        .filter((item) => {
          const keyName = getKeyName(item);

          return ["className", "style"].includes(keyName);
        })
        .sort((a, b) => {
          const nameA = getKeyName(a);
          const nameB = getKeyName(b);

          if (nameA === "className" && nameB === "style") {
            return -1;
          }

          return nameA === "style" && nameB === "className" ? 1 : 0;
        });

      return [...firstGroup, ...otherProps, ...eventHandlers, ...classStyle];
    };

    const sortPropertiesWithSpreadBarriers = (properties) => {
      const result = [];
      let currentChunk = [];

      for (const prop of properties) {
        if (isSpread(prop)) {
          if (currentChunk.length > 0) {
            const sortedChunk = sortItems(currentChunk);

            result.push(...sortedChunk);
            currentChunk = [];
          }

          result.push(prop);
        } else {
          currentChunk.push(prop);
        }
      }

      if (currentChunk.length > 0) {
        const sortedChunk = sortItems(currentChunk);

        result.push(...sortedChunk);
      }

      return result;
    };

    const sortTypeMembers = (members) => {
      if (members.length <= 1) return members;

      const sortableMembers = members.filter(
        (member) => !isSpread(member) && isTypeMember(member),
      );

      const otherMembers = members.filter(
        (member) => !sortableMembers.includes(member),
      );

      const sortedMembers = sortItems(sortableMembers);

      return [...sortedMembers, ...otherMembers];
    };

    const areItemsDifferent = (current, sorted) => {
      if (current.length !== sorted.length) {
        return true;
      }

      for (const [i, item] of current.entries()) {
        if (item === sorted[i]) {
          continue;
        }

        return true;
      }

      return false;
    };

    const buildObjectText = (items) => {
      return `{ ${items.map((item) => sourceCode.getText(item)).join(", ")} }`;
    };

    const buildTypeMembersText = (members) => {
      return members.map((member) => sourceCode.getText(member)).join("\n");
    };

    const processObjectPattern = (node, messageId) => {
      const { properties } = node;

      if (!properties || properties.length <= 1) return;

      const sorted = sortPropertiesWithSpreadBarriers(properties);

      if (!areItemsDifferent(properties, sorted)) return;

      const firstProperty = properties[0];
      const lastProperty = properties.at(-1);

      const start = firstProperty.range[0];
      const end = lastProperty.range[1];

      context.report({
        node,
        messageId,
        fix(fixer) {
          const sortedText = sorted
            .map((property) => sourceCode.getText(property))
            .join(", ");

          return fixer.replaceTextRange([start, end], sortedText);
        },
      });
    };

    const processFunctionParams = (node) => {
      const { params } = node;

      if (!params || params.length === 0) return;

      for (const param of params) {
        if (param.type !== "ObjectPattern") {
          continue;
        }

        processObjectPattern(param, "wrongParams");
      }
    };

    const processTypeMembers = (node) => {
      const members = node.body ?? node.members;

      if (!members || members.length <= 1) return;

      const sorted = sortTypeMembers(members);

      if (!areItemsDifferent(members, sorted)) return;

      const firstMember = members[0];
      const lastMember = members.at(-1);

      const start = firstMember.range[0];
      const end = lastMember.range[1];

      context.report({
        node,
        messageId: "wrongTypeProperties",
        fix(fixer) {
          const sortedText = buildTypeMembersText(sorted);

          return fixer.replaceTextRange([start, end], sortedText);
        },
      });
    };

    return {
      ObjectExpression(node) {
        const { properties } = node;

        if (properties.length <= 1) return;

        const sorted = sortPropertiesWithSpreadBarriers(properties);

        if (!areItemsDifferent(properties, sorted)) return;

        context.report({
          node,
          messageId: "wrongOrder",
          fix(fixer) {
            const sortedText = buildObjectText(sorted);

            return fixer.replaceText(node, sortedText);
          },
        });
      },

      ObjectPattern(node) {
        processObjectPattern(node, "wrongDestructure");
      },

      TSTypeLiteral(node) {
        processTypeMembers(node);
      },

      TSInterfaceBody(node) {
        processTypeMembers(node);
      },

      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation?.type !== "TSTypeLiteral") {
          return;
        }

        processTypeMembers(node.typeAnnotation);
      },

      FunctionDeclaration: processFunctionParams,

      FunctionExpression: processFunctionParams,

      ArrowFunctionExpression: processFunctionParams,
    };
  },
};

export default sortObjectProps;
