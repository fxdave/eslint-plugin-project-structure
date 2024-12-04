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

export { parser as default, parser };
