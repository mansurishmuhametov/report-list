import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { RequestParamServiceBase } from './request-param.service.base';
import {
    Period,
    Entity
} from '@shared/index';

/**
 * Вспомогательные методы для формирования параметров запроса
 */
@Injectable()
export class RequestParamService implements RequestParamServiceBase {
    /**
     * Позволяет преобразовать период, полученный из фильтра, в период, который требуется для запроса отчета
     * (прибавляет еще день, поскольку на бэке период "по" - не включительно)
     * @param inputPeriod - период из фильтра
     */
    public convertPeriod(inputPeriod: Period): Period {
        if (!inputPeriod) {
            return null;
        }

        const period: Period = _.cloneDeep(inputPeriod);

        period.from.startOf('day');
        period.to.startOf('day').add(1, 'days');

        return period;
    }

    /**
     * Преобразует список сущностей в параметры запроса
     * @param entityList - список сущностей
     */
    public convertEntityList(entityList: Entity[]): any {
        const entityListParams: any = {};

        const entityTypeList: string[] = _(entityList)
            .map((entity: Entity) => entity.Type)
            .uniq()
            .valueOf();

        _.forEach(entityTypeList, (entityType: string) => {
            entityListParams[entityType] = _(entityList)
                .filter((entity: Entity) => entity.Type === entityType)
                .map((entity: Entity) => entity.Id)
                .valueOf();
        });

        return entityListParams;
    }
}