import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { Entity } from '@shared/index';

/**
 * Параметры запроса для базового типа отчетов
 */
@Injectable()
export class RequestParamsEntity {
    constructor(
        private readonly entityList: Entity[]
    ) { }

    /**
     * Преобразует список сущностей в параметры запроса
     */
    public convert(): string {
        return this.convertToRequestParams();
    }

    /**
     * Преобразует список сущностей в параметры запроса
     */
    private convertToRequestParams(): any {
        const entityListParams: any = {};

        const entityTypeList: string[] = _(this.entityList)
            .map((entity: Entity) => entity.Type)
            .uniq()
            .valueOf();

        _.forEach(entityTypeList, (entityType: string) => {
            entityListParams[entityType] = _(this.entityList)
                .filter((entity: Entity) => entity.Type === entityType)
                .map((entity: Entity) => entity.Id)
                .valueOf();
        });

        return entityListParams;
    }
}