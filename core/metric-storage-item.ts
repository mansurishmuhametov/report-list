import { Injectable } from '@angular/core';

import {
    Metric
} from '@shared/index';

/**
 * Хранилище метрик для разных схем размещения
 */
@Injectable()
export class MetricStorageItem {
    constructor(
        private readonly layoutId: string,
        private readonly metricList: Metric[]
    ) { }

    get LayoutId(): string {
        return this.layoutId;
    }

    get MetricList(): Metric[] {
        return this.metricList;
    }
}