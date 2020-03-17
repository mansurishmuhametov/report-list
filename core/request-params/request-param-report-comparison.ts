import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { DATE_FORMAT } from '../../configuration/constants';
import { IRequestParamReport } from './request-param-report.interface';
import { Period } from '@shared/index';
import { ReportTemplate } from '../../configuration/report-template.enum';
import { RequestParamsEntity } from './request-params-entity';
import { RequestParamsMetric } from './request-params-metric';
import { Sampling } from '@shared/query-execution-engine/core/queries/sampling';

/**
 * Параметры запроса для базового типа отчетов
 */
@Injectable()
export class RequestParamReportComparison implements IRequestParamReport {
    private readonly templateId: ReportTemplate;

    constructor(
        private readonly layoutId: string,
        private readonly period: Period,

        private readonly requestParamsMetric: RequestParamsMetric,
        private readonly requestParamsEntity: RequestParamsEntity,
        private readonly samplingUnit: Sampling.Units,
        private readonly comparisonPeriod: Period,
        private readonly withComparePercentage: boolean,
        private readonly withDelta: boolean
    ) {
        this.templateId = ReportTemplate.Comparison;
    }

    get TemplateId(): ReportTemplate {
        return this.templateId;
    }

    get LayoutId(): string {
        return this.layoutId;
    }

    get Period(): Period {
        return this.period;
    }

    get ComparisonPeriod(): Period {
        return this.comparisonPeriod;
    }

    get WithComparePercentage(): boolean {
        return this.withComparePercentage;
    }

    get WithDelta(): boolean {
        return this.withDelta;
    }

    get Combined(): any {
        const params: any = {
            TemplateProperties: {},
            Interval: {
                From: this.period.from.format(DATE_FORMAT),
                To: this.period.to.format(DATE_FORMAT)
            },
            InputProperties: {
                Metrics: this.requestParamsMetric.toString(),
                SamplingUnit: this.samplingUnit.toString(),
                ComparisonPeriod: `${this.comparisonPeriod.from.format(DATE_FORMAT)};${this.comparisonPeriod.to.format(DATE_FORMAT)}`,
                WithComparePercentage: this.withComparePercentage,
                WithDelta: this.withDelta
            },
            Entities: this.requestParamsEntity.convert(),
            LayoutId: this.layoutId
        };

        return params;
    }
}