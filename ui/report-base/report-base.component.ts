import { ChangeDetectorRef } from '@angular/core';
import { map, takeUntil, mergeMap, tap, take } from 'rxjs/operators';
import { Subject, Observable, zip, timer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import {
    MESSAGE_STOP_GENERATION_DESCRIPTION,
    MESSAGE_STOP_GENERATION,
    MIN_DELAY
} from '../../configuration/constants';
import {
    EntitiesBaseService,
    Entity,
    Layout,
    Metric,
    MetricsBaseService,
    Period
} from '@shared/index';
import { DialogService } from 'crumbs_dialog-form';
import { DocumentServiceBase } from '@shared/document/core/document.service.base';
import { IRequestParamReport } from '../../core/request-params/request-param-report.interface';
import { ReportServiceBase } from '../../core/report.service.base';
import { ShopsterRepository } from '../../data/shopster.repository';
import { TranslateBaseService } from 'crumbs_localization-form';
import * as fromFilter from 'retail_query-criteria-selector-form';

/**
 * Базовый компонент для всех типов отчетов
 * Содержит общий функционал
 */
export class ReportBaseComponent {
    protected comparisonEntityListForFilter: fromFilter.Entities;
    protected defaultTimeSampling: fromFilter.TimeSamplingEnum;
    protected destroy$: Subject<boolean>;
    protected entityList: Entity[];
    protected entityListForFilter: fromFilter.Entities;
    protected filterSetting: fromFilter.FilterSettings;
    protected filterStateFromLocalStorage: fromFilter.FilterSelectedParametersStorage.Parameters;
    protected isReportInProgress: boolean;
    protected isValid: boolean;
    protected layout: Layout;
    protected limitOfSelectedTenants: number;
    protected combinedMetricList: Metric[];
    protected focusMetricList: Metric[];
    protected shopsterMetricList: Metric[];
    protected metricListForFilter: fromFilter.Metrics;
    protected periodList: Period[];
    protected selectedComparisonEntityList: Entity[];
    protected selectedEntityList: Entity[];
    protected selectedMetricList: Metric[];
    protected timeSampling: fromFilter.TimeSamplingEnum;
    protected urlSegment: string;
    protected withComparePercentage: boolean;
    protected withDelta: boolean;
    protected shopsterMappingList: string[];
    protected defaultPeriods: Period[];

    constructor(
        protected readonly changeDetectorRef: ChangeDetectorRef,
        protected readonly dialog: DialogService,
        protected readonly documentService: DocumentServiceBase,
        protected readonly filterSelectedParametersStorageService: fromFilter.SelectedParametersStorageBaseService,
        protected readonly metricsService: MetricsBaseService,
        protected readonly reportService: ReportServiceBase,
        protected readonly toastrService: ToastrService,
        protected readonly translateService: TranslateBaseService,
        protected readonly shopsterRepository: ShopsterRepository,
        protected readonly entitiesService: EntitiesBaseService
    ) {
        this.defaultTimeSampling = fromFilter.TimeSamplingEnum.Day;
        this.destroy$ = new Subject<boolean>();
    }

    get IsValid(): boolean {
        return this.isValid;
    }

    get IsReportInProgress(): boolean {
        return this.isReportInProgress;
    }

    get PeriodList(): Period[] {
        return this.periodList;
    }

    get MetricListForFilter(): fromFilter.Metrics {
        return this.metricListForFilter;
    }

    get EntityListForFilter(): fromFilter.Entities {
        return this.entityListForFilter;
    }

    get FilterSetting(): fromFilter.FilterSettings {
        return this.filterSetting;
    }

    /**
     * Принимает значения из фильтра
     * @param filter - результат фильтров
     */
    public onAcceptFilter(filter: fromFilter.Filter): void {
        if (filter.periods) {
            this.periodList = filter.periods;
        }

        if (filter.timeSampling) {
            this.timeSampling = filter.timeSampling;
        }

        if (filter.entity) {
            this.selectedEntityList = _(filter.entity.ids)
                .map(id =>  _.find(this.entityList, entity => entity.Id === id))
                .compact()
                .value();

            this.refreshFilterMetricOptions();
        }

        if (filter.comparisonEntity) {
            this.selectedComparisonEntityList = _(filter.comparisonEntity.ids)
                .map(id =>  _.find(this.entityList, entity => entity.Id === id))
                .compact()
                .value();
        }

        if (filter.metrics) {
            this.selectedMetricList = _.filter(this.combinedMetricList, (metric: Metric) => {
                const search: fromFilter.Metric = _.find(filter.metrics, { value: metric.Type, valueExtension: metric.Field });

                if (search) {
                    return true;
                } else {
                    return false;
                }
            });

            this.refreshFilterEntityOptions();
        }

        this.validate();
        this.saveFilterState();
        this.detectChanges();
    }

    /**
     * Отправка запроса на формирование отчета
     */
    public unloadReport(): void {
        if (!this.isValid || this.isReportInProgress) {
            return;
        }

        this.isReportInProgress = true;

        timer(MIN_DELAY)
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.isReportInProgress = false;
                this.detectChanges();
            });

        const requestParams: IRequestParamReport = this.getRequestParams();

        this.requestReport(requestParams);
    }

    /**
     * Сбросить состояние фильтра
     */
    public resetFilterState(): void {
        this.filterSelectedParametersStorageService.resetByLayoutAndPagePath(this.layout.Id, this.urlSegment);
        this.filterSetting = {
            ...this.filterSetting,
            hideResetButton: true
        };
        this.initFilterStateFromLocalStorage();
        this.selectedEntityList = _.take(this.entityList);
        this.selectedMetricList = _.take(this.combinedMetricList);
        this.timeSampling = this.defaultTimeSampling;
        this.periodList = _.cloneDeep(this.defaultPeriods);
        this.refreshFilterMetricOptions();
        this.refreshFilterEntityOptions();
    }

    /**
     * Инициализация страницы
     */
    protected initPage(): Observable<any> {
        const page$: Observable<any> = this.initLayout()
            .pipe(
                mergeMap(() => {
                    return this.initFilter()
                        .pipe(
                            take(1)
                        );
                })
            );

        return page$;
    }

    /**
     * Инициализация фильтра
     */
    protected initFilter(): Observable<any> {
        this.initFilterStateFromLocalStorage();
        this.initTimeSamplingForFilter();

        const filter$: Observable<any> = zip(
            this.initPeriodList().pipe(
                // tslint:disable-next-line: max-func-body-length
                mergeMap(() => {
                    return zip(
                            this.initEntityList(),
                            this.initShopsterMapping()
                        )
                        .pipe(
                            tap(() => {
                                this.initFilterEntityList();
                            })
                        );
                })
            ),
            this.initMetricList()
                .pipe(
                    tap(() => {
                        this.initFilterMetricList();
                    })
                )
        )
        .pipe(
            tap(() => {
                this.initSelectedEntityList();
                this.initSelectedMetricList();

                this.refreshFilterEntityOptions();
                this.refreshFilterMetricOptions();
            })
        );

        return filter$;
    }

    /**
     * Проверка, все ли параметры готовы для формирования отчета
     */
    protected validate(): void {
        // реализация в дочерних классах
    }

    /**
     * Проверка, все ли параметры готовы для формирования отчета
     */
    protected getRequestParams(): IRequestParamReport {
        // реализация в дочерних классах
        return null;
    }

    /**
     * Инициализация схема размещения
     */
    protected initLayout(): Observable<Layout> {
        const layout$: Observable<Layout> = this.reportService.getCurrentLayout();

        return layout$.pipe(
            map((layout: Layout) => {
                this.layout = layout;

                return layout;
            })
        );
    }

    /**
     * Инициализация списка метрик
     */
    protected initMetricList(): Observable<void> {
        const focusMetricList$: Observable<Metric[]> = this.reportService.getFocusMetricList(this.layout.Id);
        const shopsterMetricList$: Observable<Metric[]> = this.reportService.getShopsterMetricList(this.layout.View);

        return zip(focusMetricList$, shopsterMetricList$).pipe(
            tap((metricList: any) => {
                this.focusMetricList = metricList[0];
                this.shopsterMetricList = metricList[1];
                this.combinedMetricList = _.union(metricList[0], metricList[1]);
            })
        );
    }

    /**
     * Инициализация дискретизации по времени для фильтра
     */
    protected initTimeSamplingForFilter(): void {
        this.timeSampling = this.filterStateFromLocalStorage.timeSampling || this.defaultTimeSampling;
    }

    /**
     * Возвращает список метрик, который хранится в local storage
     */
    protected getMetricListFromLocalStorage(): Metric[] {
        let result: Metric[] = [];

        if (_.get(this.filterStateFromLocalStorage, 'metrics.length')) {
            const storageMetricList: fromFilter.Metric[] = this.filterStateFromLocalStorage.metrics;

            result = _.map(storageMetricList, (storageMetric: fromFilter.Metric) => _.find(
                    this.combinedMetricList,
                    (metric: Metric) => (metric.Type === storageMetric.value) && (metric.Field === storageMetric.valueExtension)
                )
            );

            result = _.compact(result);
        }

        return result;
    }

    /**
     * Инициализация списка метрик для фильтра
     */
    protected initFilterMetricList(): void {
        this.metricListForFilter.list = this.metricsService.mappingMetricsForFilter(this.combinedMetricList);
        this.metricListForFilter = { ...this.metricListForFilter };
    }

    /**
     * Инициализация выбранных метрик
     */
    protected initSelectedMetricList(): void {
        this.selectedMetricList = [];

        const metricListFromLocalStorage: Metric[] = this.getMetricListFromLocalStorage();

        _.forEach(metricListFromLocalStorage, (storageMetric: Metric) => {
            const search: Metric = _.find(this.combinedMetricList, (metric: Metric) => {
                return (metric.Type === storageMetric.Type) && (metric.Field === storageMetric.Field);
            });

            if (search) {
                this.selectedMetricList.push(search);
            }
        });
    }

    /**
     * Добавляет выбранные метрики
     * Делает недоступными метрики неактивные
     */
    protected refreshFilterMetricOptions(): void {
        const disabledMetricList: Metric[] = this.getDisabledMetricList();
        const availableMetricList: Metric[] = _(this.combinedMetricList)
            .union(disabledMetricList)
            .xor(disabledMetricList)
            .valueOf();

        this.selectedMetricList = _.intersection(availableMetricList, this.selectedMetricList);
        const resultSelectedMetricList: Metric[] = _(this.selectedMetricList)
            .union(disabledMetricList)
            .xor(disabledMetricList)
            .valueOf();

        this.metricListForFilter.selected = this.getIndexList(this.combinedMetricList, resultSelectedMetricList);
        this.metricListForFilter.disabled = this.getIndexList(this.combinedMetricList, disabledMetricList);
        this.selectedMetricList = resultSelectedMetricList;

        this.metricListForFilter = { ...this.metricListForFilter };
    }

    /**
     * Инициализация списка сущностей (арендаторы, ...)
     */
    protected initEntityList(): Observable<Entity[]> {
        const entityList$: Observable<Entity[]> = this.reportService.getEntityList(this.periodList, this.layout.Id);

        return entityList$.pipe(
            map((entityList: Entity[]) => {
                this.entityList = entityList;

                return entityList;
            })
        );
    }

    /**
     * Инициализация списка объектов, по которым можно запрашивать метрики Шопстера
     */
    protected initShopsterMapping(): Observable<void> {
        const mapping$: Observable<string[]> = this.shopsterRepository.getMapping(this.layout.Id);

        return mapping$.pipe(
            map((mappingList: string[]) => {
                this.shopsterMappingList = mappingList || [];
            })
        );
    }

    /**
     * Получить состояние фильтра или локального хранилища
     */
    protected getFilterStateFromLocalStorage(): fromFilter.FilterSelectedParametersStorage.Parameters {
        const storageSetting: fromFilter.FilterSelectedParametersStorage.Parameters
            = this.filterSelectedParametersStorageService.getByLayoutAndPagePath(this.layout.Id, this.urlSegment);

        if (!_.isEqual(storageSetting, {})) {
            this.filterSetting = {
                ...this.filterSetting,
                hideResetButton: true
            };
        }

        const result: fromFilter.FilterSelectedParametersStorage.Parameters = {
            periods: _.get(storageSetting, 'periods'),
            entitiesIds: _.get(storageSetting, 'entitiesIds'),
            metrics: _.get(storageSetting, 'metrics'),
            timeSampling: _.get(storageSetting, 'timeSampling'),
            comparisonEntitiesIds: _.get(storageSetting, 'comparisonEntitiesIds')
        };

        return result;
    }

    /**
     * Сохраняет параметры фильтра
     */
    protected saveFilterState(): void {
        this.setFilterStateToLocalStorage();

        this.filterSetting = {
            ...this.filterSetting,
            hideResetButton: true
        };
    }

    /**
     * Сохраняет параметры фильра в local storage
     */
    protected setFilterStateToLocalStorage(): void {
        const parameters: fromFilter.FilterSelectedParametersStorage.Parameters = {
            periods: this.periodList,
            entitiesIds: _.map(this.selectedEntityList, entity => entity.Id),
            metrics: this.metricsService.mappingMetricsForFilter(this.selectedMetricList),
            timeSampling: this.timeSampling,
            comparisonEntitiesIds: _.map(this.selectedComparisonEntityList, entity => entity.Id)
        };

        this.filterSelectedParametersStorageService.updateConfigForLayoutAndPagePath(
            this.layout.Id,
            this.urlSegment,
            parameters
        );
    }

    /**
     * Отправка запроса на формирование отчета
     * @param requestParams - параметры запроса
     */
    protected requestReport(requestParams: IRequestParamReport): void {
        this.reportService.getReport(requestParams);
    }

    /**
     * Метод загрузки файла с отчетом
     */
    protected downlodReport(content: Blob, fileName: string): void {
        this.documentService.save(content, fileName);
    }

    /**
     * Вызывается при переходе на другие страницы
     */
    protected confirmStopReportGeneration(): Observable<boolean> {
        const title: string = this.translateService.get(MESSAGE_STOP_GENERATION);
        const description: string = this.translateService.get(MESSAGE_STOP_GENERATION_DESCRIPTION);

        return this.dialog.confirm(title, description);
    }

    /**
     * Очищает все данные
     */
    protected clear(): void {
        this.entityList = [];
        this.isReportInProgress = false;
        this.combinedMetricList = [];
        this.focusMetricList = [];
        this.shopsterMetricList = [];
        this.periodList = [];
        this.selectedComparisonEntityList = [];
        this.selectedEntityList = [];
        this.withComparePercentage = true;
        this.withDelta = true;
        this.selectedMetricList = [];

        this.metricListForFilter = {
            list: [],
            selected: [],
            disabled: []
        };

        this.entityListForFilter = {
            list: [],
            selected: [],
            disabled: [],
            average: false
        };

        this.comparisonEntityListForFilter = {
            list: [],
            selected: [],
            average: false
        };
    }

    /**
     * Вызывается при уничтожение дочернего компонента
     */
    protected destroy(): void {
        this.clear();
        this.destroy$.next(true);
        this.destroy$.complete();
    }

    /**
     * Перерисовывает страницу
     */
    protected detectChanges(): void {
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Возвращет порядковые индексы выбранных метрик
     */
    // private getSelectedMetricIndices(): number[] {
    //     const selectedMetricIndices: number[] = _.map(this.selectedMetricList, (selected: Metric) => _.findIndex(
    //             this.combinedMetricList,
    //             (metric: Metric) => {
    //                 return metric.Type === selected.Type && metric.Field === selected.Field;
    //             }
    //         )
    //     );

    //     return selectedMetricIndices;
    // }

    /**
     * Возвращет метрики, которые неактивны
     */
    private getDisabledMetricList(): Metric[] {
        if (!this.isAllSelectedEntityMappedWithShopster()) {
            return this.shopsterMetricList;
        }

        return [];
    }

    /**
     * Возвращет порядковые индексы метрик Шопстера
     */
    private getShopsterMetricIndeces(): number[] {
        const indeces: number[] = _(this.shopsterMetricList)
            .map((metric: Metric) => {
                return this.getIndex(this.combinedMetricList, metric);
            })
            .valueOf();

        return indeces;
    }

    /**
     * Возвращет список индексов элементов списка
     * @param elementList - список всех элементов по которому осуществляется поиск
     * @param searchElementList - искомые элементы
     */
    private getIndexList(elementList: any, searchElementList: any): number[] {
        const indexList: number[] = _.map(searchElementList, (search: any) => this.getIndex(elementList, search));

        return indexList;
    }

    /**
     * Возвращет порядковый индекс элемента списка
     * @param elementList - список всех элементов по которому осуществляется поиск
     * @param searchElement - искомый элемент
     */
    private getIndex(elementList: any, searchElement: any): number {
        return _.findIndex(
            elementList,
            (item: any) => {
                return item === searchElement;
            }
        );
    }

    /**
     * Возвращет порядковые индексы неактивных метрик
     */
    private isAllSelectedEntityMappedWithShopster(): boolean {
        if (!this.selectedEntityList.length) {
            return true;
        }

        if (!this.shopsterMappingList.length) {
            return false;
        }

        const ids: string[] = _.map(this.selectedEntityList, item => item.Id);
        const mapping: string[] = this.shopsterMappingList;
        const intersections: string[] = _.intersection(ids, mapping);
        const isAllMapped: boolean = intersections.length === ids.length;

        return isAllMapped;
    }

    /**
     * Возвращет порядковые индексы неактивных метрик
     */
    private isAnySelectedMetricIsShopsters(): boolean {
        if (!this.selectedMetricList.length) {
            return false;
        }

        const combined: Metric[] = _.union(this.focusMetricList, this.selectedMetricList);

        return combined.length !== this.focusMetricList.length;
    }

    /**
     * Инициализация сохраненных параметров фильтра
     */
    private initFilterStateFromLocalStorage(): void {
        this.filterStateFromLocalStorage = this.getFilterStateFromLocalStorage();
    }

    /**
     * Инициализация списка периодов
     */
    private initPeriodList(): Observable<Period[]> {
        const periodList$: Observable<Period[]> = this.reportService.getPeriodList();

        return periodList$.pipe(
            map((periodList: Period[]) => {
                this.defaultPeriods = _.take(periodList);

                if (!_.isUndefined(this.filterStateFromLocalStorage.periods)) {
                    this.periodList = this.filterStateFromLocalStorage.periods;
                } else {
                    this.periodList = _.take(periodList);
                }

                return periodList;
            })
        );
    }

    /**
     * Инициализация выбранных сущностей
     */
    private initSelectedEntityList(): void {
        const entityListFromLocalStorage: Entity[] = this.getEntityListFromLocalStorage();

        this.selectedEntityList = [];

        _.forEach(entityListFromLocalStorage, (storageEntity: Entity) => {
            const search: Entity = _.find(this.entityList, { Id: storageEntity.Id });

            if (search) {
                this.selectedEntityList.push(search);
            }
        });
    }

    /**
     * Инициализация списка сущностей для фильтра
     */
    private initFilterEntityList(): void {
        this.entityListForFilter.list = this.entitiesService.mappingEntitiesForFilter(this.entityList);
    }

    /**
     * Обновляет список сущностей фильтра
     */
    private refreshFilterEntityOptions(): void {
        let filterSelectedIds: string[] = [];
        let filterDisabledIds: string[] = [];

        const selectedIds: string[] = _.map(this.selectedEntityList, (item: Entity) => item.Id);
        const allIds: string[] = _.map(this.entityList, (item: Entity) => item.Id);

        if (this.isAnySelectedMetricIsShopsters()) {
            filterSelectedIds = _.intersection(selectedIds, this.shopsterMappingList);
            filterDisabledIds = _(allIds)
                .union(this.shopsterMappingList)
                .xor(this.shopsterMappingList)
                .valueOf();
        } else {
            filterSelectedIds = selectedIds;
        }

        this.entityListForFilter.selected = filterSelectedIds;
        this.entityListForFilter.disabled = filterDisabledIds;
        this.entityListForFilter = { ...this.entityListForFilter };
    }

    /**
     * Возвращает список сущностей, который хранится в local storage
     */
    private getEntityListFromLocalStorage(): Entity[] {
        let result: Entity[] = [];

        if (_.get(this.filterStateFromLocalStorage, 'entitiesIds.length')) {
            result = _.filter(
                this.entityList,
                entity => _.some(this.filterStateFromLocalStorage.entitiesIds, id => id === entity.Id)
            );
        }

        return result;
    }
}