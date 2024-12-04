// src/parser.ts
var parser = {
  meta: { name: "projectStructureParser" },
  parseForESLint: () => ({
    ast: {
      type: "Program",
      start: 0,
      end: 0,
      loc: {
        start: {
          line: 0,
          column: 0
        },
        end: {
          line: 0,
          column: 0
        }
      },
      tokens: [],
      comments: [],
      range: [0, 0],
      sourceType: "module",
      body: []
    },
    scopeManager: null,
    visitorKeys: null
  })
};
var parser_default = parser;
module.exports = parser;

// src/rules/fileComposition/fileComposition.ts
import { ESLintUtils } from "@typescript-eslint/utils";

// src/rules/fileComposition/fileComposition.consts.ts
var ESLINT_ERRORS = {
  invalidName: `\u{1F525} Invalid '{{selectorType}}' name, allowed formats = {{formatWithoutReferences}} \u{1F525}`,
  invalidPosition: `\u{1F525} Invalid '{{selectorType}}' position. It is located in line {{currentLine}} but should be in line {{correctLine}}. \u{1F525}`,
  prohibitedSelectorRoot: `\u{1F525} The use of '{{selectorType}}' is prohibited in the root of the file. \u{1F525}{{error}}`,
  prohibitedSelectorNested: `\u{1F525} The use of nested '{{selectorType}}' is prohibited in this file. \u{1F525}{{error}}`,
  prohibitedSelectorExport: `\u{1F525} Exporting '{{selectorType}}' is prohibited in this file. \u{1F525}{{error}}`,
  rootSelectorsLimits: "\u{1F525} The limit for the given selectors in the root of the file has been exceeded. \u{1F525}\n{{error}}\n\n"
};

// src/rules/fileComposition/helpers/getFileCompositionConfig/getFileCompositionConfig.ts
import path3 from "path";

// src/helpers/getProjectRoot.ts
import path, { dirname, sep } from "path";
var getProjectRoot = (projectRootConfig) => {
  const dirnameSplit = dirname(__filename).split(sep);
  const indexOfNodeModules = dirnameSplit.indexOf("node_modules");
  const rootPath = dirnameSplit.slice(0, indexOfNodeModules).join(sep);
  if (!projectRootConfig) return rootPath;
  return path.resolve(rootPath, projectRootConfig);
};

// src/helpers/isCorrectPattern.ts
import micromatch from "micromatch";
var isCorrectPattern = ({
  input,
  pattern
}) => {
  if (typeof pattern === "string") return micromatch.every(input, pattern);
  return pattern.some((p) => micromatch.every(input, p));
};

// src/helpers/readConfigFile/readConfigFile.ts
import { readFileSync } from "fs";
import { parse } from "comment-json";
import { load } from "js-yaml";

// src/errors/getInvalidConfigFileError.ts
var getInvalidConfigFileError = (configPath) => new Error(
  `\u{1F525} '${configPath}' file cannot be read or has an incorrect extension. \u{1F525}`
);

// src/helpers/readConfigFile/helpers/getConfigPath.ts
import path2 from "path";

// src/errors/getMissingConfigFileError.ts
var getMissingConfigFileError = (key) => new Error(`\u{1F525} Missing configuration file '${key}'. \u{1F525}`);

// src/helpers/readConfigFile/helpers/getConfigPath.ts
var getConfigPath = ({
  settings,
  key
}) => {
  const configPath = settings[key];
  if (!configPath) throw getMissingConfigFileError(key);
  return path2.resolve(getProjectRoot(), configPath);
};

// src/helpers/readConfigFile/readConfigFile.ts
var readConfigFile = ({
  key,
  settings,
  options
}) => {
  if (options) return options;
  const configPath = getConfigPath({
    key,
    settings
  });
  let config = void 0;
  if (configPath.endsWith("json") || configPath.endsWith("jsonc")) {
    config = parse(readFileSync(configPath, "utf-8"));
  } else {
    config = load(readFileSync(configPath, "utf8"));
  }
  if (!config) throw getInvalidConfigFileError(configPath);
  return config;
};

// src/helpers/validateConfig.ts
import { validate } from "jsonschema";

// src/errors/getInvalidConfigError.ts
var getInvalidConfigError = (errors) => new Error(
  errors.reduce(
    (acc, stack) => acc + `\u{1F525} ${stack.replace("instance", "configuration")}.
`,
    "\u{1F525} Invalid configuration file:\n"
  )
);

// src/helpers/validateConfig.ts
var validateConfig = ({
  config,
  schema
}) => {
  const errors = validate(config, schema, {
    nestedErrors: true
  }).errors.filter(({ stack }) => !stack.includes("$schema"));
  if (!errors.length) return;
  throw getInvalidConfigError(errors.map(({ stack }) => stack));
};

// src/rules/fileComposition/helpers/getFileCompositionConfig/getFileCompositionConfig.consts.ts
var FILE_COMPOSITION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    SelectorType: {
      type: "string",
      default: "",
      enum: [
        "class",
        "variable",
        "variableExpression",
        "propertyDefinition",
        "arrowFunction",
        "function",
        "type",
        "interface",
        "enum"
      ]
    },
    Selector: {
      oneOf: [
        { $ref: "#/definitions/SelectorType" },
        {
          type: "object",
          default: { type: "variableExpression", limitTo: "" },
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              default: "variableExpression",
              enum: ["variableExpression"]
            },
            limitTo: {
              oneOf: [
                { type: "string", default: "" },
                {
                  type: "array",
                  default: [],
                  items: { type: "string" }
                }
              ]
            }
          },
          required: ["type", "limitTo"]
        }
      ]
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
                items: { $ref: "#/definitions/SelectorType" }
              }
            ]
          },
          limit: { type: "number" }
        },
        required: ["limit", "selector"]
      }
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
              items: { $ref: "#/definitions/Selector" }
            }
          ]
        },
        scope: {
          oneOf: [
            {
              type: "string",
              default: "file",
              enum: ["file", "fileExport", "fileRoot", "nestedSelectors"]
            },
            {
              type: "array",
              default: [],
              items: {
                type: "string",
                default: "file",
                enum: ["file", "fileExport", "fileRoot"]
              }
            }
          ]
        },
        positionIndex: {
          oneOf: [
            { type: "number", default: 0 },
            {
              type: "object",
              default: { index: 0, sorting: "az" },
              properties: {
                index: { type: "number", default: 0 },
                sorting: {
                  type: "string",
                  default: "az",
                  enum: ["az", "none"]
                }
              },
              required: ["index"]
            }
          ]
        },
        filenamePartsToRemove: {
          oneOf: [
            { type: "string", default: "" },
            {
              type: "array",
              default: [],
              items: { type: "string", default: "" }
            }
          ]
        },
        format: {
          oneOf: [
            { type: "string", default: "" },
            { type: "array", default: [], items: { type: "string" } }
          ]
        }
      },
      required: ["selector"]
    },
    CustomErrors: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        class: { type: "string", default: "" },
        variable: { type: "string", default: "" },
        variableExpression: { type: "string", default: "" },
        propertyDefinition: { type: "string", default: "" },
        function: { type: "string", default: "" },
        arrowFunction: { type: "string", default: "" },
        type: { type: "string", default: "" },
        interface: { type: "string", default: "" },
        enum: { type: "string", default: "" }
      }
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
                    items: { type: "string" }
                  }
                ]
              }
            }
          ]
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
                file: true
              },
              properties: {
                error: { $ref: "#/definitions/CustomErrors" },
                fileRoot: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" }
                  ]
                },
                fileExport: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" }
                  ]
                },
                nestedSelectors: {
                  oneOf: [
                    { type: "boolean", default: true },
                    { $ref: "#/definitions/CustomErrors" }
                  ]
                }
              }
            }
          ]
        },
        rootSelectorsLimits: { $ref: "#/definitions/RootSelectorsLimits" },
        rules: {
          type: "array",
          default: [],
          items: { $ref: "#/definitions/FileRule" }
        }
      },
      required: ["filePattern"]
    },
    RegexParameters: {
      type: "object",
      default: {},
      additionalProperties: {
        type: "string",
        default: ""
      }
    }
  },
  type: "object",
  additionalProperties: false,
  properties: {
    projectRoot: {
      type: "string",
      default: "."
    },
    filesRules: {
      type: "array",
      default: [],
      items: { $ref: "#/definitions/FileRules" }
    },
    regexParameters: {
      $ref: "#/definitions/RegexParameters"
    }
  },
  required: ["filesRules"]
};

// src/rules/fileComposition/helpers/getFileCompositionConfig/getFileCompositionConfig.ts
var getFileCompositionConfig = ({
  filename,
  settings,
  options
}) => {
  const config = readConfigFile({
    key: "project-structure/file-composition-config-path",
    settings,
    options: options[0]
  });
  validateConfig({ config, schema: FILE_COMPOSITION_SCHEMA });
  const filenamePath = path3.relative(
    getProjectRoot(config.projectRoot),
    filename
  );
  const fileConfig = config.filesRules.find(
    ({ filePattern }) => isCorrectPattern({ input: filenamePath, pattern: filePattern })
  );
  return { config, fileConfig };
};

// src/rules/fileComposition/helpers/validateFile/validateFile.ts
import path5 from "path";

// src/rules/fileComposition/helpers/validateFile/helpers/getCurrentScopeData.ts
var getCurrentScopeData = ({
  isFileExport,
  isFileRoot
}) => {
  if (isFileExport)
    return {
      scope: "fileExport",
      errorMessageId: "prohibitedSelectorExport"
    };
  if (isFileRoot)
    return {
      scope: "fileRoot",
      errorMessageId: "prohibitedSelectorRoot"
    };
  return {
    scope: "nestedSelectors",
    errorMessageId: "prohibitedSelectorNested"
  };
};

// src/rules/fileComposition/helpers/validateFile/helpers/isCorrectScope.ts
var isCorrectScope = ({
  expect,
  scope
}) => {
  if (scope === "file" || !scope) return true;
  if (typeof scope === "string") return scope === expect;
  return scope.some((s) => s === expect || s === "file");
};

// src/rules/fileComposition/helpers/validateFile/helpers/isExportedName/isExportedName.ts
import { TSESTree as TSESTree4 } from "@typescript-eslint/utils";

// src/rules/fileComposition/helpers/validateFile/helpers/isExportedName/helpers/isExportDefault.ts
import { TSESTree as TSESTree2 } from "@typescript-eslint/utils";

// src/rules/fileComposition/helpers/validateFile/helpers/getProgramFromNode.ts
import { TSESTree } from "@typescript-eslint/utils";
var getProgramFromNode = (node) => {
  if (node.type !== TSESTree.AST_NODE_TYPES.Program)
    return getProgramFromNode(node.parent);
  return node;
};

// src/rules/fileComposition/helpers/validateFile/helpers/isExportedName/helpers/isExportDefault.ts
var isExportDefault = ({
  name,
  node
}) => {
  let currentNode = node;
  let currentName = name;
  let isExportDefault2 = false;
  getProgramFromNode(node).body.forEach((node2) => {
    if (node2.type !== TSESTree2.AST_NODE_TYPES.ExportDefaultDeclaration) return;
    if (node2.declaration.type === TSESTree2.AST_NODE_TYPES.Identifier && node2.declaration.name === name) {
      isExportDefault2 = true;
      currentNode = node2.declaration;
      return;
    }
    if (node2.declaration.type === TSESTree2.AST_NODE_TYPES.ObjectExpression) {
      node2.declaration.properties.forEach((property) => {
        if (property.type !== TSESTree2.AST_NODE_TYPES.Property) return;
        if (property.key.type === TSESTree2.AST_NODE_TYPES.Identifier && property.value.type === TSESTree2.AST_NODE_TYPES.Identifier && property.value.name === name) {
          isExportDefault2 = true;
          currentNode = property.key;
          currentName = property.key.name;
          return;
        }
      });
    }
    if (node2.declaration.type === TSESTree2.AST_NODE_TYPES.ArrayExpression) {
      node2.declaration.elements.forEach((element) => {
        if (!element) return;
        if (element.type === TSESTree2.AST_NODE_TYPES.Identifier && element.name === name) {
          isExportDefault2 = true;
          currentNode = element;
          return;
        }
      });
    }
  });
  return {
    isExportDefault: isExportDefault2,
    currentNode,
    currentName
  };
};

// src/rules/fileComposition/helpers/validateFile/helpers/isExportedName/helpers/isNamedExport.ts
import { TSESTree as TSESTree3 } from "@typescript-eslint/utils";
var isNamedExport = ({
  name,
  node
}) => {
  let isNamedExport2 = false;
  let currentNode = node;
  let currentName = name;
  getProgramFromNode(node).body.forEach((node2) => {
    if (node2.type !== TSESTree3.AST_NODE_TYPES.ExportNamedDeclaration) return;
    node2.specifiers.forEach((specifier) => {
      if (specifier.local.type !== TSESTree3.AST_NODE_TYPES.Identifier || specifier.exported.type !== TSESTree3.AST_NODE_TYPES.Identifier)
        return;
      if (specifier.local.name === name && specifier.exported.name !== name) {
        isNamedExport2 = true;
        currentName = specifier.exported.name;
        currentNode = specifier.exported;
        return;
      }
      if (specifier.local.name === name && specifier.exported.name === name) {
        isNamedExport2 = true;
        currentNode = specifier.local;
        return;
      }
    });
  });
  return {
    isNamedExport: isNamedExport2,
    currentName,
    currentNode
  };
};

// src/rules/fileComposition/helpers/validateFile/helpers/isExportedName/isExportedName.ts
var isExportedName = ({
  nodeType,
  node,
  name
}) => {
  if ((nodeType === "ArrowFunctionExpression" || nodeType === "Expression" || nodeType === "VariableDeclarator") && node.parent.parent?.type === TSESTree4.AST_NODE_TYPES.ExportNamedDeclaration || node.parent.parent?.type === TSESTree4.AST_NODE_TYPES.ExportDefaultDeclaration)
    return {
      isExportName: true,
      currentNode: node,
      currentName: name
    };
  if (node.parent.type === TSESTree4.AST_NODE_TYPES.ExportNamedDeclaration || node.parent.type === TSESTree4.AST_NODE_TYPES.ExportDefaultDeclaration)
    return {
      isExportName: true,
      currentNode: node,
      currentName: name
    };
  const namedExport = isNamedExport({ name, node });
  const exportDefault = isExportDefault({ name, node });
  if (namedExport.isNamedExport)
    return {
      isExportName: true,
      currentNode: namedExport.currentNode,
      currentName: namedExport.currentName
    };
  if (exportDefault.isExportDefault)
    return {
      isExportName: true,
      currentNode: exportDefault.currentNode,
      currentName: exportDefault.currentName
    };
  return {
    isExportName: false,
    currentName: name,
    currentNode: node
  };
};

// src/rules/fileComposition/helpers/validateFile/helpers/isNameFromFileRoot.ts
import { TSESTree as TSESTree5 } from "@typescript-eslint/utils";
var isNameFromFileRoot = ({
  nodeType,
  node
}) => {
  if (nodeType === "ArrowFunctionExpression" || nodeType === "VariableDeclarator" || nodeType === "Expression")
    return node.parent.parent?.type === TSESTree5.AST_NODE_TYPES.Program || node.parent.parent?.type === TSESTree5.AST_NODE_TYPES.ExportNamedDeclaration || node.parent.parent?.type === TSESTree5.AST_NODE_TYPES.ExportDefaultDeclaration || node.parent.type === TSESTree5.AST_NODE_TYPES.Program;
  return node.parent.type === TSESTree5.AST_NODE_TYPES.Program || node.parent.type === TSESTree5.AST_NODE_TYPES.ExportNamedDeclaration || node.parent.type === TSESTree5.AST_NODE_TYPES.ExportDefaultDeclaration;
};

// src/consts.ts
var SNAKE_CASE_LOWER_RE = /((([a-z]|\d)+_)*([a-z]|\d)+)/;
var SNAKE_CASE_UPPER_RE = /((([A-Z]|\d)+_)*([A-Z]|\d)+)/;
var KEBAB_CASE_RE = /((([a-z]|\d)+-)*([a-z]|\d)+)/;
var CAMEL_CASE_RE = /([a-z]+[A-Z0-9]*[A-Z0-9]*)*/;
var PASCAL_CASE_RE = /([A-Z]+[a-z0-9]*[A-Z0-9]*)*/;
var STRICT_CAMEL_CASE_RE = /[a-z][a-z0-9]*(([A-Z][a-z0-9]+)*[A-Z]?|([a-z0-9]+[A-Z])*|[A-Z])/;
var STRICT_PASCAL_CASE_RE = /[A-Z](([a-z0-9]+[A-Z]?)*)/;
var SNAKE_CASE_LOWER = `${SNAKE_CASE_LOWER_RE}`.replace(/\//g, "");
var SNAKE_CASE_UPPER = `${SNAKE_CASE_UPPER_RE}`.replace(/\//g, "");
var KEBAB_CASE = `${KEBAB_CASE_RE}`.replace(/\//g, "");
var CAMEL_CASE = `${CAMEL_CASE_RE}`.replace(/\//g, "");
var PASCAL_CASE = `${PASCAL_CASE_RE}`.replace(/\//g, "");
var STRICT_CAMEL_CASE = `${STRICT_CAMEL_CASE_RE}`.replace(/\//g, "");
var STRICT_PASCAL_CASE = `${STRICT_PASCAL_CASE_RE}`.replace(/\//g, "");
var RECURSION_LIMIT = 1e3;
var WILDCARD_REGEX = "(([^/]*)+)";
var ESLINT_ERRORS2 = {
  error: `{{error}}`
};
var PROJECT_STRUCTURE_CACHE_FILE_NAME = "projectStructure.cache.json";

// src/errors/getInvalidRegexError.ts
var getInvalidRegexError = (regex) => new Error(`\u{1F525} Regex: ${regex} is invalid. \u{1F525}`);

// src/helpers/isRegexInvalid.ts
var isRegexInvalid = (regex) => {
  try {
    new RegExp(`^${regex}$`, "g");
  } catch (_e) {
    return true;
  }
  return false;
};

// src/rules/fileComposition/helpers/validateFile/helpers/isCorrectSelector.ts
var isCorrectSelector = ({
  selector,
  selectorType,
  expressionName
}) => {
  if (typeof selector === "string") return selector === selectorType;
  if (!Array.isArray(selector)) {
    if (!expressionName) return false;
    if (typeof selector.limitTo === "string") {
      const regexImproved = selector.limitTo.replaceAll("*", WILDCARD_REGEX).replaceAll(`${WILDCARD_REGEX}${WILDCARD_REGEX}`, "*");
      if (isRegexInvalid(regexImproved))
        throw getInvalidRegexError(regexImproved);
      const finalRegex = new RegExp(`^${regexImproved}$`, "g");
      return selector.type === selectorType && finalRegex.test(expressionName);
    }
    return selector.limitTo.some(
      (limitTo) => isCorrectSelector({
        selector: { type: "variableExpression", limitTo },
        selectorType,
        expressionName
      })
    );
  }
  return selector.some(
    (sel) => isCorrectSelector({ selector: sel, selectorType, expressionName })
  );
};

// src/rules/fileComposition/helpers/validateFile/helpers/isSelectorAllowed/helpers/getCustomError.ts
var getCustomError = ({
  selectorType,
  allowOnlySpecifiedSelectors,
  scope
}) => {
  if (allowOnlySpecifiedSelectors === true) return "";
  if (typeof allowOnlySpecifiedSelectors[scope] === "object") {
    const scopeErrors = {
      ...allowOnlySpecifiedSelectors.error,
      ...allowOnlySpecifiedSelectors[scope]
    };
    if (!scopeErrors[selectorType]) return "";
    return `

${scopeErrors[selectorType]}

`;
  }
  if (allowOnlySpecifiedSelectors.error?.[selectorType])
    return `

${allowOnlySpecifiedSelectors.error[selectorType]}

`;
  return "";
};

// src/rules/fileComposition/helpers/validateFile/helpers/isSelectorAllowed/isSelectorAllowed.ts
var isSelectorAllowed = ({
  rules,
  report,
  node,
  errorMessageId,
  selectorType,
  expressionName,
  scope,
  allowOnlySpecifiedSelectors
}) => {
  const isAllowed = rules.map(({ selector }) => selector).flat().some(
    (selector) => isCorrectSelector({ selector, selectorType, expressionName })
  );
  if (isAllowed || !allowOnlySpecifiedSelectors || typeof allowOnlySpecifiedSelectors === "object" && allowOnlySpecifiedSelectors[scope] === false)
    return true;
  report({
    messageId: errorMessageId,
    data: {
      selectorType,
      error: getCustomError({
        selectorType,
        scope,
        allowOnlySpecifiedSelectors
      })
    },
    node
  });
  return false;
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/getFilenameWithoutParts/helpers/getFileNameWithoutExtension.ts
import path4 from "path";
var getFileNameWithoutExtension = (filenamePath) => {
  const fileNameWithExtension = path4.basename(filenamePath);
  return fileNameWithExtension.substring(
    0,
    fileNameWithExtension.lastIndexOf(".")
  );
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/getFilenameWithoutParts/helpers/removeFilenameParts.ts
var removeFilenameParts = ({
  filenameWithoutExtension,
  filenamePartsToRemove
}) => {
  if (!filenamePartsToRemove) return filenameWithoutExtension;
  const currentFilenamePartsToRemove = typeof filenamePartsToRemove === "string" ? [filenamePartsToRemove] : filenamePartsToRemove;
  return currentFilenamePartsToRemove.reduce(
    (acc, removePart) => acc.replaceAll(removePart, ""),
    filenameWithoutExtension
  );
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/getFilenameWithoutParts/getFilenameWithoutParts.ts
var getFilenameWithoutParts = ({
  filenamePartsToRemove,
  filenamePath
}) => {
  const filenameWithoutExtension = getFileNameWithoutExtension(filenamePath);
  return removeFilenameParts({
    filenameWithoutExtension,
    filenamePartsToRemove
  });
};

// src/helpers/getUpperCaseFirstLetter.ts
var getUpperCaseFirstLetter = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// src/helpers/transformStringToCase.ts
var transformStringToCase = ({
  str,
  transformTo
}) => {
  const toCamelCase = (input) => {
    if (input === input.toUpperCase()) {
      return input.toLowerCase().replace(/(_[a-z])/g, (_, char) => char.toUpperCase()).replace(/^[A-Z]/, (char) => char.toLowerCase()).replace(/_/g, "");
    }
    return input.replace(
      /([-_][a-z])/gi,
      (match) => match.toUpperCase().replace(/[-_]/g, "")
    ).replace(/^([A-Z])/, (char) => char.toLowerCase()).replace(/_/g, "");
  };
  const toSnakeCaseLower = (input) => input.replace(/([a-z])([A-Z])/g, "$1_$2").replace(/([A-Za-z])(\d)/g, "$1_$2").replace(/(\d)([A-Za-z])/g, "$1_$2").replace(/[-\s]/g, "_").replace(/_+/g, "_").toLowerCase();
  const toKebabCase = (input) => input.replace(
    /([a-z\d])([A-Z]+)/g,
    (_match, p1, p2) => p1 + "-" + p2.toLowerCase()
  ).replace(
    /([A-Z]+)([A-Z][a-z])/g,
    (_match, p1, p2) => `${p1.toLowerCase()}-${p2}`
  ).replace(
    /(\d)([a-zA-Z])/g,
    (_match, p1, p2) => `${p1}-${p2.toLowerCase()}`
  ).replace(
    /([a-zA-Z])(\d)/g,
    (_match, p1, p2) => `${p1}-${p2}`
  ).replace(/[_\s]+/g, "-").toLowerCase();
  let result;
  switch (transformTo) {
    case "PascalCase":
      result = getUpperCaseFirstLetter(toCamelCase(str));
      break;
    case "kebab-case":
      result = toKebabCase(str);
      break;
    case "snake_case":
      result = toSnakeCaseLower(str);
      break;
    case "SNAKE_CASE":
      result = toSnakeCaseLower(str).toUpperCase();
      break;
    default:
      result = toCamelCase(str);
      break;
  }
  return result;
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/validateRules.consts.ts
var REFERENCES = {
  FileName: "{FileName}",
  fileName: "{fileName}",
  file_name: "{file_name}",
  FILE_NAME: "{FILE_NAME}",
  camelCase: "{camelCase}",
  PascalCase: "{PascalCase}",
  strictCamelCase: "{strictCamelCase}",
  StrictPascalCase: "{StrictPascalCase}",
  snake_case: "{snake_case}",
  SNAKE_CASE: "{SNAKE_CASE}"
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/getFormatWithFilenameReferences.ts
var getFormatWithFilenameReferences = ({
  filename,
  formatWithReferences
}) => formatWithReferences.map(
  (pattern) => pattern.replaceAll(
    REFERENCES.fileName,
    transformStringToCase({
      str: filename,
      transformTo: "camelCase"
    })
  ).replaceAll(
    REFERENCES.FileName,
    transformStringToCase({
      str: filename,
      transformTo: "PascalCase"
    })
  ).replaceAll(
    REFERENCES.file_name,
    transformStringToCase({
      str: filename,
      transformTo: "snake_case"
    })
  ).replaceAll(
    REFERENCES.FILE_NAME,
    transformStringToCase({
      str: filename,
      transformTo: "SNAKE_CASE"
    })
  )
);

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/getBodyWithoutImports.ts
import { TSESTree as TSESTree6 } from "@typescript-eslint/utils";
var getBodyWithoutImports = (node) => {
  const program = getProgramFromNode(node);
  return program.body.filter(
    ({ type }) => type !== TSESTree6.AST_NODE_TYPES.ImportDeclaration
  );
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/getSelectorNamesFromBody.ts
import { TSESTree as TSESTree8 } from "@typescript-eslint/utils";

// src/rules/fileComposition/helpers/getIdentifierFromExpression.ts
import { TSESTree as TSESTree7 } from "@typescript-eslint/utils";
var getIdentifierFromExpression = (expression) => {
  if (!expression) return;
  if (expression.type === TSESTree7.AST_NODE_TYPES.CallExpression && expression.callee.type === TSESTree7.AST_NODE_TYPES.Identifier)
    return expression.callee.name;
  if (expression.type === TSESTree7.AST_NODE_TYPES.MemberExpression && expression.object.type === TSESTree7.AST_NODE_TYPES.Identifier)
    return expression.object.name;
  if (expression.type === TSESTree7.AST_NODE_TYPES.TaggedTemplateExpression && expression.tag.type === TSESTree7.AST_NODE_TYPES.Identifier)
    return expression.tag.name;
  if (expression.type === TSESTree7.AST_NODE_TYPES.TaggedTemplateExpression && (expression.tag.type === TSESTree7.AST_NODE_TYPES.MemberExpression || expression.tag.type === TSESTree7.AST_NODE_TYPES.CallExpression))
    return getIdentifierFromExpression(expression.tag);
  if (expression.type === TSESTree7.AST_NODE_TYPES.TSAsExpression && (expression.expression.type === TSESTree7.AST_NODE_TYPES.CallExpression || expression.expression.type === TSESTree7.AST_NODE_TYPES.TaggedTemplateExpression))
    return getIdentifierFromExpression(expression.expression);
  if (expression.type === TSESTree7.AST_NODE_TYPES.CallExpression && (expression.callee.type === TSESTree7.AST_NODE_TYPES.CallExpression || expression.callee.type === TSESTree7.AST_NODE_TYPES.MemberExpression))
    return getIdentifierFromExpression(expression.callee);
  if (expression.type === TSESTree7.AST_NODE_TYPES.MemberExpression && expression.object.type === TSESTree7.AST_NODE_TYPES.MemberExpression)
    return getIdentifierFromExpression(expression.object);
  return;
};

// src/rules/fileComposition/helpers/validateFile/validateFile.consts.ts
var SELECTORS = {
  VariableDeclarator: "variable",
  Expression: "variableExpression",
  ClassDeclaration: "class",
  FunctionDeclaration: "function",
  ArrowFunctionExpression: "arrowFunction",
  TSEnumDeclaration: "enum",
  TSInterfaceDeclaration: "interface",
  TSTypeAliasDeclaration: "type",
  PropertyDefinition: "propertyDefinition"
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/getSelectorNamesFromBody.ts
var getSelectorNamesFromBody = (body) => body.map((node) => {
  const currentNode = node.type === TSESTree8.AST_NODE_TYPES.ExportDefaultDeclaration || node.type === TSESTree8.AST_NODE_TYPES.ExportNamedDeclaration ? node.declaration : node;
  if (currentNode?.type === TSESTree8.AST_NODE_TYPES.VariableDeclaration && currentNode.declarations[0].id.type === TSESTree8.AST_NODE_TYPES.Identifier) {
    const expressionName = getIdentifierFromExpression(
      currentNode.declarations[0].init
    );
    if (expressionName) {
      return {
        selector: "variableExpression",
        name: currentNode.declarations[0].id.name,
        expressionName,
        range: JSON.stringify(currentNode.declarations[0].range)
      };
    }
    return {
      selector: currentNode.declarations[0].init?.type === TSESTree8.AST_NODE_TYPES.ArrowFunctionExpression ? "arrowFunction" : "variable",
      name: currentNode.declarations[0].id.name,
      range: JSON.stringify(currentNode.declarations[0].range)
    };
  }
  if ((currentNode?.type === TSESTree8.AST_NODE_TYPES.FunctionDeclaration || currentNode?.type === TSESTree8.AST_NODE_TYPES.ClassDeclaration || currentNode?.type === TSESTree8.AST_NODE_TYPES.TSInterfaceDeclaration || currentNode?.type === TSESTree8.AST_NODE_TYPES.TSTypeAliasDeclaration || currentNode?.type === TSESTree8.AST_NODE_TYPES.TSEnumDeclaration) && currentNode.id?.name) {
    const selector = SELECTORS[currentNode.type];
    return {
      selector,
      name: currentNode.id.name,
      range: JSON.stringify(currentNode.range)
    };
  }
  return void 0;
}).filter((v) => v !== void 0);

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/isNameValid.ts
var isNameValid = ({
  formatWithoutReferences,
  name
}) => Boolean(
  formatWithoutReferences.some((pattern) => {
    if (isRegexInvalid(pattern)) throw getInvalidRegexError(pattern);
    const regexp = new RegExp(`^${pattern}$`, "g");
    return regexp.test(name);
  })
);

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/getPositionIndex.ts
var getPositionIndex = ({
  positionIndexRules,
  bodyWithoutImports,
  nodeRange,
  positionIndex
}) => {
  const selectorNamesFromBody = getSelectorNamesFromBody(bodyWithoutImports);
  const positionIndexRulesBody = selectorNamesFromBody.sort((a, b) => {
    if (typeof positionIndex === "object" && positionIndex.sorting === "none")
      return 0;
    return a.name.localeCompare(b.name, void 0, {
      numeric: true,
      sensitivity: "base"
    });
  }).map((body) => {
    const rule = positionIndexRules.find(
      ({ format, selector }) => isCorrectSelector({
        selector,
        selectorType: body.selector,
        expressionName: body.expressionName
      }) && isNameValid({ formatWithoutReferences: format, name: body.name })
    );
    if (!rule) return;
    return {
      ...rule,
      range: body.range,
      expressionName: body.expressionName
    };
  }).filter((v) => v !== void 0).sort((a, b) => {
    if (a.positionIndex < 0 && b.positionIndex >= 0) return 1;
    if (a.positionIndex >= 0 && b.positionIndex < 0) return -1;
    return a.positionIndex - b.positionIndex;
  });
  const positionIndexRulesNewOrderPositive = positionIndexRulesBody.filter(({ positionIndex: positionIndex2 }) => positionIndex2 >= 0).map((rule, index) => ({
    ...rule,
    positionIndex: index
  }));
  const positionIndexRulesNewOrderNegative = positionIndexRulesBody.filter(({ positionIndex: positionIndex2 }) => positionIndex2 < 0).reverse().map((rule, index) => ({
    ...rule,
    positionIndex: selectorNamesFromBody.length - 1 - index
  }));
  const positionIndexRulesNewOrder = [
    ...positionIndexRulesNewOrderPositive,
    ...positionIndexRulesNewOrderNegative
  ];
  const newPositionIndex = positionIndexRulesNewOrder.find(
    ({ range }) => range === nodeRange
  )?.positionIndex;
  return newPositionIndex ?? 0;
};

// src/errors/getInvalidReferenceError.ts
var getInvalidReferenceError = ({
  invalidReferences,
  allowedReferences,
  key
}) => new Error(
  `\u{1F525} Reference ${invalidReferences.join(", ")} in '${key}' do not exist. \u{1F525}

Allowed references = ${allowedReferences.join(", ")}.

`
);

// src/helpers/getRegexWithoutReferences/helpers/validateReferences/helpers/extractReferencesFromRegex.ts
var extractReferencesFromRegex = ({
  filterReferences,
  regex
}) => regex.match(/\{([^}]+)\}/g)?.map((match) => match.slice(1, -1)).filter((p) => !filterReferences?.test(p)) ?? [];

// src/helpers/getRegexWithoutReferences/helpers/validateReferences/validateReferences.ts
var validateReferences = ({
  allowedReferences,
  regex,
  filterReferences,
  key
}) => {
  const references = extractReferencesFromRegex({
    regex,
    filterReferences
  });
  const invalidReferences = references.filter((reference) => !allowedReferences.includes(reference)).map((ref) => `{${ref}}`);
  if (!invalidReferences.length) return;
  throw getInvalidReferenceError({ invalidReferences, allowedReferences, key });
};

// src/helpers/getRegexWithoutReferences/getRegexWithoutReferences.ts
var getRegexWithoutReferences = ({
  regex,
  regexParameters,
  key
}) => {
  let currentRegex = regex;
  const regexParametersKeys = Object.keys(regexParameters);
  validateReferences({
    regex,
    allowedReferences: regexParametersKeys,
    key
  });
  regexParametersKeys.forEach(
    (key2) => currentRegex = currentRegex.replaceAll(
      `{${key2}}`,
      regexParameters[key2]
    )
  );
  return currentRegex;
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/prepareFormat/helpers/getDefaultRegexParameters.ts
var getDefaultRegexParameters = ({
  fileName,
  regexParameters = {}
}) => ({
  camelCase: CAMEL_CASE,
  PascalCase: PASCAL_CASE,
  strictCamelCase: STRICT_CAMEL_CASE,
  StrictPascalCase: STRICT_PASCAL_CASE,
  snake_case: SNAKE_CASE_LOWER,
  SNAKE_CASE: SNAKE_CASE_UPPER,
  ...regexParameters,
  fileName: transformStringToCase({
    str: fileName,
    transformTo: "camelCase"
  }),
  FileName: transformStringToCase({
    str: fileName,
    transformTo: "PascalCase"
  }),
  file_name: transformStringToCase({
    str: fileName,
    transformTo: "snake_case"
  }),
  FILE_NAME: transformStringToCase({
    str: fileName,
    transformTo: "SNAKE_CASE"
  })
});

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/prepareFormat/prepareFormat.consts.ts
var DEFAULT_FORMAT = [REFERENCES.camelCase];

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/prepareFormat/prepareFormat.ts
var prepareFormat = ({
  format,
  filenameWithoutParts,
  regexParameters
}) => {
  let currentFormat = [];
  if (!format) currentFormat = DEFAULT_FORMAT;
  if (typeof format === "string") currentFormat = [format];
  if (Array.isArray(format)) currentFormat = format;
  const defaultRegexParameters = getDefaultRegexParameters({
    fileName: filenameWithoutParts,
    regexParameters
  });
  const formatWithoutReferences = currentFormat.map(
    (regex) => getRegexWithoutReferences({
      regex: regex.replaceAll("*", WILDCARD_REGEX).replaceAll(`${WILDCARD_REGEX}${WILDCARD_REGEX}`, "*"),
      regexParameters: defaultRegexParameters,
      key: "format"
    })
  );
  return {
    formatWithoutReferences,
    formatWithReferences: currentFormat
  };
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/getPositionIndexRules.ts
var getPositionIndexRules = ({
  rules,
  regexParameters,
  filenamePath
}) => rules.map(({ format, selector, filenamePartsToRemove, positionIndex }) => {
  if (positionIndex === void 0) return;
  const filenameWithoutParts = getFilenameWithoutParts({
    filenamePartsToRemove,
    filenamePath
  });
  return {
    positionIndex: typeof positionIndex === "number" ? positionIndex : positionIndex.index,
    selector,
    format: prepareFormat({
      format,
      filenameWithoutParts,
      regexParameters
    }).formatWithoutReferences
  };
}).filter((v) => v !== void 0);

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/validatePositionIndex/helpers/getNodePosition.ts
var getNodePosition = ({
  bodyWithoutImports,
  node
}) => bodyWithoutImports.findIndex(
  (bodyNode) => bodyNode.range[0] === node.range[0] && bodyNode.range[1] === node.range[1] || bodyNode.range[0] === node.parent.range[0] && bodyNode.range[1] === node.parent.range[1] || bodyNode.range[0] === node.parent.parent?.range[0] && bodyNode.range[1] === node.parent.parent.range[1]
);

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/helpers/validatePositionIndex/validatePositionIndex.ts
var validatePositionIndex = ({
  node,
  selectorType,
  context: { report, sourceCode },
  positionIndex,
  bodyWithoutImports
}) => {
  const nodePosition = getNodePosition({ bodyWithoutImports, node });
  if (nodePosition === positionIndex) return;
  const nodeToReplace = bodyWithoutImports[positionIndex];
  const currentNodePosition = bodyWithoutImports[nodePosition];
  report({
    messageId: "invalidPosition",
    node,
    data: {
      selectorType,
      currentLine: currentNodePosition.loc.start.line,
      correctLine: nodeToReplace.loc.start.line
    },
    fix: (fixer) => [
      fixer.replaceText(nodeToReplace, sourceCode.getText(currentNodePosition)),
      fixer.replaceText(currentNodePosition, sourceCode.getText(nodeToReplace))
    ]
  });
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/helpers/handlePositionIndex/handlePositionIndex.ts
var handlePositionIndex = ({
  filenamePath,
  node,
  rules,
  regexParameters,
  context,
  selectorType,
  positionIndex
}) => {
  const positionIndexRules = getPositionIndexRules({
    filenamePath,
    rules,
    regexParameters
  });
  const bodyWithoutImports = getBodyWithoutImports(node);
  const newPositionIndex = getPositionIndex({
    bodyWithoutImports,
    positionIndexRules,
    nodeRange: JSON.stringify(node.range),
    positionIndex
  });
  validatePositionIndex({
    node,
    positionIndex: newPositionIndex,
    selectorType,
    context,
    bodyWithoutImports
  });
};

// src/rules/fileComposition/helpers/validateFile/helpers/validateRules/validateRules.ts
var validateRules = ({
  name,
  node,
  filenamePath,
  rules,
  errorMessageId,
  regexParameters,
  expressionName,
  allowOnlySpecifiedSelectors,
  scope,
  nodeNotExported,
  context,
  context: { report },
  allRules,
  selectorType
}) => {
  if (!isSelectorAllowed({
    rules,
    scope,
    allowOnlySpecifiedSelectors,
    node,
    selectorType,
    report,
    errorMessageId,
    expressionName
  }) || name === "*")
    return;
  const selectorTypeRules = rules.filter(
    ({ selector }) => isCorrectSelector({
      selectorType,
      selector,
      expressionName
    })
  );
  const formatWithoutReferences = selectorTypeRules.map(({ format, filenamePartsToRemove, positionIndex }) => {
    const filenameWithoutParts = getFilenameWithoutParts({
      filenamePartsToRemove,
      filenamePath
    });
    const { formatWithReferences, formatWithoutReferences: formatWithoutReferences2 } = prepareFormat({
      format,
      filenameWithoutParts,
      regexParameters
    });
    const isValid = isNameValid({
      formatWithoutReferences: formatWithoutReferences2,
      name
    });
    if (isValid) {
      if (positionIndex === void 0 || scope === "nestedSelectors") return;
      return handlePositionIndex({
        context,
        filenamePath,
        node: nodeNotExported ?? node,
        rules: allRules,
        selectorType,
        regexParameters,
        positionIndex
      });
    }
    return getFormatWithFilenameReferences({
      formatWithReferences,
      filename: filenameWithoutParts
    });
  }).filter((v) => v !== void 0);
  if (!formatWithoutReferences.length || formatWithoutReferences.length !== selectorTypeRules.length)
    return;
  report({
    node,
    messageId: "invalidName",
    data: {
      selectorType,
      formatWithoutReferences: formatWithoutReferences.flat().join(", ")
    }
  });
};

// src/rules/fileComposition/helpers/validateFile/validateFile.ts
var validateFile = ({
  name,
  expressionName,
  context,
  context: { filename },
  node,
  nodeType,
  fileConfig,
  config
}) => {
  if (!fileConfig) return;
  const { rules = [], allowOnlySpecifiedSelectors } = fileConfig;
  const fileExportRules = rules.filter(
    ({ scope: scope2 }) => isCorrectScope({ expect: "fileExport", scope: scope2 })
  );
  const fileRootRules = rules.filter(
    ({ scope: scope2 }) => isCorrectScope({ expect: "fileRoot", scope: scope2 })
  );
  const nestedSelectorsRules = rules.filter(
    ({ scope: scope2 }) => isCorrectScope({ expect: "nestedSelectors", scope: scope2 })
  );
  const filenamePath = path5.relative(
    getProjectRoot(config.projectRoot),
    filename
  );
  const regexParameters = config.regexParameters;
  const selectorType = SELECTORS[nodeType];
  const { isExportName, currentName, currentNode } = isExportedName({
    nodeType,
    node,
    name
  });
  if (fileExportRules.length && isExportName) {
    return validateRules({
      rules: fileExportRules,
      name: currentName,
      selectorType,
      node: currentNode,
      nodeNotExported: node,
      context,
      filenamePath,
      errorMessageId: "prohibitedSelectorExport",
      regexParameters,
      expressionName,
      allowOnlySpecifiedSelectors,
      scope: "fileExport",
      allRules: rules
    });
  }
  const isFileRootName = isNameFromFileRoot({
    nodeType,
    node
  });
  if (fileRootRules.length && isFileRootName && !isExportName) {
    return validateRules({
      rules: fileRootRules,
      name,
      selectorType,
      node,
      context,
      filenamePath,
      errorMessageId: "prohibitedSelectorRoot",
      regexParameters,
      expressionName,
      allowOnlySpecifiedSelectors,
      scope: "fileRoot",
      allRules: rules
    });
  }
  if (nestedSelectorsRules.length && !isExportName && !isFileRootName) {
    return validateRules({
      rules: nestedSelectorsRules,
      name,
      node,
      filenamePath,
      errorMessageId: "prohibitedSelectorNested",
      regexParameters,
      expressionName,
      allowOnlySpecifiedSelectors,
      scope: "nestedSelectors",
      context,
      allRules: rules,
      selectorType
    });
  }
  const { scope, errorMessageId } = getCurrentScopeData({
    isFileExport: isExportName,
    isFileRoot: isFileRootName
  });
  isSelectorAllowed({
    rules: [],
    scope,
    allowOnlySpecifiedSelectors,
    node,
    selectorType,
    report: context.report,
    errorMessageId,
    expressionName
  });
};

// src/rules/fileComposition/helpers/handleClassDeclaration.ts
var handleClassDeclaration = ({
  node,
  context,
  config,
  fileConfig
}) => {
  if (!node.id?.name) return;
  validateFile({
    node,
    context,
    name: node.id.name,
    nodeType: "ClassDeclaration",
    config,
    fileConfig
  });
};

// src/rules/fileComposition/helpers/handleFunctionDeclaration.ts
var handleFunctionDeclaration = ({
  node,
  context,
  config,
  fileConfig
}) => {
  if (!node.id?.name) return;
  validateFile({
    node,
    context,
    name: node.id.name,
    nodeType: "FunctionDeclaration",
    config,
    fileConfig
  });
};

// src/rules/fileComposition/helpers/handleMethodDefinition.ts
import { TSESTree as TSESTree9 } from "@typescript-eslint/utils";
var handleMethodDefinition = ({
  context,
  node,
  config,
  fileConfig
}) => {
  if (node.key.type !== TSESTree9.AST_NODE_TYPES.Identifier) return;
  validateFile({
    node,
    context,
    name: node.key.name,
    nodeType: "FunctionDeclaration",
    config,
    fileConfig
  });
};

// src/rules/fileComposition/helpers/handlePropertyDefinition.ts
import { TSESTree as TSESTree10 } from "@typescript-eslint/utils";
var handlePropertyDefinition = ({
  context,
  node,
  config,
  fileConfig
}) => {
  if (node.key.type !== TSESTree10.AST_NODE_TYPES.Identifier) return;
  const nodeType = node.value?.type === TSESTree10.AST_NODE_TYPES.ArrowFunctionExpression ? "ArrowFunctionExpression" : "PropertyDefinition";
  validateFile({
    node,
    context,
    name: node.key.name,
    nodeType,
    config,
    fileConfig
  });
};

// src/rules/fileComposition/helpers/handleVariableDeclarator.ts
import { TSESTree as TSESTree11 } from "@typescript-eslint/utils";
var handleVariableDeclarator = ({
  node,
  context,
  config,
  fileConfig
}) => {
  const expressionName = getIdentifierFromExpression(node.init);
  if (node.id.type === TSESTree11.AST_NODE_TYPES.ArrayPattern || node.id.type === TSESTree11.AST_NODE_TYPES.ObjectPattern) {
    if (expressionName)
      return validateFile({
        node,
        context,
        name: "*",
        nodeType: "Expression",
        expressionName,
        config,
        fileConfig
      });
    return validateFile({
      node,
      context,
      name: "*",
      nodeType: "VariableDeclarator",
      config,
      fileConfig
    });
  }
  if (expressionName) {
    return validateFile({
      node,
      context,
      name: node.id.name,
      nodeType: "Expression",
      expressionName,
      config,
      fileConfig
    });
  }
  const currentNodeType = node.init?.type === TSESTree11.AST_NODE_TYPES.ArrowFunctionExpression ? "ArrowFunctionExpression" : "VariableDeclarator";
  validateFile({
    node,
    context,
    name: node.id.name,
    nodeType: currentNodeType,
    config,
    fileConfig
  });
};

// src/rules/fileComposition/helpers/validateRootSelectorsLimits/helpers/getSelectorsCount.ts
import { TSESTree as TSESTree12 } from "@typescript-eslint/utils";
var getSelectorsCount = (bodyNode) => {
  const selectorsCount = {};
  const incrementSelectorCount = (nodeType) => {
    if (selectorsCount[nodeType]) {
      selectorsCount[nodeType] = selectorsCount[nodeType] + 1;
      return;
    }
    selectorsCount[nodeType] = 1;
  };
  const checkNode = (node) => {
    if (node.type === TSESTree12.AST_NODE_TYPES.ClassDeclaration)
      incrementSelectorCount("class");
    if (node.type === TSESTree12.AST_NODE_TYPES.FunctionDeclaration)
      incrementSelectorCount("function");
    if (node.type === TSESTree12.AST_NODE_TYPES.TSTypeAliasDeclaration)
      incrementSelectorCount("type");
    if (node.type === TSESTree12.AST_NODE_TYPES.TSInterfaceDeclaration)
      incrementSelectorCount("interface");
    if (node.type === TSESTree12.AST_NODE_TYPES.TSEnumDeclaration)
      incrementSelectorCount("enum");
    if (node.type === TSESTree12.AST_NODE_TYPES.VariableDeclaration)
      node.declarations.forEach((variableNode) => {
        if (variableNode.init?.type === TSESTree12.AST_NODE_TYPES.ArrowFunctionExpression)
          return incrementSelectorCount("arrowFunction");
        const isVariableExpression = getIdentifierFromExpression(
          variableNode.init
        );
        if (isVariableExpression)
          return incrementSelectorCount("variableExpression");
        incrementSelectorCount("variable");
      });
  };
  bodyNode.forEach((node) => {
    if (node.type === TSESTree12.AST_NODE_TYPES.ClassDeclaration || node.type === TSESTree12.AST_NODE_TYPES.FunctionDeclaration || node.type === TSESTree12.AST_NODE_TYPES.TSTypeAliasDeclaration || node.type === TSESTree12.AST_NODE_TYPES.TSInterfaceDeclaration || node.type === TSESTree12.AST_NODE_TYPES.TSEnumDeclaration || node.type === TSESTree12.AST_NODE_TYPES.VariableDeclaration)
      checkNode(node);
    if ((node.type === TSESTree12.AST_NODE_TYPES.ExportNamedDeclaration || node.type === TSESTree12.AST_NODE_TYPES.ExportDefaultDeclaration) && (node.declaration?.type === TSESTree12.AST_NODE_TYPES.ClassDeclaration || node.declaration?.type === TSESTree12.AST_NODE_TYPES.FunctionDeclaration || node.declaration?.type === TSESTree12.AST_NODE_TYPES.TSTypeAliasDeclaration || node.declaration?.type === TSESTree12.AST_NODE_TYPES.TSInterfaceDeclaration || node.declaration?.type === TSESTree12.AST_NODE_TYPES.TSEnumDeclaration || node.declaration?.type === TSESTree12.AST_NODE_TYPES.VariableDeclaration))
      checkNode(node.declaration);
  });
  return selectorsCount;
};

// src/rules/fileComposition/helpers/validateRootSelectorsLimits/validateRootSelectorsLimits.ts
var validateRootSelectorsLimits = ({
  node,
  rootSelectorsLimits,
  report
}) => {
  if (!rootSelectorsLimits) return;
  const selectorsCount = getSelectorsCount(node.body);
  const error = rootSelectorsLimits.reduce((acc, { selector, limit }) => {
    const selectorArray = typeof selector === "string" ? [selector] : selector;
    const occurrences = selectorArray.reduce(
      (acc2, selectorType) => acc2 += selectorsCount[selectorType] ?? 0,
      0
    );
    if (occurrences > limit)
      return acc += `
Selector: ${selectorArray.map((s) => `'${s}'`).join(", ")}, limit = ${String(limit)}, occurrences = ${String(occurrences)}.`;
    return acc;
  }, "");
  if (!error) return;
  report({
    node,
    messageId: "rootSelectorsLimits",
    data: { error }
  });
};

// src/rules/fileComposition/fileComposition.ts
var fileComposition = ESLintUtils.RuleCreator(
  () => "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bfile%E2%80%91composition#root"
)({
  name: "file-composition",
  meta: {
    docs: {
      url: "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bfile%E2%80%91composition#root",
      description: "Enforce advanced naming rules and prohibit the use of given selectors in a given file. Have full control over what your file can contain and the naming conventions it must follow."
    },
    type: "problem",
    schema: [{ type: "object", additionalProperties: true }],
    messages: ESLINT_ERRORS,
    fixable: "code"
  },
  defaultOptions: [],
  create(context) {
    const { config, fileConfig } = getFileCompositionConfig(context);
    return {
      Program(node) {
        validateRootSelectorsLimits({
          node,
          report: context.report,
          rootSelectorsLimits: fileConfig?.rootSelectorsLimits
        });
      },
      VariableDeclarator(node) {
        handleVariableDeclarator({ node, context, config, fileConfig });
      },
      ClassDeclaration(node) {
        handleClassDeclaration({ node, context, config, fileConfig });
      },
      MethodDefinition(node) {
        handleMethodDefinition({ node, context, config, fileConfig });
      },
      PropertyDefinition(node) {
        handlePropertyDefinition({ node, context, config, fileConfig });
      },
      FunctionDeclaration(node) {
        handleFunctionDeclaration({ node, context, config, fileConfig });
      },
      TSTypeAliasDeclaration(node) {
        validateFile({
          node,
          context,
          name: node.id.name,
          nodeType: "TSTypeAliasDeclaration",
          config,
          fileConfig
        });
      },
      TSInterfaceDeclaration(node) {
        validateFile({
          node,
          context,
          name: node.id.name,
          nodeType: "TSInterfaceDeclaration",
          config,
          fileConfig
        });
      },
      TSEnumDeclaration(node) {
        validateFile({
          node,
          context,
          name: node.id.name,
          nodeType: "TSEnumDeclaration",
          config,
          fileConfig
        });
      }
    };
  }
});

// src/rules/fileComposition/helpers/createFileComposition.ts
var createFileComposition = (config) => config;

// src/rules/folderStructure/folderStructure.ts
import { ESLintUtils as ESLintUtils2 } from "@typescript-eslint/utils";

// src/rules/folderStructure/helpers/handleProgram.ts
import path14 from "path";

// src/errors/finalErrorGuard.ts
var finalErrorGuard = (err) => !!(err.type === "final");

// src/helpers/cleanUpErrorFromCache.ts
import { existsSync, unlinkSync } from "fs";
import path8 from "path";

// src/helpers/createProjectStructureCacheFile.ts
import { writeFileSync } from "fs";
import path6 from "path";
var createProjectStructureCacheFile = ({
  projectRoot,
  projectStructureCache
}) => {
  const filePath = path6.join(projectRoot, PROJECT_STRUCTURE_CACHE_FILE_NAME);
  const jsonData = JSON.stringify(projectStructureCache, null, 2);
  writeFileSync(filePath, jsonData, "utf8");
};

// src/helpers/readProjectStructureCacheFile.ts
import { readFileSync as readFileSync2 } from "fs";
import path7 from "path";
var readProjectStructureCacheFile = (projectRoot) => {
  try {
    return JSON.parse(
      readFileSync2(
        path7.join(projectRoot, PROJECT_STRUCTURE_CACHE_FILE_NAME),
        "utf-8"
      )
    );
  } catch (_e) {
    return;
  }
};

// src/helpers/cleanUpErrorFromCache.ts
var cleanUpErrorFromCache = ({
  projectRoot,
  filename
}) => {
  const projectStructureCache = readProjectStructureCacheFile(projectRoot);
  if (!projectStructureCache) return;
  const projectStructureCacheClean = projectStructureCache.filter(
    (cache) => filename !== cache.filename && existsSync(cache.filename)
  );
  if (!projectStructureCacheClean.length)
    return unlinkSync(
      path8.join(projectRoot, PROJECT_STRUCTURE_CACHE_FILE_NAME)
    );
  createProjectStructureCacheFile({
    projectRoot,
    projectStructureCache: projectStructureCacheClean
  });
};

// src/helpers/handleCache.ts
import { existsSync as existsSync2 } from "fs";
var handleCache = ({
  projectRoot,
  errorCache
}) => {
  const projectStructureCache = readProjectStructureCacheFile(projectRoot);
  if (!projectStructureCache)
    return createProjectStructureCacheFile({
      projectRoot,
      projectStructureCache: [errorCache]
    });
  const projectStructureCacheClean = projectStructureCache.filter(
    ({ filename }) => existsSync2(filename)
  );
  const isErrorInCache2 = projectStructureCacheClean.some(
    (cache) => cache.errorMessage === errorCache.errorMessage
  );
  if (isErrorInCache2) return;
  createProjectStructureCacheFile({
    projectRoot,
    projectStructureCache: [errorCache, ...projectStructureCacheClean]
  });
};

// src/helpers/isErrorInCache.ts
var isErrorInCache = ({
  projectRoot,
  errorCache
}) => {
  handleCache({
    projectRoot,
    errorCache
  });
  const projectStructureCache = readProjectStructureCacheFile(projectRoot);
  const cacheData = projectStructureCache?.find(
    (cache) => cache.errorMessage === errorCache.errorMessage
  );
  return !!cacheData && errorCache.filename !== cacheData.filename;
};

// src/rules/folderStructure/helpers/validateFolderStructure/validateFolderStructure.ts
import path13 from "path";

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/checkNodeExistence.ts
import fs from "fs";
import path10, { sep as sep3 } from "path";

// src/errors/FinalError.ts
var FinalError = class extends Error {
  message;
  type;
  constructor(message) {
    super(message);
    this.message = message;
    this.type = "final";
  }
};

// src/rules/folderStructure/errors/getLocationError.ts
var getLocationError = ({ nodePath }) => `
Error location = ./${nodePath}

`;

// src/rules/folderStructure/errors/getNodeExistenceError.ts
var getNodeExistenceError = ({
  enforcedNodeNames,
  nodeName,
  nodePath,
  nodeType
}) => new FinalError(
  `\u{1F525} ${nodeType} '${nodeName}' enforces the existence of other folders/files. \u{1F525}

Enforce existence = ${enforcedNodeNames.join(", ")}${getLocationError({ nodePath })}`
);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/getNodePathWithStructureRoot.ts
import path9, { sep as sep2 } from "path";
var getNodePathWithStructureRoot = ({
  nodePath,
  structureRoot
}) => path9.join(structureRoot ?? "", nodePath).replaceAll(sep2, "/");

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/checkNodeExistence.ts
var checkNodeExistence = ({
  enforceExistence,
  nodeName,
  nodeType,
  structureRoot,
  nodePath,
  structureRootConfig,
  projectRoot
}) => {
  const nodeDirname = path10.dirname(nodePath);
  const currentNodeName = nodeName.substring(0, nodeName.lastIndexOf(".")) || nodeName;
  const currentDirname = nodeType === "File" ? nodeDirname : nodePath;
  const currentEnforceExistence = typeof enforceExistence === "string" ? [enforceExistence] : enforceExistence;
  const enforcedNodeNames = currentEnforceExistence.map((enforcedNodeName) => {
    const enforcedNodeNameWithoutRef = getRegexWithoutReferences({
      regexParameters: {
        nodeName: transformStringToCase({
          str: currentNodeName,
          transformTo: "camelCase"
        }),
        NodeName: transformStringToCase({
          str: currentNodeName,
          transformTo: "PascalCase"
        }),
        "node-name": transformStringToCase({
          str: currentNodeName,
          transformTo: "kebab-case"
        }),
        node_name: transformStringToCase({
          str: currentNodeName,
          transformTo: "snake_case"
        }),
        NODE_NAME: transformStringToCase({
          str: currentNodeName,
          transformTo: "SNAKE_CASE"
        })
      },
      regex: enforcedNodeName,
      key: "enforceExistence"
    });
    const enforcedNodeFullPath = path10.join(
      structureRoot,
      currentDirname,
      enforcedNodeNameWithoutRef
    );
    if (fs.existsSync(enforcedNodeFullPath)) return;
    return "./" + path10.relative(projectRoot, enforcedNodeFullPath).replaceAll(sep3, "/");
  }).filter((v) => v !== void 0);
  if (!enforcedNodeNames.length) return;
  throw getNodeExistenceError({
    enforcedNodeNames,
    nodeName,
    nodeType,
    nodePath: getNodePathWithStructureRoot({
      nodePath,
      structureRoot: structureRootConfig
    })
  });
};

// src/rules/folderStructure/errors/getInvalidFolderRecursionLimitError.ts
var getInvalidFolderRecursionLimitError = () => new Error(
  `\u{1F525} 'folderRecursionLimit' cannot exceed ${String(RECURSION_LIMIT)}. \u{1F525}`
);

// src/errors/getRecursionLimitError.ts
var getRecursionLimitError = (pattern) => new Error(`\u{1F525} Infinite recursion for: ${JSON.stringify(pattern)} \u{1F525}`);

// src/rules/folderStructure/errors/getIdRuleError.ts
var getIdRuleError = (ruleId) => new Error(`\u{1F525} ruleId: '${ruleId}' does not exist in object 'rules'. \u{1F525}`);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/getRule.ts
var getRule = ({
  rule,
  rules = {},
  recursionLimit = RECURSION_LIMIT
}) => {
  if (recursionLimit === 0) throw getRecursionLimitError(rule);
  const { ruleId, ...ruleWithoutRuleId } = rule;
  if (!ruleId) return rule;
  const ruleIdData = rules[ruleId];
  if (ruleIdData?.ruleId)
    return getRule({
      rule: { ...ruleIdData, ...ruleWithoutRuleId, ruleId: ruleIdData.ruleId },
      rules,
      recursionLimit: recursionLimit - 1
    });
  if (ruleIdData) return { ...ruleIdData, ...ruleWithoutRuleId };
  throw getIdRuleError(ruleId);
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/extractFolderRecursionFromRules/helpers/containFolderRecursionRuleId.ts
var containFolderRecursionRuleId = ({
  rule,
  ruleId,
  rules,
  nestingLvlLimit = 20
}) => {
  if (ruleId === rule.ruleId) return true;
  const childRule = getRule({ rule, rules });
  if (nestingLvlLimit === 0 || !childRule.children) return false;
  return childRule.children.some(
    (child) => containFolderRecursionRuleId({
      rule: child,
      ruleId,
      rules,
      nestingLvlLimit: nestingLvlLimit - 1
    })
  );
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/extractFolderRecursionFromRules/helpers/extractFolderRecursionFromRule.ts
var extractFolderRecursionFromRule = ({
  folderRecursionLimit,
  rule,
  ruleId,
  rules
}) => {
  const extractRule = (limit) => {
    const newRule = getRule({ rule, rules });
    if (limit === 0) return void 0;
    return {
      ...newRule,
      children: newRule.children?.map((child) => {
        if (containFolderRecursionRuleId({
          rule: child,
          ruleId,
          rules
        }))
          return extractFolderRecursionFromRule({
            rule: child,
            ruleId,
            rules,
            folderRecursionLimit: limit
          });
        return child;
      }).filter((v) => v !== void 0)
    };
  };
  if (rule.ruleId === ruleId) return extractRule(folderRecursionLimit - 1);
  return extractRule(folderRecursionLimit);
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/extractFolderRecursionFromRules/extractFolderRecursionFromRules.ts
var extractFolderRecursionFromRules = (rules) => {
  if (!rules) return;
  const rulesWithoutFolderRecursionLimit = Object.keys(rules).reduce(
    (acc, key) => {
      const { folderRecursionLimit, ...rule } = rules[key];
      return { ...acc, [key]: rule };
    },
    {}
  );
  return Object.keys(rules).reduce((acc, key) => {
    const { folderRecursionLimit, ...rule } = getRule({
      rule: rules[key],
      rules
    });
    if (!folderRecursionLimit) return { ...acc, [key]: rules[key] };
    if (folderRecursionLimit > RECURSION_LIMIT)
      throw getInvalidFolderRecursionLimitError();
    return {
      ...acc,
      [key]: extractFolderRecursionFromRule({
        rule,
        ruleId: key,
        rules: rulesWithoutFolderRecursionLimit,
        folderRecursionLimit
      })
    };
  }, {});
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/getPathname.ts
import path11, { sep as sep4 } from "path";
var getPathname = ({ root, filename }) => path11.relative(root, filename).replaceAll(sep4, "/");

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/getRootRule.ts
var getRootRule = ({
  structure,
  rules,
  rootFolderName
}) => {
  if (Array.isArray(structure))
    return {
      name: rootFolderName,
      children: structure
    };
  return {
    ...getRule({ rule: structure, rules }),
    name: rootFolderName
  };
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/isIgnoredPathname.ts
var isIgnoredPathname = ({
  pathname,
  ignorePatterns
}) => {
  if (!ignorePatterns) return false;
  return isCorrectPattern({ input: pathname, pattern: ignorePatterns });
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validateLongPath.ts
import path12 from "path";

// src/rules/folderStructure/errors/getLongPathError.ts
var getLongPathError = ({
  pathMaxLength,
  path: path20,
  ruleNameInfo
}) => `\u{1F525} Long path detected. \u{1F525}

Too long paths can cause various issues, such as errors when moving or copying a project, unexpected behavior of various tools.
Try flattening the folder structure or using shorter names for nested folders.
If you know what you're doing and don't want to see this message, set 'longPathsInfo' in the configuration to 'false'.

Max length = ${pathMaxLength.toString()}
Path length = ${String(path20.length)}
Path = ${path20}

${ruleNameInfo}`;

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validateLongPath.ts
var validateLongPath = ({
  filename,
  projectRoot,
  longPathsInfo
}) => {
  if (longPathsInfo === false) return;
  const currentPath = longPathsInfo?.countFromSystemRoot ? filename : getPathname({
    root: path12.resolve(projectRoot, longPathsInfo?.root ?? ".."),
    filename
  });
  const pathMaxLength = longPathsInfo?.maxLength ?? 240;
  if (currentPath.length <= pathMaxLength) return;
  if (longPathsInfo === void 0 || longPathsInfo.mode === "warn")
    return console.error(
      `
${getLongPathError({
        path: currentPath,
        pathMaxLength,
        ruleNameInfo: "project-structure/folder-structure"
      })}`
    );
  throw new FinalError(
    getLongPathError({ path: currentPath, pathMaxLength, ruleNameInfo: "" })
  );
};

// src/rules/folderStructure/errors/getBaseError.ts
var getBaseError = ({
  nodeName,
  nodeType
}) => `\u{1F525} ${nodeType} '${nodeName}' is invalid. \u{1F525}

`;

// src/rules/folderStructure/errors/getNameError.ts
var getNameError = ({
  nodeName,
  nodePath,
  nodeType,
  allowedNames
}) => new FinalError(
  `${getBaseError({ nodeName, nodeType })}Allowed names  = ${allowedNames.join(", ")}${getLocationError({ nodePath })}`
);

// src/rules/folderStructure/errors/getNodeTypeError.ts
var getNodeTypeError = ({
  nodeName,
  nodePath,
  nodeType,
  folderName
}) => new FinalError(
  `${getBaseError({ nodeName, nodeType })}According to the structure, the '${folderName}' folder can only contain ${nodeType === "File" ? "folders" : "files"}.${getLocationError({ nodePath })}`
);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/getNodePath.ts
var getNodePath = ({
  filenameWithoutProjectRoot,
  nodeName,
  pathname
}) => filenameWithoutProjectRoot.replace(pathname, "") + nodeName;

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getChildren/helpers/removeRuleReplicatesFromChildren.ts
var removeRuleReplicatesFromChildren = (children) => children.reduce((acc, child) => {
  if (!child.name) return [...acc, child];
  const isDuplicatedName = acc.some(
    ({ name, children: children2 }) => name === child.name && !!child.children === !!children2
  );
  if (isDuplicatedName) return acc;
  return [...acc, child];
}, []);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getChildren/helpers/isRegex.ts
var isRegex = (str) => /[^a-zA-Z0-9._-]/.test(str ?? "");

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getChildren/helpers/sortChildrenByNameType.ts
var sortChildrenByNameType = (children) => children.sort(
  ({ name: nameA, children: childrenA }, { name: nameB, children: childrenB }) => {
    if (nameA && !nameB) return -1;
    if (!nameA && nameB) return 1;
    if (!childrenA && childrenB) return -1;
    if (childrenA && !childrenB) return 1;
    if (nameA === "*" && nameB !== "*") return 1;
    if (nameA !== "*" && nameB === "*") return -1;
    if (nameA?.includes("*") && !nameB?.includes("*")) return 1;
    if (!nameA?.includes("*") && nameB?.includes("*")) return -1;
    if (isRegex(nameA) && !isRegex(nameB)) return 1;
    if (!isRegex(nameA) && isRegex(nameB)) return -1;
    return -1;
  }
);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getChildren/getChildren.ts
var getChildren = ({
  children,
  rules
}) => {
  if (!children) return;
  const childrenWithoutRuleId = children.map(
    (rule) => getRule({ rule, rules })
  );
  const childrenWithoutReplicatedRules = removeRuleReplicatesFromChildren(
    childrenWithoutRuleId
  );
  return sortChildrenByNameType(childrenWithoutReplicatedRules);
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getNextPathname.ts
var getNextPathname = ({
  nodeName,
  pathname
}) => pathname.replace(`${nodeName}/`, "");

// src/rules/folderStructure/folderStructure.consts.ts
var NODE_NAME_REFERENCES = {
  nodeName: "{nodeName}",
  NodeName: "{NodeName}",
  "node-name": "{node-name}",
  node_name: "{node_name}",
  NODE_NAME: "{NODE_NAME}"
};
var REFERENCES2 = {
  folderName: "{folderName}",
  FolderName: "{FolderName}",
  "folder-name": "{folder-name}",
  folder_name: "{folder_name}",
  FOLDER_NAME: "{FOLDER_NAME}",
  ...NODE_NAME_REFERENCES
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getNodeAllowedNames.ts
var getNodeAllowedNames = ({
  nodeType,
  folderName,
  children = []
}) => children.filter(({ name, children: children2 }) => {
  if (nodeType === "File") return name && !children2;
  return name && children2;
}).map(
  ({ name }) => name?.replaceAll(
    REFERENCES2.folderName,
    transformStringToCase({
      str: folderName,
      transformTo: "camelCase"
    })
  ).replaceAll(
    REFERENCES2.FolderName,
    transformStringToCase({
      str: folderName,
      transformTo: "PascalCase"
    })
  ).replaceAll(
    REFERENCES2["folder-name"],
    transformStringToCase({
      str: folderName,
      transformTo: "kebab-case"
    })
  ).replaceAll(
    REFERENCES2.folder_name,
    transformStringToCase({
      str: folderName,
      transformTo: "snake_case"
    })
  ).replaceAll(
    REFERENCES2.FOLDER_NAME,
    transformStringToCase({
      str: folderName,
      transformTo: "SNAKE_CASE"
    })
  )
).filter((v) => v !== void 0);

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getNodeName.ts
var getNodeName = (pathname) => pathname.split("/")[0];

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/helpers/getDefaultRegexParameters.ts
var getDefaultRegexParameters2 = ({
  folderName,
  regexParameters = {}
}) => ({
  camelCase: CAMEL_CASE,
  PascalCase: PASCAL_CASE,
  strictCamelCase: STRICT_CAMEL_CASE,
  StrictPascalCase: STRICT_PASCAL_CASE,
  snake_case: SNAKE_CASE_LOWER,
  SNAKE_CASE: SNAKE_CASE_UPPER,
  "kebab-case": KEBAB_CASE,
  ...regexParameters,
  folderName: transformStringToCase({
    str: folderName,
    transformTo: "camelCase"
  }),
  FolderName: transformStringToCase({
    str: folderName,
    transformTo: "PascalCase"
  }),
  "folder-name": transformStringToCase({
    str: folderName,
    transformTo: "kebab-case"
  }),
  folder_name: transformStringToCase({
    str: folderName,
    transformTo: "snake_case"
  }),
  FOLDER_NAME: transformStringToCase({
    str: folderName,
    transformTo: "SNAKE_CASE"
  })
});

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/helpers/applyRegexParameters.ts
var applyRegexParameters = ({
  regex,
  folderName,
  regexParameters
}) => {
  const defaultRegexParameters = getDefaultRegexParameters2({
    folderName,
    regexParameters
  });
  return getRegexWithoutReferences({
    regex,
    regexParameters: defaultRegexParameters,
    key: "name"
  });
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/validateName.consts.ts
var DOT_CHARACTER_REGEX = "\\.";

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/validateName.ts
var validateName = ({
  nodeName,
  ruleName,
  folderName,
  regexParameters
}) => {
  const regexImproved = ruleName.replaceAll(".", DOT_CHARACTER_REGEX).replaceAll(`${DOT_CHARACTER_REGEX}${DOT_CHARACTER_REGEX}`, ".").replaceAll("*", WILDCARD_REGEX).replaceAll(`${WILDCARD_REGEX}${WILDCARD_REGEX}`, "*");
  const regexWithRegexParameters = applyRegexParameters({
    regex: regexImproved,
    folderName,
    regexParameters
  });
  if (isRegexInvalid(regexWithRegexParameters))
    throw getInvalidRegexError(regexWithRegexParameters);
  const finalRegex = new RegExp(`^${regexWithRegexParameters}$`, "g");
  return finalRegex.test(nodeName);
};

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getNodeRule.ts
var getNodeRule = ({
  children,
  nodeName,
  nodeType,
  folderName,
  regexParameters
}) => children?.find(({ name, children: children2 }) => {
  if (!name) return false;
  if (nodeType === "File" && children2) return false;
  if (nodeType === "Folder" && !children2) return false;
  return validateName({
    folderName,
    nodeName,
    ruleName: name,
    regexParameters
  });
});

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/getNodeType.ts
var getNodeType = (nodeName) => !nodeName.includes("/") ? "File" : "Folder";

// src/rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/validatePath.ts
var validatePath = ({
  pathname,
  filenameWithoutProjectRoot,
  folderName,
  rule,
  config,
  structureRoot,
  projectRoot
}) => {
  const { rules, regexParameters } = config;
  const nodeName = getNodeName(pathname);
  const nodeType = getNodeType(pathname);
  const nodeChildren = getChildren({
    children: rule.children,
    rules
  });
  if (!nodeChildren?.length) return;
  const nodeRule = getNodeRule({
    nodeName,
    nodeType,
    children: nodeChildren,
    folderName,
    regexParameters
  });
  const nodePath = getNodePath({
    filenameWithoutProjectRoot,
    nodeName,
    pathname
  });
  if (!nodeRule) {
    const allowedNames = getNodeAllowedNames({
      nodeType,
      children: nodeChildren,
      folderName
    });
    const nodePathWithStructureRoot = getNodePathWithStructureRoot({
      nodePath,
      structureRoot: config.structureRoot
    });
    if (!allowedNames.length)
      throw getNodeTypeError({
        nodePath: nodePathWithStructureRoot,
        nodeType,
        nodeName,
        folderName
      });
    throw getNameError({
      allowedNames,
      nodeName,
      nodePath: nodePathWithStructureRoot,
      nodeType
    });
  }
  const { children, enforceExistence, name } = getRule({
    rule: nodeRule,
    rules
  });
  if (enforceExistence)
    checkNodeExistence({
      enforceExistence,
      nodeName,
      structureRoot,
      nodePath,
      nodeType,
      structureRootConfig: config.structureRoot,
      projectRoot
    });
  if (children) {
    const nextPathname = getNextPathname({ pathname, nodeName });
    validatePath({
      pathname: nextPathname,
      filenameWithoutProjectRoot,
      folderName: nodeName,
      rule: { name, enforceExistence, children },
      config,
      structureRoot,
      projectRoot
    });
  }
};

// src/rules/folderStructure/helpers/validateFolderStructure/validateFolderStructure.consts.ts
var FOLDER_STRUCTURE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    LongPathsInfo: {
      type: "object",
      default: { maxLength: 240, mode: "warn" },
      properties: {
        maxLength: {
          type: "number",
          default: 240
        },
        root: {
          type: "string",
          default: ".."
        },
        countFromSystemRoot: {
          type: "boolean"
        },
        mode: {
          type: "string",
          default: "warn",
          enum: ["warn", "error"]
        }
      },
      required: ["mode"],
      additionalProperties: false
    },
    FolderRecursionRule: {
      type: "object",
      default: { name: "" },
      additionalProperties: false,
      properties: {
        ruleId: {
          type: "string",
          default: ""
        },
        name: {
          type: "string",
          default: ""
        },
        children: {
          type: "array",
          default: [],
          items: {
            $ref: "#/definitions/Rule"
          }
        },
        enforceExistence: {
          oneOf: [
            { type: "string", default: "" },
            { type: "array", default: [], items: { type: "string" } }
          ]
        },
        folderRecursionLimit: {
          type: "number"
        }
      }
    },
    Rule: {
      type: "object",
      default: { name: "" },
      additionalProperties: false,
      properties: {
        ruleId: {
          type: "string",
          default: ""
        },
        name: {
          type: "string",
          default: ""
        },
        children: {
          type: "array",
          default: [],
          items: {
            $ref: "#/definitions/Rule"
          }
        },
        enforceExistence: {
          oneOf: [
            { type: "string", default: "" },
            { type: "array", default: [], items: { type: "string" } }
          ]
        }
      }
    },
    RegexParameters: {
      type: "object",
      default: {},
      additionalProperties: {
        type: "string",
        default: ""
      }
    }
  },
  type: "object",
  additionalProperties: false,
  properties: {
    ignorePatterns: {
      oneOf: [
        { type: "string", default: "" },
        {
          type: "array",
          default: [],
          items: {
            oneOf: [
              { type: "string", default: "" },
              { type: "array", default: [], items: { type: "string" } }
            ]
          }
        }
      ]
    },
    projectRoot: {
      type: "string",
      default: "."
    },
    structureRoot: {
      type: "string",
      default: "."
    },
    longPathsInfo: {
      oneOf: [
        {
          $ref: "#/definitions/LongPathsInfo"
        },
        {
          type: "boolean",
          enum: [false]
        }
      ]
    },
    structure: {
      oneOf: [
        {
          $ref: "#/definitions/Rule"
        },
        {
          type: "array",
          default: [],
          items: {
            $ref: "#/definitions/Rule"
          }
        }
      ]
    },
    rules: {
      type: "object",
      default: {},
      additionalProperties: {
        $ref: "#/definitions/FolderRecursionRule"
      }
    },
    regexParameters: {
      $ref: "#/definitions/RegexParameters"
    }
  },
  required: ["structure"]
};

// src/rules/folderStructure/helpers/validateFolderStructure/validateFolderStructure.ts
var validateFolderStructure = ({
  filename,
  structureRoot,
  projectRoot,
  config
}) => {
  const { structure, ignorePatterns, longPathsInfo, rules } = config;
  validateConfig({ config, schema: FOLDER_STRUCTURE_SCHEMA });
  const rulesWithFolderRecursion = extractFolderRecursionFromRules(rules);
  const rootFolderName = path13.basename(structureRoot);
  const rootRule = getRootRule({
    structure,
    rootFolderName,
    rules: rulesWithFolderRecursion
  });
  const pathname = getPathname({
    root: structureRoot,
    filename
  });
  if (isIgnoredPathname({ pathname, ignorePatterns })) return;
  validateLongPath({ filename, projectRoot, longPathsInfo });
  if (rootRule.enforceExistence) {
    checkNodeExistence({
      enforceExistence: rootRule.enforceExistence,
      nodeName: rootFolderName,
      nodeType: "Folder",
      structureRoot,
      nodePath: "",
      structureRootConfig: config.structureRoot,
      projectRoot
    });
  }
  validatePath({
    pathname,
    filenameWithoutProjectRoot: pathname,
    structureRoot,
    folderName: rootFolderName,
    rule: rootRule,
    config: { ...config, rules: rulesWithFolderRecursion },
    projectRoot
  });
};

// src/rules/folderStructure/helpers/handleProgram.ts
var handleProgram = ({
  context: { settings, filename, options, report },
  node
}) => {
  const config = readConfigFile({
    key: "project-structure/folder-structure-config-path",
    settings,
    options: options[0]
  });
  const projectRoot = getProjectRoot(config.projectRoot);
  const structureRoot = path14.resolve(projectRoot, config.structureRoot ?? ".");
  if (!filename.includes(structureRoot) || filename.includes(PROJECT_STRUCTURE_CACHE_FILE_NAME))
    return;
  try {
    validateFolderStructure({
      filename,
      structureRoot,
      projectRoot,
      config
    });
    cleanUpErrorFromCache({ projectRoot, filename });
  } catch (error) {
    if (!finalErrorGuard(error)) throw error;
    if (isErrorInCache({
      projectRoot,
      errorCache: {
        filename,
        errorMessage: error.message
      }
    }))
      return;
    report({
      node,
      messageId: "error",
      data: { error: error.message }
    });
  }
};

// src/rules/folderStructure/folderStructure.ts
var folderStructure = ESLintUtils2.RuleCreator(
  () => "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bfolder%E2%80%91structure#root"
)({
  name: "folder-structure",
  meta: {
    docs: {
      url: "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bfolder%E2%80%91structure#root",
      description: "Enforce rules on folder structure to keep your repository consistent, orderly and well thought out."
    },
    type: "problem",
    schema: [{ type: "object", additionalProperties: true }],
    messages: ESLINT_ERRORS2
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        handleProgram({ context, node });
      }
    };
  }
});

// src/rules/folderStructure/helpers/createFolderStructure.ts
var createFolderStructure = (config) => config;

// src/rules/independentModules/helpers/createIndependentModules.ts
var createIndependentModules = (config) => config;

// src/rules/independentModules/independentModules.ts
import { ESLintUtils as ESLintUtils3 } from "@typescript-eslint/utils";

// src/rules/independentModules/helpers/getIndependentModulesConfig/getIndependentModulesConfig.consts.ts
var INDEPENDENT_MODULES_SCHEMA = {
  $ref: "#/definitions/IndependentModulesConfig",
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    Pattern: {
      anyOf: [
        {
          type: "string",
          default: ""
        },
        {
          type: "array",
          default: [],
          items: {
            type: "string",
            default: ""
          }
        }
      ]
    },
    Module: {
      type: "object",
      default: {
        name: "",
        pattern: "",
        allowImportsFrom: []
      },
      additionalProperties: false,
      properties: {
        name: {
          type: "string",
          default: ""
        },
        pattern: {
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
                    items: { type: "string" }
                  }
                ]
              }
            }
          ]
        },
        errorMessage: {
          type: "string",
          default: ""
        },
        allowImportsFrom: {
          type: "array",
          default: [],
          items: {
            $ref: "#/definitions/Pattern"
          }
        },
        allowExternalImports: {
          type: "boolean",
          default: false
        }
      },
      required: ["name", "pattern", "allowImportsFrom"]
    },
    IndependentModulesConfig: {
      type: "object",
      default: {},
      additionalProperties: false,
      properties: {
        extensions: {
          type: "array",
          default: [],
          items: {
            type: "string",
            default: ""
          }
        },
        debugMode: {
          type: "boolean",
          default: true
        },
        tsconfigPath: {
          type: "string",
          default: "./tsconfig.json"
        },
        pathAliases: {
          type: "object",
          default: {},
          additionalProperties: false,
          properties: {
            baseUrl: { type: "string", default: "" },
            paths: {
              type: "object",
              default: {},
              additionalProperties: {
                type: "array",
                default: [],
                items: { type: "string" }
              }
            }
          },
          required: ["baseUrl", "paths"]
        },
        reusableImportPatterns: {
          type: "object",
          default: {},
          additionalProperties: {
            type: "array",
            items: {
              $ref: "#/definitions/Pattern"
            }
          }
        },
        modules: {
          type: "array",
          default: [],
          items: {
            $ref: "#/definitions/Module"
          }
        }
      },
      required: ["modules"]
    }
  }
};

// src/rules/independentModules/helpers/getIndependentModulesConfig/helpers/getPathAliases.ts
import { readFileSync as readFileSync3 } from "fs";
import path15 from "path";
import { parse as parse2 } from "comment-json";

// src/rules/independentModules/independentModules.consts.ts
var DIRNAME_REGEX = /{dirname(_\d+)?}/g;
var FAMILY_REGEX = /{family(_\d+)?}/g;
var DEFAULT_BASE_URL = ".";
var NO_FAMILY = "NO_FAMILY";

// src/rules/independentModules/helpers/getIndependentModulesConfig/helpers/getPathAliases.ts
var getPathAliases = ({
  config
}) => {
  const { pathAliases } = config;
  if (pathAliases) return pathAliases;
  const projectRoot = getProjectRoot();
  const tsconfigPath = config.tsconfigPath ? path15.resolve(projectRoot, config.tsconfigPath) : path15.join(projectRoot, "tsconfig.json");
  let tsconfig;
  try {
    tsconfig = parse2(
      readFileSync3(tsconfigPath, "utf-8")
    );
  } catch (_e) {
    return;
  }
  const {
    compilerOptions: { baseUrl = DEFAULT_BASE_URL, paths = {} }
  } = tsconfig;
  return {
    baseUrl,
    paths
  };
};

// src/rules/independentModules/helpers/getIndependentModulesConfig/getIndependentModulesConfig.ts
var getIndependentModulesConfig = ({
  options,
  settings
}) => {
  const config = readConfigFile({
    key: "project-structure/independent-modules-config-path",
    settings,
    options: options[0]
  });
  validateConfig({ config, schema: INDEPENDENT_MODULES_SCHEMA });
  const pathAliases = getPathAliases({ config });
  return { ...config, pathAliases };
};

// src/rules/independentModules/helpers/handleCallExpression.ts
import { AST_NODE_TYPES } from "@typescript-eslint/utils";

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/addExtensionToImportPath/addExtensionToImportPath.ts
import fs2 from "fs";

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/addExtensionToImportPath/addExtensionToImportPath.consts.ts
var FILE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".d.ts",
  ".ts",
  ".tsx",
  ".vue",
  ".svelte",
  ".json",
  ".jsonc",
  ".yml",
  ".yaml",
  ".svg",
  ".png",
  ".jpg",
  ".ico",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html"
];

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/getFullImportPathVariants.ts
import path16 from "path";
var getFullImportPathVariants = ({
  importPath,
  projectRoot,
  projectRootWithBaseUrl
}) => {
  const fullImportPath = path16.join(projectRootWithBaseUrl, importPath);
  const fullImportPathIndex = path16.join(fullImportPath, "index");
  const fullImportPathExternal = path16.join(
    projectRoot,
    "node_modules",
    importPath
  );
  const fullImportPathExternalIndex = path16.join(
    fullImportPathExternal,
    "index"
  );
  const fullImportPathExternalTypes = path16.join(
    projectRoot,
    "node_modules",
    "@types",
    importPath
  );
  const fullImportPathExternalTypesIndex = path16.join(
    fullImportPathExternalTypes,
    "index"
  );
  const fullImportPathExternalNode = path16.join(
    projectRoot,
    "node_modules",
    "node",
    importPath
  );
  const fullImportPathExternalNodeIndex = path16.join(
    fullImportPathExternalTypes,
    "index"
  );
  const fullImportPathExternalTypesNode = path16.join(
    projectRoot,
    "node_modules",
    "@types",
    "node",
    importPath
  );
  const fullImportPathExternalTypesNodeIndex = path16.join(
    fullImportPathExternalTypes,
    "index"
  );
  return {
    fullImportPath,
    fullImportPathIndex,
    fullImportPathExternal,
    fullImportPathExternalIndex,
    fullImportPathExternalTypes,
    fullImportPathExternalTypesIndex,
    fullImportPathExternalNode,
    fullImportPathExternalNodeIndex,
    fullImportPathExternalTypesNode,
    fullImportPathExternalTypesNodeIndex
  };
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/addExtensionToImportPath/addExtensionToImportPath.ts
var addExtensionToImportPath = ({
  importPath,
  extensions = [],
  projectRoot,
  projectRootWithBaseUrl
}) => {
  const allExtensions = [...FILE_EXTENSIONS, ...extensions];
  const isImportPathWithExtension = allExtensions.some(
    (extension) => importPath.endsWith(extension)
  );
  if (isImportPathWithExtension) return importPath;
  const {
    fullImportPath,
    fullImportPathExternal,
    fullImportPathExternalIndex,
    fullImportPathExternalTypes,
    fullImportPathExternalTypesIndex,
    fullImportPathIndex,
    fullImportPathExternalTypesNode,
    fullImportPathExternalTypesNodeIndex,
    fullImportPathExternalNode,
    fullImportPathExternalNodeIndex
  } = getFullImportPathVariants({
    importPath,
    projectRoot,
    projectRootWithBaseUrl
  });
  const fullImportPathsWithIndex = [
    fullImportPathIndex,
    fullImportPathExternalIndex,
    fullImportPathExternalTypesIndex,
    fullImportPathExternalTypesNodeIndex,
    fullImportPathExternalNodeIndex
  ];
  const fullImportPathsWithoutIndex = [
    fullImportPath,
    fullImportPathExternal,
    fullImportPathExternalTypes,
    fullImportPathExternalTypesNode,
    fullImportPathExternalNode
  ];
  const importPathWithExtension = allExtensions.reduce(
    (acc, ext) => {
      const isImportPathWithoutIndex = fullImportPathsWithoutIndex.some(
        (fullImportPathWithoutIndex) => fs2.existsSync(fullImportPathWithoutIndex + ext)
      );
      if (isImportPathWithoutIndex) return acc = importPath + ext;
      const isImportPathWithIndex = fullImportPathsWithIndex.some(
        (fullImportPathWithIndex) => fs2.existsSync(fullImportPathWithIndex + ext)
      );
      if (isImportPathWithIndex) return acc = `${importPath}/index${ext}`;
      return acc;
    },
    void 0
  );
  return importPathWithExtension ?? importPath;
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/checkImportPath.ts
import micromatch3 from "micromatch";

// src/rules/independentModules/helpers/getDirnamePath.ts
import path17 from "path";

// src/rules/independentModules/helpers/extractPathReferencesFromPattern.ts
var extractPathReferencesFromPattern = (pattern) => {
  const matchFamily = pattern.match(FAMILY_REGEX);
  const matchDirname = pattern.match(DIRNAME_REGEX);
  if (!matchFamily && matchDirname) return matchDirname[0];
  if (matchFamily && !matchDirname) return matchFamily[0];
  return null;
};

// src/rules/independentModules/helpers/getLvlFromPattern.ts
var getLvlFromPattern = (pattern, defaultLvl) => {
  const extractedReference = extractPathReferencesFromPattern(pattern);
  if (!extractedReference) return defaultLvl;
  const patternElements = extractedReference.split("_");
  if (patternElements.length === 1) return defaultLvl;
  return Number(patternElements[1].replaceAll("}", ""));
};

// src/rules/independentModules/helpers/getDirnamePath.ts
var getDirnamePath = (fileName, pattern) => {
  const lvl = getLvlFromPattern(pattern, 1);
  let dirnamePath = fileName;
  for (let i = 0; i < lvl; i++) {
    dirnamePath = path17.dirname(dirnamePath);
  }
  return dirnamePath;
};

// src/rules/independentModules/helpers/getFamilyPath.ts
var getFamilyPath = ({
  filename,
  importPath,
  pattern
}) => {
  const lvl = getLvlFromPattern(pattern, 2);
  const importPathParts = importPath.split("/");
  const filenameParts = filename.split("/");
  const familyParts = [];
  for (let i = 0; i < Math.min(importPathParts.length, filenameParts.length); i++) {
    if (importPathParts[i] !== filenameParts[i]) break;
    familyParts.push(importPathParts[i]);
  }
  if (familyParts.length < lvl) return NO_FAMILY;
  return familyParts.join("/");
};

// src/rules/independentModules/helpers/convertReferencesToPath.ts
var convertReferencesToPath = ({
  importPath,
  pattern,
  filename
}) => Array.isArray(pattern) ? pattern.map((p) => p.replace(DIRNAME_REGEX, getDirnamePath(filename, p))).map(
  (p) => p.replace(
    FAMILY_REGEX,
    getFamilyPath({ importPath, filename, pattern: p })
  )
) : pattern.replace(DIRNAME_REGEX, getDirnamePath(filename, pattern)).replace(
  FAMILY_REGEX,
  getFamilyPath({ importPath, filename, pattern })
);

// src/rules/independentModules/helpers/getDebugMessage.ts
var getDebugMessage = ({
  allowImportsFromExtracted,
  filename,
  importPath
}) => {
  const referencesMode = allowImportsFromExtracted.reduce(
    (acc, pattern) => {
      const newPattern = convertReferencesToPath({
        pattern,
        importPath,
        filename
      });
      return acc = `${acc}${JSON.stringify(newPattern)}
`;
    },
    "allowImportsFrom:\n"
  );
  return `

File path   = "${filename}"
Import path = "${importPath}"
{family}    = "${getFamilyPath({ filename, importPath, pattern: "{family}" })}"
{dirname}   = "${getDirnamePath(filename, "{dirname}")}"

${referencesMode}
`;
};

// src/rules/independentModules/errors/getExternalImportError.ts
var getExternalImportError = ({
  debugMode,
  importPath,
  moduleName,
  errorMessage,
  filename,
  allowImportsFromExtracted
}) => {
  const debugModeMessage = debugMode ? getDebugMessage({ allowImportsFromExtracted, filename, importPath }) : "";
  return new FinalError(
    (errorMessage ?? `\u{1F525} External imports are not allowed in the module '${moduleName}'. \u{1F525}`) + debugModeMessage
  );
};

// src/rules/independentModules/errors/getImportError.ts
var getImportError = ({
  allowImportsFromExtracted,
  filename,
  importPath,
  moduleName,
  debugMode,
  errorMessage
}) => {
  const debugModeMessage = debugMode ? getDebugMessage({ allowImportsFromExtracted, filename, importPath }) : "";
  return new FinalError(
    (errorMessage ?? `\u{1F525} This import is not allowed in the module '${moduleName}'. \u{1F525}`) + debugModeMessage
  );
};

// src/rules/independentModules/errors/getImportPathNotExistsError.ts
var getImportPathNotExistsError = () => new FinalError(
  `\u{1F525} Cannot find module. If the import includes a path alias, make sure that you have added the alias to the configuration. \u{1F525}`
);

// src/rules/independentModules/errors/getInvalidReusableImportPatternsKeyError.ts
var getInvalidReusableImportPatternsKeyError = (key) => new Error(
  `\u{1F525} The '${key}' key does not exist in the reusableImportPatterns object. \u{1F525}`
);

// src/rules/independentModules/errors/getNestedArrayInPatternError.ts
var getNestedArrayInPatternError = (patterns, referenceKey) => new Error(
  `\u{1F525} You want to use {${referenceKey}} in the ${JSON.stringify(patterns)} pattern, but {${referenceKey}} has nested arrays within it. \u{1F525}`
);

// src/rules/independentModules/errors/getReferenceAsPartOfPatternError.ts
var getReferenceAsPartOfPatternError = (referenceKey, pattern) => new Error(
  `\u{1F525} You want to use {${referenceKey}} as part of '${pattern}' pattern, but {${referenceKey}} contains more than one pattern. \u{1F525}`
);

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/extractReferencesFromPatterns/helpers/hasNestedArray.ts
var hasNestedArray = (arr) => arr.some((item) => Array.isArray(item));

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/extractReferencesFromPatterns/extractReferencesFromPatterns.ts
var extractReferencesFromPatterns = ({
  patterns,
  reusableImportPatterns,
  recursionLimit = RECURSION_LIMIT,
  checkNestedArrays = false
}) => {
  if (!reusableImportPatterns) return patterns;
  if (recursionLimit === 0) throw getRecursionLimitError(patterns);
  return patterns.reduce((acc, pattern) => {
    if (Array.isArray(pattern))
      return [
        ...acc,
        extractReferencesFromPatterns({
          patterns: pattern,
          reusableImportPatterns,
          recursionLimit: recursionLimit - 1,
          checkNestedArrays
        })
      ];
    const patternMatch = pattern.match(/\{([^{}]*?)\}/g);
    const forbiddenPattern = /^(family|dirname)(_\d+)?$/;
    const referenceKeys = patternMatch?.map((match) => match.slice(1, -1)).filter((pattern2) => !forbiddenPattern.test(pattern2));
    const referenceKey = referenceKeys?.[0];
    const referenceAsPartOfPattern = patternMatch?.[0] ? pattern.replace(patternMatch[0], "") : void 0;
    if (!referenceKey) return [...acc, pattern];
    if (!reusableImportPatterns[referenceKey])
      throw getInvalidReusableImportPatternsKeyError(referenceKey);
    const reference = extractReferencesFromPatterns({
      patterns: reusableImportPatterns[referenceKey],
      reusableImportPatterns,
      recursionLimit: recursionLimit - 1,
      checkNestedArrays
    });
    if (referenceAsPartOfPattern && (reference.length !== 1 || typeof reference[0] !== "string"))
      throw getReferenceAsPartOfPatternError(referenceKey, pattern);
    if (referenceAsPartOfPattern && reference.length === 1 && typeof reference[0] === "string") {
      if (referenceKeys.length > 1)
        return [
          ...acc,
          ...extractReferencesFromPatterns({
            patterns: [pattern.replace(`{${referenceKey}}`, reference[0])],
            reusableImportPatterns,
            recursionLimit: recursionLimit - 1,
            checkNestedArrays
          })
        ];
      return [...acc, pattern.replace(`{${referenceKey}}`, reference[0])];
    }
    if (checkNestedArrays && Array.isArray(reference) && hasNestedArray(reference)) {
      throw getNestedArrayInPatternError(patterns, referenceKey);
    }
    return [
      ...acc,
      ...extractReferencesFromPatterns({
        patterns: reference,
        reusableImportPatterns,
        recursionLimit: recursionLimit - 1,
        checkNestedArrays
      })
    ];
  }, []);
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/findModuleConfig.ts
var findModuleConfig = (fileName, modules) => modules.find(({ pattern }) => isCorrectPattern({ input: fileName, pattern }));

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/getReusableImportPatternsWithoutRef.ts
var getReusableImportPatternsWithoutRef = (reusableImportPatterns) => {
  if (!reusableImportPatterns) return;
  return Object.keys(reusableImportPatterns).reduce(
    (acc, key) => ({
      ...acc,
      [key]: extractReferencesFromPatterns({
        patterns: reusableImportPatterns[key],
        reusableImportPatterns,
        checkNestedArrays: true
      })
    }),
    {}
  );
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/isExternalImport.ts
import fs3 from "fs";
var isExternalImport = (importPath, projectRoot) => {
  if (importPath.startsWith(".")) return false;
  const importPathFirstElement = importPath.split(/[.:/]/)[0];
  const importPaths = [importPath, importPathFirstElement];
  return importPaths.some((iPath) => {
    const {
      fullImportPathExternal,
      fullImportPathExternalTypes,
      fullImportPathExternalTypesNode,
      fullImportPathExternalNode
    } = getFullImportPathVariants({
      importPath: iPath,
      projectRoot,
      projectRootWithBaseUrl: ""
    });
    return fs3.existsSync(fullImportPathExternal) || fs3.existsSync(fullImportPathExternalTypes) || fs3.existsSync(fullImportPathExternalNode) || fs3.existsSync(fullImportPathExternalTypesNode);
  });
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/isImportPathExists.ts
import fs4 from "fs";
import path18 from "path";
var isImportPathExists = ({
  importPath,
  projectRoot,
  baseUrl
}) => fs4.existsSync(path18.join(projectRoot, baseUrl, importPath));

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/helpers/validateImportPath.ts
import micromatch2 from "micromatch";
var validateImportPath = ({
  allowImportsFrom,
  importPath,
  filename
}) => allowImportsFrom.some((pattern) => {
  const newPattern = convertReferencesToPath({
    pattern,
    importPath,
    filename
  });
  return micromatch2.every(importPath, newPattern);
});

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/checkImportPath/checkImportPath.ts
var checkImportPath = ({
  importPath,
  filename,
  config: { reusableImportPatterns, modules, debugMode, pathAliases },
  projectRoot
}) => {
  const moduleConfig = findModuleConfig(filename, modules);
  if (!moduleConfig) return;
  const {
    allowExternalImports,
    allowImportsFrom,
    name: moduleName,
    errorMessage
  } = moduleConfig;
  const reusableImportPatternsExtracted = getReusableImportPatternsWithoutRef(
    reusableImportPatterns
  );
  const allowImportsFromExtracted = extractReferencesFromPatterns({
    patterns: allowImportsFrom,
    reusableImportPatterns: reusableImportPatternsExtracted
  });
  const importPathExists = isImportPathExists({
    importPath,
    projectRoot,
    baseUrl: pathAliases?.baseUrl ?? "."
  });
  if (!importPathExists) {
    const isExternal = isExternalImport(importPath, projectRoot);
    if (isExternal) {
      const isValidExternalImportPattern = allowImportsFromExtracted.some(
        (p) => micromatch3.every(importPath, p)
      );
      if (isValidExternalImportPattern || allowExternalImports !== false)
        return;
      throw getExternalImportError({
        moduleName,
        errorMessage,
        debugMode,
        filename,
        importPath,
        allowImportsFromExtracted
      });
    }
    throw getImportPathNotExistsError();
  }
  const isValidImportPath = validateImportPath({
    allowImportsFrom: allowImportsFromExtracted,
    importPath,
    filename
  });
  if (isValidImportPath) return;
  throw getImportError({
    moduleName,
    errorMessage,
    debugMode,
    filename,
    importPath,
    allowImportsFromExtracted
  });
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/convertImportPathToNonRelative.ts
import path19 from "path";

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/removeProjectRootFromPath.ts
import { sep as sep5 } from "path";
var removeProjectRootFromPath = (path20, projectRootWithBaseUrl) => path20.replace(projectRootWithBaseUrl + sep5, "").replace(/\\/g, "/");

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/convertImportPathToNonRelative.ts
var convertImportPathToNonRelative = ({
  projectRootWithBaseUrl,
  filename,
  importPath
}) => {
  if (!importPath.startsWith(".")) return importPath;
  const dirname2 = path19.dirname(filename);
  const importPathCleaned = importPath.replace(/^:/, "");
  const fullImportPath1 = path19.resolve(dirname2, importPathCleaned);
  const fullImportPath2 = path19.resolve(
    projectRootWithBaseUrl,
    importPathCleaned
  );
  let fullImportPath = fullImportPath1;
  if (importPath.startsWith(":")) {
    fullImportPath = fullImportPath2;
  }
  return removeProjectRootFromPath(fullImportPath, projectRootWithBaseUrl);
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/getImportPaths.ts
var getImportPaths = ({
  importPath,
  paths
}) => {
  const pathsKays = Object.keys(paths ?? {});
  if (!paths || !pathsKays.length) return [importPath];
  const imports = pathsKays.map((key) => {
    const keyCleared = key.replace("*", "");
    if (!importPath.includes(keyCleared)) return;
    const importPaths = paths[key];
    return importPaths.map(
      (importPathReplace) => importPath.replace(
        keyCleared,
        ":" + importPathReplace.replace("*", "")
      )
    );
  }).flat().filter((v) => !!v);
  if (!imports.length) return [importPath];
  return imports;
};

// src/rules/independentModules/helpers/validateImport/helpers/validateAll/validateAll.ts
var validateAll = ({
  filename,
  importPath,
  config
}) => {
  const { extensions, pathAliases } = config;
  const projectRoot = getProjectRoot();
  const projectRootWithBaseUrl = getProjectRoot(pathAliases?.baseUrl);
  const importPaths = getImportPaths({
    importPath,
    paths: pathAliases?.paths
  });
  const filenameWithoutProjectRootWithBaseUrl = removeProjectRootFromPath(
    filename,
    projectRootWithBaseUrl
  );
  importPaths.forEach((currentImportPath) => {
    const importPathNonRelative = convertImportPathToNonRelative({
      importPath: currentImportPath,
      filename,
      projectRootWithBaseUrl
    });
    const importPathWithExtension = addExtensionToImportPath({
      importPath: importPathNonRelative,
      projectRootWithBaseUrl,
      extensions,
      projectRoot
    });
    checkImportPath({
      importPath: importPathWithExtension,
      filename: filenameWithoutProjectRootWithBaseUrl,
      config,
      projectRoot
    });
  });
};

// src/rules/independentModules/helpers/validateImport/validateImport.ts
var validateImport = ({
  importPath,
  context: { filename, report },
  node,
  config
}) => {
  try {
    validateAll({
      filename,
      importPath,
      config
    });
  } catch (error) {
    if (!finalErrorGuard(error)) throw error;
    report({
      node,
      messageId: "error",
      data: { error: error.message }
    });
  }
};

// src/rules/independentModules/helpers/handleCallExpression.ts
var handleCallExpression = ({
  config,
  context,
  node
}) => {
  if (node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === "require" && node.arguments[0].type === AST_NODE_TYPES.Literal && typeof node.arguments[0].value === "string" || node.callee.type === AST_NODE_TYPES.MemberExpression && node.callee.object.type === AST_NODE_TYPES.Identifier && node.callee.object.name === "jest" && node.callee.property.type === AST_NODE_TYPES.Identifier && (node.callee.property.name === "mock" || node.callee.property.name === "requireActual") && node.arguments[0].type === AST_NODE_TYPES.Literal && typeof node.arguments[0].value === "string") {
    const importPath = node.arguments[0].value;
    validateImport({ importPath, context, node, config });
  }
};

// src/rules/independentModules/helpers/handleExportNamedDeclaration.ts
var handleExportNamedDeclaration = ({
  config,
  context,
  node
}) => {
  const importPath = node.source?.value;
  if (!importPath) return;
  validateImport({ importPath, context, node, config });
};

// src/rules/independentModules/helpers/handleImportExpression.ts
import { AST_NODE_TYPES as AST_NODE_TYPES2 } from "@typescript-eslint/utils";
var handleImportExpression = ({
  config,
  context,
  node
}) => {
  if (node.source.type !== AST_NODE_TYPES2.Literal || typeof node.source.value !== "string")
    return;
  const importPath = node.source.value;
  validateImport({ importPath, context, node, config });
};

// src/rules/independentModules/independentModules.ts
var independentModules = ESLintUtils3.RuleCreator(
  () => "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bindependent%E2%80%91modules#root"
)({
  name: "independent-modules",
  meta: {
    docs: {
      url: "https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/project%E2%80%91structure-%E2%80%8Bindependent%E2%80%91modules#root",
      description: "A key principle of a healthy project is to prevent the creation of a massive dependency tree, where removing or editing one feature triggers a chain reaction that impacts the entire project. Create independent modules to keep your project scalable and easy to maintain. Get rid of dependencies between modules and create truly independent functionalities."
    },
    type: "problem",
    schema: [{ type: "object", additionalProperties: true }],
    messages: ESLINT_ERRORS2
  },
  defaultOptions: [],
  create(context) {
    const config = getIndependentModulesConfig(context);
    return {
      ImportExpression(node) {
        handleImportExpression({ config, context, node });
      },
      ImportDeclaration(node) {
        validateImport({
          importPath: node.source.value,
          context,
          node,
          config
        });
      },
      ExportNamedDeclaration(node) {
        handleExportNamedDeclaration({ config, context, node });
      },
      CallExpression(node) {
        handleCallExpression({ config, context, node });
      },
      ExportAllDeclaration(node) {
        validateImport({
          importPath: node.source.value,
          context,
          node,
          config
        });
      }
    };
  }
});

// src/index.ts
var projectStructurePlugin = {
  rules: {
    "folder-structure": folderStructure,
    "file-composition": fileComposition,
    "independent-modules": independentModules
  }
};
module.exports = {
  projectStructurePlugin,
  projectStructureParser: parser_default,
  createIndependentModules,
  createFolderStructure,
  createFileComposition,
  // For old eslint config
  rules: {
    "folder-structure": folderStructure,
    "file-composition": fileComposition,
    "independent-modules": independentModules
  }
};
export {
  createFileComposition,
  createFolderStructure,
  createIndependentModules,
  parser as projectStructureParser,
  projectStructurePlugin
};
