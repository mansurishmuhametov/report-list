import { Observable } from 'rxjs';

import { IRequestParamReport } from './request-params/request-param-report.interface';
import {
    Entity,
    Layout,
    Metric,
    Period
} from '@shared/index';

/**
 * Определяет интерфейс сервиса "Отчеты"
 */
export abstract class ReportServiceBase {
    /**
    * Отправка запроса на сервер для формирования отчета
    */
    public abstract getReport(reportParams: IRequestParamReport): void;

    /**
     * Возвращает параметры текущей схемы размещения (id, title, ...)
     */
    public abstract getCurrentLayout(): Observable<Layout>;

    /**
     * Возвращает список всех сущностей
     * @param periodList - список периодов
     * @param layoutId - ID схемы размещения
     */
    public abstract getEntityList(periodList: Period[], layoutId: string): Observable<Entity[]>;

    /**
     * Возвращает список периодов
     */
    public abstract getPeriodList(): Observable<Period[]>;

    /**
     * Возвращает список доступных метрик системы Focus
     * @param layoutId - ID схемы размещения
     */
    public abstract getFocusMetricList(layoutId: string): Observable<Metric[]>;

    /**
     * Возвращает список метрик системы Shopster
     * @param layoutView - mall или retail
     */
    public abstract getShopsterMetricList(layoutView: string): Observable<Metric[]>;
}
