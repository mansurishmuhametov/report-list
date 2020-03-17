
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import {
    RESOURCE_REPORT_TEMPLATE, REPORT_NAME
} from '../configuration/constants';
import { FileLoadService } from 'crumbs_file-load-form';
import { IRequestParamReport } from '../core/request-params/request-param-report.interface';

/**
 * Сервис для отправки запросов на сервер для формирования отчетов
 * Формирование отчета происходит в несколько этапов
 * 1 - Отправляется запрос на формирование отчета со всеми необходимыми параметрами
 *     В ответе содержится ID ресурса, по которому можно узнать статус, готов отчет или нет
 * 2 - Запускается бесконечный цикл, который отправляет запрос на выяснение статуса отчета
 *     Если отчет еще не готов, то в ответе будет параметр Eta в формате json
 *     Eta - это время в миллисекундах для повторного запроса
 *     Если отчет готов, срабатывает редирект на ресурс, по которому можно скачать отчет
 * 3 - Когда происходит редирект, вся цепочка падает с ошибкой, потому что в ответе теперь excel а не json
 *     Эта ошибка отлавливается и на основание нее отправляется еще один запрос, уже на получение самого отчета
 */
@Injectable()
export class ReportRepository {
    constructor(
        private readonly fileLoadService: FileLoadService
    ) { }

    /**
    * Отправка запроса на сервер для формирования отчета
    * @param requestParams - параметры отчета
    */
    public get(requestParams: IRequestParamReport): void {
        this.startGeneratingReport(requestParams);
    }

    /**
    * Отправка необходимых параметров для формирования отчета
    * Начало формирование отчета
    * @param requestParams - параметры отчета
    */
    private startGeneratingReport(requestParams: IRequestParamReport): void {
        const params: any = requestParams.Combined;
        const templateResourceId: string = `${RESOURCE_REPORT_TEMPLATE}/${requestParams.TemplateId}`;

        this.fileLoadService.addDownload({
            title: REPORT_NAME,
            path: templateResourceId,
            requestBody: params
        });
    }
}