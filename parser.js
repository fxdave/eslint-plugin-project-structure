"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/parser.ts
var parser_exports = {};
__export(parser_exports, {
  default: () => parser_default,
  parser: () => parser
});
module.exports = __toCommonJS(parser_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parser
});
