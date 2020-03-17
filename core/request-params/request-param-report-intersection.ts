import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { DATE_FORMAT } from '../../configuration/constants';
import { IRequestParamReport } from './request-param-report.interface';
import { Period } from '@shared/index';
import { ReportTemplate } from '../../configuration/report-template.enum';
import { RequestParamsEntity } from './request-params-entity';
import { RequestParamsMainEntity } from './request-params-main-entity';

/**
 * Параметры запроса для базового типа отчетов
 */
@Injectable()
export class RequestParamReportIntersection implements IRequestParamReport {
    private readonly templateId: ReportTemplate;

    constructor(
        private readonly layoutId: string,
        private readonly period: Period,

        private readonly requestParamsEntity: RequestParamsEntity,
        private readonly requestParamsMainEntity: RequestParamsMainEntity
    ) {
        this.templateId = ReportTemplate.Intersection;
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
                CrossVisitationMainEntities: this.requestParamsMainEntity.convert()
            },
            Entities: this.requestParamsEntity.convert(),
            LayoutId: this.layoutId
        };

        return params;
    }
}