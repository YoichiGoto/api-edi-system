interface MappingField {
    appField: string;
    ediField: string;
    ediId?: string;
    required: boolean;
    dataType?: string;
    description?: string;
}
interface MappingTable {
    sheetName: string;
    messageType: string;
    fields: MappingField[];
}
/**
 * 付表３（マッピング表）をJSONに変換
 */
declare function convertMappingTable(excelPath: string, outputDir: string): void;
export { convertMappingTable, MappingField, MappingTable };
//# sourceMappingURL=mapping-converter.d.ts.map