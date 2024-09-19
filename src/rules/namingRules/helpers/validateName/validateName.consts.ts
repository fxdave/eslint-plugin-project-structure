import { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";

export const NAMING_RULES_SCHEMA: JSONSchema4 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    Selector: {
      type: "string",
      default: "",
      enum: [
        "class",
        "variable",
        "variableCallExpression",
        "variableTaggedTemplateExpression",
        "function",
        "arrowFunction",
        "type",
        "interface",
        "enum",
      ],
    },
    NamingRule: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        selector: {
          oneOf: [
            { $ref: "#/definitions/Selector" },
            {
              type: "array",
              default: [],
              items: { $ref: "#/definitions/Selector" },
            },
          ],
        },
        filenamePartsToRemove: {
          oneOf: [
            { type: "string", default: "" },
            {
              type: "array",
              default: [],
              items: { type: "string", default: "" },
            },
          ],
        },
        format: {
          oneOf: [
            { type: "string", default: "" },
            { type: "array", default: [], items: { type: "string" } },
          ],
        },
      },
      required: ["selector"],
    },
    NamingRuleObject: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        allowOnlySpecifiedSelectors: { type: "boolean", default: true },
        errors: {
          type: "object",
          default: {},
          additionalProperties: false,
          properties: {
            class: { type: "string", default: "" },
            variable: { type: "string", default: "" },
            function: { type: "string", default: "" },
            arrowFunction: { type: "string", default: "" },
            type: { type: "string", default: "" },
            interface: { type: "string", default: "" },
            enum: { type: "string", default: "" },
          },
        },
        rules: {
          type: "array",
          default: [],
          items: { $ref: "#/definitions/NamingRule" },
        },
      },
      required: ["rules"],
    },
    FileNamingRules: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        filePattern: {
          oneOf: [
            { type: "string", default: "" },
            {
              type: "array",
              default: [],
              items: {
                oneOf: [
                  { type: "string", default: "" },
                  {
                    type: "array",
                    default: [],
                    items: { type: "string" },
                  },
                ],
              },
            },
          ],
        },
        fileRootRules: {
          oneOf: [
            {
              type: "array",
              default: [],
              items: { $ref: "#/definitions/NamingRule" },
            },
            { $ref: "#/definitions/NamingRuleObject" },
          ],
        },
        fileExportsRules: {
          oneOf: [
            {
              type: "array",
              default: [],
              items: { $ref: "#/definitions/NamingRule" },
            },
            { $ref: "#/definitions/NamingRuleObject" },
          ],
        },
        fileRules: {
          oneOf: [
            {
              type: "array",
              default: [],
              items: { $ref: "#/definitions/NamingRule" },
            },
            { $ref: "#/definitions/NamingRuleObject" },
          ],
        },
      },
      required: ["filePattern"],
    },
    RegexParameters: {
      type: "object",
      default: {},
      additionalProperties: {
        type: "string",
        default: "",
      },
    },
  },
  type: "object",
  additionalProperties: false,
  properties: {
    filesRules: {
      type: "array",
      default: [],
      items: { $ref: "#/definitions/FileNamingRules" },
    },
    regexParameters: {
      $ref: "#/definitions/RegexParameters",
    },
  },
  required: ["filesRules"],
};
