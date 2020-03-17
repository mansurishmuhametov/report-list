import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import * as _ from 'lodash';

const mappingApi: _.TemplateExecutor = _.template('/v2/layouts/<%= layoutId %>/mappings/shopster');

/**
 * Сервис для получения данных от Шопстера, о том какие сущности связаны с сущностями Focus
 */
@Injectable()
export class ShopsterRepository {
    constructor(
        private readonly httpClient: HttpClient
    ) { }

    /**
     * Метод получения идентификаторов сущностей, для которыйх есть маппинг с id shopster
     * @param layoutId - Идентификатор семы размещения
     */
    public getMapping(layoutId: string): Observable<string[]> {
        const url: string = mappingApi({ layoutId });

        return this.httpClient.get<any>(url)
            .pipe(
                map((result) => {
                    return _.map(result.Mapping, (value: any, entityId: string) => entityId);
                }),
                catchError(() => of([]))
            );
    }
}