import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { map, takeUntil, mergeMap, take, tap } from 'rxjs/operators';
import { Observable, zip } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import {
    EntitiesBaseService,
    Entity,
    Metric,
    MetricsBaseService,
    Period
} from '@shared/index';
import { DialogService } from 'crumbs_dialog-form';
import { DocumentServiceBase } from '@shared/document/core/document.service.base';
import { IRequestParamReport } from '../../core/request-params/request-param-report.interface';
import { ReportBaseComponent } from '../report-base/report-base.component';
import { ReportServiceBase } from '../../core/report.service.base';
import { RequestParamReportComparison } from '../../core/request-params/request-param-report-comparison';
import { RequestParamsEntity } from '../../core/request-params/request-params-entity';
import { RequestParamServiceBase } from '../../core/request-params/request-param.service.base';
import { RequestParamsMetric } from '../../core/request-params/request-params-metric';
import { Sampling } from '@shared/query-execution-engine/core/queries';
import { ShopsterRepository } from '../../data/shopster.repository';
import { TranslateBaseService } from 'crumbs_localization-form';
import * as fromFilter from 'retail_query-criteria-selector-form';

/**
 * Тип отчета "Сравнение"
 */
@Component({
    selector: 'crumbs_report-comparison-form',
    templateUrl: './report-comparison.component.html',
    styleUrls: ['./report-comparison.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportComparisonComponent extends ReportBaseComponent implements OnInit, OnDestroy {
    private filterEntityList: fromFilter.Entities;

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

        this.clear();
        this.initFilterSettings();
    }

    get FilterEntityList(): fromFilter.Entities {
        return this.filterEntityList;
    }

    get WithComparePercentage(): boolean {
        return this.withComparePercentage;
    }

    get WithDelta(): boolean {
        return this.withDelta;
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
                this.changeDetectorRef.detectChanges();
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
     * Добавить в отчет значение дельта
     */
    public selectDelta(): void {
        this.withDelta = !this.withDelta;
    }

    /**
     * Добавить в отчет значение 'сравнение в процентах'
     */
    public selectComparePercentage(): void {
        this.withComparePercentage = !this.withComparePercentage;
    }

    /**
     * Проверка, все ли параметры готовы для формирования отчета
     */
    protected validate(): void {
        this.isValid = (this.periodList.length > 0) &&
            (this.timeSampling !== null) &&
            (this.selectedEntityList.length) > 0 &&
            (this.selectedMetricList.length > 0);
    }

    /**
     * Возвращает параметры необходимые для формировани отчета
     */
    protected getRequestParams(): IRequestParamReport {
        const firstPeriod: Period = _.head(this.periodList);
        const mainPeriod: Period = this.requestParamService.convertPeriod(firstPeriod);
        const secondPeriod: Period = this.periodList[1];
        const comparisonPeriod: Period = this.requestParamService.convertPeriod(secondPeriod);
        const samplingUnit: Sampling.Units = this.timeSampling.toString() as Sampling.Units;
        const requestParamsMetric: RequestParamsMetric = new RequestParamsMetric(this.selectedMetricList);
        const requestParamsEntity: RequestParamsEntity = new RequestParamsEntity(this.selectedEntityList);

        const requestParams: RequestParamReportComparison = new RequestParamReportComparison(
            this.layout.Id,
            mainPeriod,
            requestParamsMetric,
            requestParamsEntity,
            samplingUnit,
            comparisonPeriod,
            this.withComparePercentage,
            this.withDelta
        );

        return requestParams;
    }

    /**
     * Инициализация настроек фильтра
     */
    private initFilterSettings(): void {
        this.filterSetting = {
            hideEntityAverage: true,
            maxSelectedEntityCount: this.limitOfSelectedTenants,
            showWeekNumbers: true,
            hideResetButton: true,
            maxPeriodsCount: 2,
            hideComparePeriodAverage: true,
            elements: [
                fromFilter.FilterElementType.Period,
                fromFilter.FilterElementType.TimeSampling,
                fromFilter.FilterElementType.Entity,
                fromFilter.FilterElementType.Metric
            ],
            timeSamplingList: [
                fromFilter.TimeSamplingEnum.Hour,
                fromFilter.TimeSamplingEnum.Day,
                fromFilter.TimeSamplingEnum.Week,
                fromFilter.TimeSamplingEnum.Month,
                fromFilter.TimeSamplingEnum.Year
            ],
            timeSamplingSelected: this.timeSampling,
            mainPeriodForm: {
                dropdownSize: 'sm'
            },
            timeSamplingFilterForm: {
                dropdownSize: 'contain'
            },
            entityFilterForm: {
                dropdownSize: 'lg'
            },
            comparePeriodsForm: {
                dropdownSize: 'auto'
            },
            isHideSelectedEntities: true,
            isEntityGroupSelection: true
        };
    }
}