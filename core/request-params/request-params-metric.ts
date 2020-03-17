import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { Metric } from '@shared/index';

const METRIC_TYPE_AND_FIELD_DELIMETER: string = '@';
const DELIMETER: string = ';';

/**
 * Параметры запроса для базового типа отчетов
 */
@Injectable()
export class RequestParamsMetric {
    constructor(
        private readonly metricList: Metric[]
    ) { }

    /**
     * Преобразует список метрик в строку
     */
    public toString(): string {
        return this.convertToRequestParams();
    }

    /**
     * Позволяет преобразовать список метрик в параметры запроса
     */
    public convertToRequestParams(): string {
        return _(this.metricList)
            .map((metric: Metric) => `${metric.Type}${METRIC_TYPE_AND_FIELD_DELIMETER}${metric.Field}`)
            .join(DELIMETER)
            .valueOf();
    }
}