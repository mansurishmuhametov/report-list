import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { pluck, skipWhile, map, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import {
    EntitiesBaseService,
    Entity,
    Layout,
    LayoutView,
    Metric,
    MetricsBaseService,
    MetricType,
    Period,
    PeriodsBaseService
} from '@shared/index';
import { DATE_FORMAT } from '../configuration/constants';
import { IRequestParamReport } from './request-params/request-param-report.interface';
import { MetricStorage } from './metric.storage';
import { ReportRepository } from '@modules/report-list/data/report.repository';
import { ReportServiceBase } from './report.service.base';
import { ShopsterRepository } from '../data/shopster.repository';
import { TranslateBaseService } from 'crumbs_localization-form';
import * as fromStore from '@shared/store';

const LAYOUT: string = 'layout';
const NO_NAME: string = 'missing.name';

/**
 * Сервис отчетов
 */
@Injectable()
export class ReportService implements ReportServiceBase {
    constructor(
        private readonly commonSettingsStore: Store<fromStore.ICommonSettingsState>,
        private readonly entitiesService: EntitiesBaseService,
        private readonly metricsService: MetricsBaseService,
        private readonly periodsService: PeriodsBaseService,
        private readonly reportRepository: ReportRepository,
        private readonly shopsterRepository: ShopsterRepository,
        private readonly translateService: TranslateBaseService,
        private readonly metricStorage: MetricStorage
    ) {}

    /**
    * Отправка запроса на сервер для формирования отчета
    * @param reportParams - параметры отчета
    */
    public getReport(reportParams: IRequestParamReport): void {
        this.reportRepository.get(reportParams);
    }

    /**
     * Возвращает параметры текущей схемы размещения (id, title, ...)
     */
    public getCurrentLayout(): Observable<Layout> {
        const noName: string = this.translateService.get(NO_NAME);
        const commonSettings$: Observable<fromStore.ICommonSettingsState> = this.commonSettingsStore.select(fromStore.getCommonSettings);

        return commonSettings$
            .pipe(
                pluck(LAYOUT),
                skipWhile((layout: fromStore.ILayout) => {
                    return _.isEmpty(layout.id);
                }),
                map((layout: fromStore.ILayout) => {
                    const result: Layout = {
                        Id: layout.id,
                        View: layout.type as LayoutView,
                        Title: layout.name || noName
                    };

                    return result;
                })
            );
    }

    /**
     * Возвращает список всех сущностей
     * @param periodList - список периодов
     * @param layoutId - ID схемы размещения
     */
    public getEntityList(periodList: Period[], layoutId: string): Observable<Entity[]> {
        const from: string = periodList[0].from.format(DATE_FORMAT);
        const to: string = periodList[0].to.format(DATE_FORMAT);

        const entityList$: Observable<Entity[]> = this.entitiesService.getEntities(layoutId, from, to, true)
            .pipe(
                map((entityList: Entity[]) => {
                    return entityList;
                })
            );

        return entityList$;
    }

    /**
     * Возвращает список периодов
     */
    public getPeriodList(): Observable<Period[]> {
        const periodList: Period[] = this.periodsService.getDefaultPeriods();

        return of(periodList);
    }

    /**
     * Возвращает список доступных метрик системы Focus
     * @param layoutId - ID схемы размещения
     */
    public getFocusMetricList(layoutId: string): Observable<Metric[]> {
        const storageMetricList: Metric[] = this.metricStorage.get(layoutId);

        if (storageMetricList) {
            return of(storageMetricList);
        }

        const metricList$: Observable<Metric[]> = this.metricsService.getMetrics(layoutId)
            .pipe(
                map((typeList: MetricType[]) => {
                    const additionalMetricList: MetricType[] = this.metricsService.getCalculatedMetrics(typeList);
                    const combinedTypeList: MetricType[] = _.union(typeList, additionalMetricList);
                    const metricList: Metric[] = this.convertToMetricList(combinedTypeList);

                    return metricList;
                }),
                tap((metricList: Metric[]) => {
                    this.metricStorage.set(layoutId, metricList);
                })
            );

        return metricList$;
    }

    /**
     * Возвращает список метрик системы Shopster
     * @param layoutView - mall или retail
     */
    public getShopsterMetricList(layoutView: string): Observable<Metric[]> {
        const metricTypeList: MetricType[] = this.metricsService.getShopsterMetricByLayoutView(layoutView);
        const metricList: Metric[] = this.convertToMetricList(metricTypeList);

        return of(metricList);
    }

    /**
     * Метод получения идентификаторов сущностей, для которыйх есть маппинг с id shopster
     * @param layoutId - Идентификатор семы размещения
     */
    public getShopsterMapping(layoutId: string): Observable<string[]> {
        return this.shopsterRepository.getMapping(layoutId);
    }

    /**
     * Преобразует типы метрик в список объектов Метрика
     * @param typeList - доступные типы метрик
     */
    private convertToMetricList(typeList: MetricType[]): Metric[] {
        return _(typeList)
            .map((metric: MetricType) => this.metricsService.getMetricsByType(metric))
            .flatten()
            .value();
    }
}