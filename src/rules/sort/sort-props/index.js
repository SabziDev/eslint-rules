/* eslint-disable max-params */
/* eslint-disable unicorn/no-array-sort */
/* eslint-disable unicorn/prefer-includes-over-repeated-comparisons */
/* eslint-disable max-lines-per-function */
/* eslint-disable unicorn/consistent-function-scoping */

import { eventHandlersOrder, sortOrder } from "../sort-order";

const sortProps = {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      wrongOrder: "Object properties should be ordered!",
      wrongDestructure: "Destructured properties should be ordered!",
      wrongParams: "Function parameters should be ordered!",
      wrongCallArguments: "Function call arguments should be ordered!",
      wrongTypeProperties: "Type properties should be ordered!",
    },
    schema: [],
  },

  create(context) {
    const { sourceCode } = context;
    const firstGroupSet = new Set(sortOrder);

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

      const firstGroup = sortOrder.flatMap((name) =>
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
        .filter((item) => isEventHandler(getKeyName(item)))
        .sort((a, b) => {
          const priorityA = getEventPriority(getKeyName(a));
          const priorityB = getEventPriority(getKeyName(b));

          return priorityA === 999 && priorityB === 999
            ? 0
            : priorityA - priorityB;
        });

      const classStyle = items
        .filter((item) => ["className", "style"].includes(getKeyName(item)))
        .sort((a, b) => {
          const nameA = getKeyName(a);
          const nameB = getKeyName(b);

          if (nameA === "className" && nameB === "style") return -1;

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

    const sortTypeMembers = (members) => {
      if (members.length <= 1) return members;

      const sortableMembers = members.filter(
        (member) => !isSpread(member) && isTypeMember(member),
      );

      const otherMembers = members.filter(
        (member) => !sortableMembers.includes(member),
      );

      return [...sortItems(sortableMembers), ...otherMembers];
    };

    const areItemsDifferent = (current, sorted) => {
      return current.length === sorted.length
        ? current.some((item, index) => item !== sorted[index])
        : true;
    };

    const buildObjectText = (items) => {
      return `{ ${items.map((item) => sourceCode.getText(item)).join(", ")} }`;
    };

    const buildTypeMembersText = (members) => {
      return members.map((member) => sourceCode.getText(member)).join("\n");
    };

    const reportSortedItems = (node, items, sorted, messageId, buildText) => {
      if (!areItemsDifferent(items, sorted)) return;

      const firstItem = items[0];
      const lastItem = items.at(-1);

      context.report({
        node,
        messageId,
        fix(fixer) {
          const sortedText = buildText(sorted);

          return fixer.replaceTextRange(
            [firstItem.range[0], lastItem.range[1]],
            sortedText,
          );
        },
      });
    };

    const processObjectPattern = (node, messageId) => {
      const { properties } = node;

      if (!properties || properties.length <= 1) return;

      const sorted = sortPropertiesWithSpreadBarriers(properties);

      reportSortedItems(node, properties, sorted, messageId, (items) =>
        items.map((item) => sourceCode.getText(item)).join(", "),
      );
    };

    const getParamCategory = (name) => {
      const propIndex = sortOrder.indexOf(name);

      if (propIndex !== -1) {
        return { category: 0, priority: propIndex };
      }

      if (isEventHandler(name)) {
        return {
          category: 2,
          priority: getEventPriority(name),
        };
      }

      if (name === "className") {
        return { category: 3, priority: 0 };
      }

      return { category: name === "style" ? 4 : 1, priority: 0 };
    };

    const sortIdentifiers = (items) => {
      return items
        .map((item, index) => ({
          item,
          index,
          ...getParamCategory(item.name),
        }))
        .sort((a, b) => {
          if (a.category !== b.category) {
            return a.category - b.category;
          }

          return a.priority === b.priority
            ? a.index - b.index
            : a.priority - b.priority;
        })
        .map(({ item }) => item);
    };

    const processFunctionParams = (node) => {
      const { params } = node;

      if (!params || params.length === 0) return;

      for (const param of params) {
        if (param.type === "ObjectPattern") {
          processObjectPattern(param, "wrongParams");
        }
      }

      if (
        params.length <= 1 ||
        params.some((param) => param.type !== "Identifier")
      ) {
        return;
      }

      const sortedParams = sortIdentifiers(params);

      if (!areItemsDifferent(params, sortedParams)) return;

      const firstParam = params[0];
      const lastParam = params.at(-1);

      context.report({
        node,
        messageId: "wrongParams",
        fix(fixer) {
          const replacement = sortedParams
            .map((param) => sourceCode.getText(param))
            .join(", ");

          return fixer.replaceTextRange(
            [firstParam.range[0], lastParam.range[1]],
            replacement,
          );
        },
      });
    };

    const getArgumentName = (argument) => {
      if (argument.type === "Identifier") {
        return argument.name;
      }

      return argument.type === "Literal" ||
        argument.type === "StringLiteral" ||
        argument.type === "NumericLiteral"
        ? String(argument.value)
        : null;
    };

    const processCallArguments = (node) => {
      const { arguments: arguments_ } = node;

      if (
        arguments_.length <= 1 ||
        arguments_.some(
          (argument) =>
            argument.type === "SpreadElement" ||
            getArgumentName(argument) === null,
        )
      ) {
        return;
      }

      const sortedArguments = arguments_
        .map((argument, index) => ({
          argument,
          index,
          ...getParamCategory(getArgumentName(argument)),
        }))
        .sort((a, b) => {
          if (a.category !== b.category) {
            return a.category - b.category;
          }

          return a.priority === b.priority
            ? a.index - b.index
            : a.priority - b.priority;
        })
        .map(({ argument }) => argument);

      if (!areItemsDifferent(arguments_, sortedArguments)) return;

      const firstArgument = arguments_[0];
      const lastArgument = arguments_.at(-1);

      context.report({
        node,
        messageId: "wrongCallArguments",
        fix(fixer) {
          const replacement = sortedArguments
            .map((argument) => sourceCode.getText(argument))
            .join(", ");

          return fixer.replaceTextRange(
            [firstArgument.range[0], lastArgument.range[1]],
            replacement,
          );
        },
      });
    };

    const processTypeMembers = (node) => {
      const members = node.body ?? node.members;

      if (!members || members.length <= 1) return;

      const sorted = sortTypeMembers(members);

      reportSortedItems(
        node,
        members,
        sorted,
        "wrongTypeProperties",
        buildTypeMembersText,
      );
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
            return fixer.replaceText(node, buildObjectText(sorted));
          },
        });
      },

      ObjectPattern(node) {
        processObjectPattern(node, "wrongDestructure");
      },

      TSTypeLiteral: processTypeMembers,

      TSInterfaceBody: processTypeMembers,

      FunctionDeclaration: processFunctionParams,

      FunctionExpression: processFunctionParams,

      ArrowFunctionExpression: processFunctionParams,

      TSDeclareFunction: processFunctionParams,

      TSFunctionType: processFunctionParams,

      TSCallSignatureDeclaration: processFunctionParams,

      TSConstructSignatureDeclaration: processFunctionParams,

      TSMethodSignature: processFunctionParams,

      CallExpression: processCallArguments,
    };
  },
};

export default sortProps;
