import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { map, takeUntil, mergeMap, take, tap } from 'rxjs/operators';
import { Observable, zip } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import {
    EntitiesBaseService,
    Entity,
    MetricsBaseService,
    Period
} from '@shared/index';
import { DialogService } from 'crumbs_dialog-form';
import { DocumentServiceBase } from '@shared/document/core/document.service.base';
import { IRequestParamReport } from '../../core/request-params/request-param-report.interface';
import { ReportBaseComponent } from '../report-base/report-base.component';
import { ReportServiceBase } from '../../core/report.service.base';
import { RequestParamReportIntersection } from '../../core/request-params/request-param-report-intersection';
import { RequestParamsEntity } from '../../core/request-params/request-params-entity';
import { RequestParamServiceBase } from '../../core/request-params/request-param.service.base';
import { RequestParamsMainEntity } from '../../core/request-params/request-params-main-entity';
import { ShopsterRepository } from '../../data/shopster.repository';
import { TranslateBaseService } from 'crumbs_localization-form';
import * as fromFilter from 'retail_query-criteria-selector-form';

/**
 * Тип отчета "Пересечения"
 */
@Component({
    templateUrl: './report-intersection.component.html',
    styleUrls: ['./report-intersection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportIntersectionComponent extends ReportBaseComponent implements OnInit, OnDestroy {
    private availableEntityTypeList: string[];
    private comparisonEntityList: Entity[];
    private filterEntityList: fromFilter.Entities;
    private limitOfComparisonTenants: number;

    // tslint:disable-next-line: max-func-body-length
    constructor(
        protected readonly entitiesService: EntitiesBaseService,
        private readonly requestParamService: RequestParamServiceBase,
        private readonly router: Router,
        protected readonly changeDetectorRef: ChangeDetectorRef,
        protected readonly dialog: DialogService,
        protected readonly documentService: DocumentServiceBase,
        protected readonly filterSelectedParametersStorageService: fromFilter.SelectedParametersStorageBaseService,
        protected readonly metricsService: MetricsBaseService,
        protected readonly reportService: ReportServiceBase,
        protected readonly shopsterRepository: ShopsterRepository,
        protected readonly toastrService: ToastrService,
        protected readonly translateService: TranslateBaseService
    ) {
        super(
            changeDetectorRef,
            dialog,
            documentService,
            filterSelectedParametersStorageService,
            metricsService,
            reportService,
            toastrService,
            translateService,
            shopsterRepository,
            entitiesService
        );

        this.limitOfSelectedTenants = 5;
        this.availableEntityTypeList = ['tenant', 'zone', 'perimeter'];

        this.clear();
        this.initFilterSettings();
    }

    get ComparisonEntityListForFilter(): fromFilter.Entities {
        return this.comparisonEntityListForFilter;
    }

    get FilterEntityList(): fromFilter.Entities {
        return this.filterEntityList;
    }

    /**
     * Инициализация
     */
    public ngOnInit(): void {
        this.urlSegment = this.router.url.slice(1);

        this.initPage()
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.validate();
                this.detectChanges();
            });
    }

    /**
     * Уничтожение
     */
    public ngOnDestroy(): void {
        this.destroy();
    }

    /**
     * Отправка запроса на формирование отчета
     */
    public unloadReport(): void {
        if (!this.isValid || this.isReportInProgress) {
            return;
        }

        const requestParams: IRequestParamReport = this.getRequestParams();

        this.requestReport(requestParams);
    }

    /**
     * Проверка, все ли параметры готовы для формирования отчета
     */
    protected validate(): void {
        this.isValid = (this.periodList.length > 0) &&
            (this.selectedEntityList.length) > 0 &&
            (this.selectedComparisonEntityList.length > 0);
    }

    /**
     * Возвращает параметры необходимые для формировани отчета
     */
    protected getRequestParams(): RequestParamReportIntersection {
        const firstPeriod: Period = _.head(this.periodList);
        const mainPeriod: Period = this.requestParamService.convertPeriod(firstPeriod);
        const requestParamsEntity: RequestParamsEntity = new RequestParamsEntity(this.selectedComparisonEntityList);
        const requestParamsMainEntity: RequestParamsMainEntity = new RequestParamsMainEntity(this.selectedEntityList);

        const requestParams: RequestParamReportIntersection = new RequestParamReportIntersection(
            this.layout.Id,
            mainPeriod,
            requestParamsEntity,
            requestParamsMainEntity
        );

        return requestParams;
    }

    /**
     * Инициализация фильтра
     */
    // private initFilter(): Observable<any> {
    //     this.initFilterStateFromLocalStorage();
    //     this.initTimeSamplingForFilter();

    //     const filter$: Observable<any> = zip(
    //         this.initPeriodList().pipe(
    //             // tslint:disable-next-line: max-func-body-length
    //             mergeMap(() => {
    //                 return zip(
    //                         this.initEntityList(),
    //                         this.initShopsterMapping()
    //                     )
    //                     .pipe(
    //                         tap(() => {
    //                             this.filterEntityListForIntersection();
    //                             this.initSelectedEntityList();
    //                             this.initSelectedComparisonEntityList();
    //                             this.initEntityListForFilter();
    //                             this.initComparisonEntityListForFilter();
    //                         })
    //                     );
    //             })
    //         ),
    //         this.initMetricList().pipe(
    //             tap(() => {
    //                 this.initSelectedMetricList();
    //                 this.refreshFilterMetricList();
    //             })
    //         )
    //     );

    //     return filter$;
    // }

    /**
     * Инициализация выбранных сущностей для сравнения
     */
    private initSelectedComparisonEntityList(): void {
        const entityListFromLocalStorage: Entity[] = this.getComparisonEntityListFromLocalStorage();
        const defaultSelected: Entity = _.head(this.comparisonEntityList);
        const selected: Entity[] = entityListFromLocalStorage.length ? entityListFromLocalStorage : [];

        if (!selected.length && defaultSelected) {
            selected.push(defaultSelected);
        }

        this.selectedComparisonEntityList = selected;
    }

    /**
     * Инициализация выбранных сущностей для сравнения
     */
    private getComparisonEntityListFromLocalStorage(): Entity[] {
        let result: Entity[] = [];

        if (_.get(this.filterStateFromLocalStorage, 'comparisonEntitiesIds.length')) {
            result = _.filter(
                this.comparisonEntityList,
                entity => _.some(this.filterStateFromLocalStorage.comparisonEntitiesIds, id => id === entity.Id)
            );
        }

        return result;
    }

    /**
     * Фильтр сущностей по которым можно сформировать отчет
     */
    private filterEntityListForIntersection(): void {
        this.entityList = this.filterEntityByAvailbaleTypes();
        this.entityList = this.filterEntityByShopsterMapping();

    }

    /**
     * Фильтрация по типам сущностей: арендаторы, зоны, периметр
     */
    private filterEntityByAvailbaleTypes(): Entity[] {
        const result: Entity[] = _.filter(this.entityList, (entity: Entity) => {
            return _.includes(this.availableEntityTypeList, entity.Type);
        });

        return result;
    }

    /**
     * Фильтрация: если для сущности есть mapping shopster
     */
    private filterEntityByShopsterMapping(): Entity[] {
        const result: Entity[] = _.filter(this.entityList, (entity: Entity) => {
            return _.includes(this.shopsterMappingList, entity.Id);
        });

        return result;
    }

    /**
     * Инициализация списка сущностей для сравнения
     */
    private initComparisonEntityListForFilter(): void {
        this.comparisonEntityListForFilter = {
            average: false,
            selected: _.map(this.selectedComparisonEntityList, (item: Entity) => item.Id),
            list: this.entitiesService.mappingEntitiesForFilter(this.entityList)
        };
    }

    /**
     * Инициализация настроек фильтра
     */
    private initFilterSettings(): void {
        this.filterSetting = {
            hideEntityAverage: true,
            maxSelectedEntityCount: this.limitOfSelectedTenants,
            maxSelectedComparisonEntityCount: this.limitOfComparisonTenants,
            showWeekNumbers: true,
            hideResetButton: true,
            maxPeriodsCount: 1,
            elements: [
                fromFilter.FilterElementType.Period,
                fromFilter.FilterElementType.Entity,
                fromFilter.FilterElementType.ComparisonEntity
            ],
            isHideSelectedEntities: true,
            isHideSelectedComparisonEntities: true,
            isEntityGroupSelection: true,
            isComparisonEntityGroupSelection: true
        };
    }
}