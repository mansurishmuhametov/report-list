import { Component } from '@angular/core';
import * as _ from 'lodash';

import { navigationLinkList } from '../../configuration/navigation-link-list';
import { NavigationLink } from '@shared/navigation/core/navigation-link';

/**
 * Страница "Список отчетов"
 */
@Component({
    selector: 'crumbs_report-list-page',
    templateUrl: './report-list-page.component.html',
    styleUrls: ['./report-list-page.component.scss']
})
export class ReportListPageComponent {
    private navigationLinkList: NavigationLink[];

    get NavigationLinkList(): NavigationLink[] {
        return this.navigationLinkList;
    }

    constructor() {
        this.navigationLinkList = navigationLinkList;
    }
}
