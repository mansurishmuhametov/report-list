import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import {
    Metric
} from '@shared/index';
import { MetricStorageItem } from './metric-storage-item';

/**
 * Хранилище метрик для разных схем размещения
 */
@Injectable()
export class MetricStorage {
    private storage: MetricStorageItem[];

    constructor() {
        this.storage = [];
    }

    /**
    * Сохраняет список метрик для определенной схемы
    */
    public set(layoutId: string, metricList: Metric[]): void {
        const search: MetricStorageItem = _.find(this.storage, (item: MetricStorageItem) => item.LayoutId === layoutId);

        if (search) {
            throw new Error('Данный объект уже существует');
        }

        this.storage.push(new MetricStorageItem(layoutId, metricList));
    }

    /**
    * Возвращает список метрик для определенной схемы
    */
    public get(layoutId: string): Metric[] {
        const search: MetricStorageItem = _.find(this.storage, (item: MetricStorageItem) => item.LayoutId === layoutId);

        if (search) {
            return search.MetricList;
        }

        return null;
    }
}