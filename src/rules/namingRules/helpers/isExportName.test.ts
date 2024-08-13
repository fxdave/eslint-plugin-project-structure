import { TSESTree } from "@typescript-eslint/utils";

import {
  isExportName,
  IsExportNameProps,
} from "rules/namingRules/helpers/isExportName";
import { NameType } from "rules/namingRules/namingRules.types";

describe("isExportName", () => {
  test.each<{
    nameType: NameType;
    node:
      | TSESTree.VariableDeclarator
      | TSESTree.ClassDeclaration
      | TSESTree.FunctionDeclaration
      | TSESTree.TSTypeAliasDeclaration
      | TSESTree.TSInterfaceDeclaration
      | TSESTree.TSEnumDeclaration
      | TSESTree.BlockStatement;

    expected: boolean;
  }>([
    {
      nameType: "ClassDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
        },
      } as TSESTree.ClassDeclaration,
      expected: true,
    },
    {
      nameType: "ClassDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
        },
      } as TSESTree.ClassDeclaration,
      expected: true,
    },
    {
      nameType: "FunctionDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
        },
      } as TSESTree.FunctionDeclaration,
      expected: true,
    },
    {
      nameType: "FunctionDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
        },
      } as TSESTree.FunctionDeclaration,
      expected: true,
    },
    {
      nameType: "TSEnumDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
        },
      } as TSESTree.TSEnumDeclaration,
      expected: true,
    },
    {
      nameType: "TSEnumDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
        },
      } as TSESTree.TSEnumDeclaration,
      expected: true,
    },

    {
      nameType: "TSInterfaceDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
        },
      } as TSESTree.TSInterfaceDeclaration,
      expected: true,
    },
    {
      nameType: "TSInterfaceDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
        },
      } as TSESTree.TSInterfaceDeclaration,
      expected: true,
    },

    {
      nameType: "TSTypeAliasDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
        },
      } as TSESTree.TSTypeAliasDeclaration,
      expected: true,
    },
    {
      nameType: "TSTypeAliasDeclaration",
      node: {
        parent: {
          type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
        },
      } as TSESTree.TSTypeAliasDeclaration,
      expected: true,
    },

    {
      nameType: "ArrowFunctionExpression",
      node: {
        parent: {
          parent: {
            type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
          },
        },
      } as TSESTree.VariableDeclarator,
      expected: true,
    },
    {
      nameType: "ArrowFunctionExpression",
      node: {
        parent: {
          parent: {
            type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
          },
        },
      } as TSESTree.VariableDeclarator,
      expected: true,
    },

    {
      nameType: "VariableDeclarator",
      node: {
        parent: {
          parent: {
            type: TSESTree.AST_NODE_TYPES.ExportDefaultDeclaration,
          },
        },
      } as TSESTree.VariableDeclarator,
      expected: true,
    },
    {
      nameType: "VariableDeclarator",
      node: {
        parent: {
          parent: {
            type: TSESTree.AST_NODE_TYPES.ExportNamedDeclaration,
          },
        },
      } as TSESTree.VariableDeclarator,
      expected: true,
    },

    {
      nameType: "ClassDeclaration",
      node: {
        parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "FunctionDeclaration",
      node: {
        parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "TSEnumDeclaration",
      node: {
        parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "TSInterfaceDeclaration",
      node: {
        parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "TSTypeAliasDeclaration",
      node: {
        parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "ArrowFunctionExpression",
      node: {
        parent: {
          parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
        },
      } as TSESTree.BlockStatement,
      expected: false,
    },

    {
      nameType: "VariableDeclarator",
      node: {
        parent: {
          parent: { type: TSESTree.AST_NODE_TYPES.BlockStatement },
        },
      } as TSESTree.BlockStatement,
      expected: false,
    },
  ])("Should return correct value for = %o", ({ nameType, node, expected }) => {
    expect(
      isExportName({
        nameType,
        node: node as IsExportNameProps["node"],
      }),
    ).toEqual(expected);
  });
});
