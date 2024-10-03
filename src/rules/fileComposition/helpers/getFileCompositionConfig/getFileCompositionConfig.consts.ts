import { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";

export const FILE_COMPOSITION_SCHEMA: JSONSchema4 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    SelectorType: {
      type: "string",
      default: "",
      enum: [
        "class",
        "variable",
        "variableExpression",
        "arrowFunction",
        "function",
        "type",
        "interface",
        "enum",
      ],
    },
    Selector: {
      oneOf: [
        { $ref: "#/definitions/SelectorType" },
        {
          type: "object",
          default: { type: "variableExpression", limitTo: "" },
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
            type: {
              type: "string",
              default: "variableExpression",
              enum: ["variableExpression"],
            },
            limitTo: {
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
          required: ["type", "limitTo"],
        },
      ],
    },
    RootSelectorsLimits: {
      type: "array",
      default: [],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          selector: {
            oneOf: [
              { $ref: "#/definitions/SelectorType" },
              {
                type: "array",
                default: [],
                items: { $ref: "#/definitions/SelectorType" },
              },
            ],
          },
          limit: { type: "number" },
        },
        required: ["limit", "selector"],
      },
    },
    FileRule: {
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
        scope: {
          type: "string",
          default: "file",
          enum: ["file", "fileExport", "fileRoot"],
        },
        positionIndex: { type: "number", default: 0 },
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
    CustomErrors: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        class: { type: "string", default: "" },
        variable: { type: "string", default: "" },
        variableExpression: { type: "string", default: "" },
        function: { type: "string", default: "" },
        arrowFunction: { type: "string", default: "" },
        type: { type: "string", default: "" },
        interface: { type: "string", default: "" },
        enum: { type: "string", default: "" },
      },
    },
    FileRules: {
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
        allowOnlySpecifiedSelectors: {
          oneOf: [
            { type: "boolean", default: true },
            {
              type: "object",
              additionalProperties: false,
              default: {
                errors: {},
                fileRoot: true,
                fileExport: true,
                file: true,
              },
              properties: {
                error: { $ref: "#/definitions/CustomErrors" },
                fileRoot: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" },
                  ],
                },
                fileExport: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" },
                  ],
                },
                file: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" },
                  ],
                },
              },
            },
          ],
        },
        rootSelectorsLimits: { $ref: "#/definitions/RootSelectorsLimits" },
        rules: {
          type: "array",
          default: [],
          items: { $ref: "#/definitions/FileRule" },
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
      items: { $ref: "#/definitions/FileRules" },
    },
    regexParameters: {
      $ref: "#/definitions/RegexParameters",
    },
  },
  required: ["filesRules"],
};