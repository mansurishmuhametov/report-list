import {
    Period,
    Entity
} from '@shared/index';

/**
 * Вспомогательные методы для формирования параметров запроса
 */
export abstract class RequestParamServiceBase {
    /**
     * Позволяет преобразовать период, полученный из фильтра, в период, который требуется для запроса отчета
     * (прибавляет еще день, поскольку на бэке период "по" - не включительно)
     * @param inputPeriod - период из фильтра
     */
    public abstract convertPeriod(inputPeriod: Period): Period;

    /**
     * Преобразует список сущностей в параметры запроса
     * @param entityList - список сущностей
     */
    public abstract convertEntityList(entityList: Entity[]): any;
}
