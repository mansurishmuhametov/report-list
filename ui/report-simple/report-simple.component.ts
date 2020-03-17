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
import { RequestParamReportSimple } from '../../core/request-params/request-param-report-simple';
import { RequestParamsEntity } from '../../core/request-params/request-params-entity';
import { RequestParamServiceBase } from '../../core/request-params/request-param.service.base';
import { RequestParamsMetric } from '../../core/request-params/request-params-metric';
import { Sampling } from '@shared/query-execution-engine/core/queries';
import { ShopsterRepository } from '../../data/shopster.repository';
import { TranslateBaseService } from 'crumbs_localization-form';
import * as fromFilter from 'retail_query-criteria-selector-form';

/**
 * Тип отчета "Простой"
 */
@Component({
    templateUrl: './report-simple.component.html',
    styleUrls: ['./report-simple.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportSimpleComponent extends ReportBaseComponent implements OnInit, OnDestroy {
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
        const samplingUnit: Sampling.Units = this.timeSampling.toString() as Sampling.Units;
        const requestParamsMetric: RequestParamsMetric = new RequestParamsMetric(this.selectedMetricList);
        const requestParamsEntity: RequestParamsEntity = new RequestParamsEntity(this.selectedEntityList);

        const requestParams: RequestParamReportSimple = new RequestParamReportSimple(
            this.layout.Id,
            mainPeriod,
            requestParamsMetric,
            requestParamsEntity,
            samplingUnit
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
            maxPeriodsCount: 1,
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
            timeSamplingSelected: this.timeSampling || fromFilter.TimeSamplingEnum.Day,
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