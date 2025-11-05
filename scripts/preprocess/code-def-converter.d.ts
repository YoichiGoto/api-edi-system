interface CodeValue {
    code: string;
    codeName: string;
    codeNameEn?: string;
    description?: string;
    internationalCode?: string;
    internationalCodeName?: string;
    category?: string;
}
interface CodeDefinition {
    codeType: string;
    sheetName: string;
    codes: CodeValue[];
}
/**
 * 付表４（識別コード定義表）をJSONに変換
 */
declare function convertCodeDefinitionTable(excelPath: string, outputDir: string): void;
export { convertCodeDefinitionTable, CodeValue, CodeDefinition };
//# sourceMappingURL=code-def-converter.d.ts.map