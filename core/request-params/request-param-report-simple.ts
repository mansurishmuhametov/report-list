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
export class RequestParamReportSimple implements IRequestParamReport {
    private readonly templateId: ReportTemplate;

    constructor(
        private readonly layoutId: string,
        private readonly period: Period,

        private readonly requestParamsMetric: RequestParamsMetric,
        private readonly requestParamsEntity: RequestParamsEntity,
        private readonly samplingUnit: Sampling.Units
    ) {
        this.templateId = ReportTemplate.Simple;
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

    get Combined(): any {
        const params: any = {
            TemplateProperties: {},
            Interval: {
                From: this.period.from.format(DATE_FORMAT),
                To: this.period.to.format(DATE_FORMAT)
            },
            InputProperties: {
                Metrics: this.requestParamsMetric.toString(),
                SamplingUnit: this.samplingUnit.toString()
            },
            Entities: this.requestParamsEntity.convert(),
            LayoutId: this.layoutId
        };

        return params;
    }
}