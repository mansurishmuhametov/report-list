import { ReportTemplate } from '../../configuration/report-template.enum';
import { Period } from '@shared/index';

/**
 * Обязательные параметры для формирования разных типов отчетов
 */
export interface IRequestParamReport {
    /**
     * Шаблон отчета
     */
    readonly TemplateId: ReportTemplate;
    /**
     * ID схемы размещения
     */
    readonly LayoutId: string;
    /**
     * С какой, по какую дату формировать отчет
     */
    readonly Period: Period;
    /**
     * Объединяет все поля в один объект
     * Результирующий объект это и есть параметры запроса
     */
    readonly Combined: any;
}