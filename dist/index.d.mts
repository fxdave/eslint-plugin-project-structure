import * as _typescript_eslint_utils_dist_ts_eslint from '@typescript-eslint/utils/dist/ts-eslint';

type RegexParameters = Record<string, string>;
type Pattern = string | (string | string[])[];

type ImportPattern = string | string[];
interface Module {
    name: string;
    pattern: Pattern;
    errorMessage?: string;
    allowImportsFrom: ImportPattern[];
    allowExternalImports?: boolean;
}
type Paths = Record<string, string[]>;
interface PathAliases {
    baseUrl: string;
    paths: Paths;
}
interface IndependentModulesConfig {
    tsconfigPath?: string;
    pathAliases?: PathAliases;
    extensions?: string[];
    reusableImportPatterns?: Record<string, ImportPattern[]>;
    modules: Module[];
    debugMode?: boolean;
}

type SelectorType = "class" | "variable" | "variableExpression" | "propertyDefinition" | "function" | "arrowFunction" | "type" | "interface" | "enum";
interface VariableExpression {
    type: "variableExpression";
    limitTo: string | string[];
}
type Selector = SelectorType | VariableExpression;
type ScopeAll = "fileExport" | "fileRoot" | "nestedSelectors" | "file";
interface PositionIndex {
    index: number;
    sorting?: "az" | "none";
}
interface Rule$1 {
    selector: Selector | Selector[];
    scope?: ScopeAll | ScopeAll[];
    positionIndex?: number | PositionIndex;
    filenamePartsToRemove?: string | string[];
    format?: string[] | string;
}
type CustomErrors = Partial<Record<SelectorType, string>>;
interface RootSelectorLimit {
    selector: SelectorType | SelectorType[];
    limit: number;
}
interface AllowOnlySpecifiedSelectors {
    error?: CustomErrors;
    fileRoot?: boolean | CustomErrors;
    fileExport?: boolean | CustomErrors;
    nestedSelectors?: boolean | CustomErrors;
}
interface FileRules {
    filePattern: Pattern;
    allowOnlySpecifiedSelectors?: AllowOnlySpecifiedSelectors | boolean;
    rootSelectorsLimits?: RootSelectorLimit[];
    rules?: Rule$1[];
}
interface FileCompositionConfig {
    projectRoot?: string;
    regexParameters?: RegexParameters;
    filesRules: FileRules[];
}

interface Rule<T extends string = string> {
    ruleId?: T;
    name?: string;
    enforceExistence?: string[] | string;
    children?: Rule<T>[];
}
interface FolderRecursionRule<T extends string = string> extends Rule<T> {
    folderRecursionLimit?: number;
}
interface LongPathsInfo {
    maxLength?: number;
    root?: string;
    countFromSystemRoot?: boolean;
    mode: "warn" | "error";
}
interface FolderStructureConfig<T extends string = string> {
    ignorePatterns?: Pattern;
    longPathsInfo?: LongPathsInfo | false;
    structureRoot?: string;
    projectRoot?: string;
    structure: Rule<T> | Rule<T>[];
    rules?: Record<T, FolderRecursionRule<T>>;
    regexParameters?: RegexParameters;
}

interface ParserReturn {
    ast: {
        type: string;
        start: number;
        end: number;
        loc: {
            start: {
                line: number;
                column: number;
            };
            end: {
                line: number;
                column: number;
            };
        };
        tokens: never[];
        comments: never[];
        range: number[];
        sourceType: string;
        body: never[];
    };
    scopeManager: null;
    visitorKeys: null;
}
interface ParserProps {
    meta: {
        name: string;
    };
    parseForESLint: () => ParserReturn;
}
declare const parser: ParserProps;

declare const createIndependentModules: (config: IndependentModulesConfig) => IndependentModulesConfig;

declare const createFolderStructure: <R extends Record<string, FolderRecursionRule<keyof R & string>>>(config: {
    longPathsInfo?: LongPathsInfo | false;
    structureRoot?: string;
    projectRoot?: string;
    structure: Rule<keyof R & string> | Rule<keyof R & string>[];
    rules?: R;
    ignorePatterns?: Pattern;
    regexParameters?: RegexParameters;
}) => FolderStructureConfig<keyof R & string>;

declare const createFileComposition: (config: FileCompositionConfig) => FileCompositionConfig;

declare const projectStructurePlugin: {
    rules: {
        "folder-structure": _typescript_eslint_utils_dist_ts_eslint.RuleModule<"error", [FolderStructureConfig<string>] | [], unknown, _typescript_eslint_utils_dist_ts_eslint.RuleListener>;
        "file-composition": _typescript_eslint_utils_dist_ts_eslint.RuleModule<"invalidName" | "invalidPosition" | "prohibitedSelectorRoot" | "prohibitedSelectorNested" | "prohibitedSelectorExport" | "rootSelectorsLimits", [] | [FileCompositionConfig], unknown, _typescript_eslint_utils_dist_ts_eslint.RuleListener>;
        "independent-modules": _typescript_eslint_utils_dist_ts_eslint.RuleModule<"error", [] | [IndependentModulesConfig], unknown, _typescript_eslint_utils_dist_ts_eslint.RuleListener>;
    };
};

export { createFileComposition, createFolderStructure, createIndependentModules, parser as projectStructureParser, projectStructurePlugin };
