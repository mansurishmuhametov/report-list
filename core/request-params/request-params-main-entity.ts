import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { Entity } from '@shared/index';

const DELIMETER: string = ';';

/**
 * Параметры запроса для базового типа отчетов
 */
@Injectable()
export class RequestParamsMainEntity {
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
    private convertToRequestParams(): string {
        const result: string = _(this.entityList)
            .map((entity: Entity) => entity.Id)
            .join(DELIMETER)
            .valueOf();

        return result;
    }
}