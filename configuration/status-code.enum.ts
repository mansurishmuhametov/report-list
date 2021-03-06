/**
 * Возможные статусы ответов при формирование отчетов
 */
export enum ReportStatusCode {
    /**
     * Процесс формирования отчета успешно запущен
     * Процесс не закончен
     */
    Accepted = '202',

    /**
     * Отчет готов
     */
    Completed = '303',

    /**
     * Отчет в процессе формирования
     */
    InProgress = '200'
}
