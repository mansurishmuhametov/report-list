/**
 * Сформированный отчет
 */
export class ReportResponseDto {
    constructor(
        private content: Blob,
        private fileName: string
    ) {}

    get Content(): Blob {
        return this.content;
    }

    get FileName(): string {
        return this.fileName;
    }
}