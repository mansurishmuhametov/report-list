import { CommonModule } from '@angular/common';
import { LocalizationModule } from 'crumbs_localization-form';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

import { AtomicDesignFormModule } from 'crumbs_atomic-design-form';
import { FeatureToggleModule } from 'crumbs_feature-toggle';
import { GregorianCalendarModule } from 'Crumbs.GregorianCalendarForm';
import { TitleFormModule } from 'crumbs_title-form';

import { ClickOutsideModule } from '../../../shared/click-outside/click-outside.module';
import { DialogModule } from 'crumbs_dialog-form';
import { MetricStorage } from '../core/metric.storage';
import { NavigationListModule } from '@shared/navigation/navigation.module';
import { QueryCriteriaSelectorModule } from 'retail_query-criteria-selector-form';
import { ReportComparisonComponent } from '../ui/report-comparison/report-comparison.component';
import { ReportIntersectionComponent } from '../ui/report-intersection/report-intersection.component';
import { ReportListPageComponent } from '../ui/report-list-page/report-list-page.component';
import { ReportListRoutingModule } from './report-list-routing.module';
import { ReportRepository } from '../data/report.repository';
import { ReportService } from '../core/report.service';
import { ReportServiceBase } from '../core/report.service.base';
import { ReportSimpleComponent } from '../ui/report-simple/report-simple.component';
import { RequestParamService } from '../core/request-params/request-param.service';
import { RequestParamServiceBase } from '../core/request-params/request-param.service.base';
import { SharedModule } from '../../../shared/shared.module';
import { ShopsterRepository } from '../data/shopster.repository';

/**
 * Модуль "Отчеты"
 */
@NgModule({
    imports: [
        AtomicDesignFormModule,
        ClickOutsideModule,
        CommonModule,
        DialogModule.forRoot(),
        FeatureToggleModule,
        GregorianCalendarModule,
        LocalizationModule,
        NavigationListModule,
        NgbModule.forRoot(),
        QueryCriteriaSelectorModule,
        ReportListRoutingModule,
        SharedModule.forRoot(),
        TitleFormModule
    ],
    declarations: [
        ReportSimpleComponent,
        ReportComparisonComponent,
        ReportIntersectionComponent,
        ReportListPageComponent
    ],
    providers: [
        ReportRepository,
        ShopsterRepository,
        MetricStorage,
        {
            provide: ReportServiceBase,
            useClass: ReportService
        },
        {
            provide: RequestParamServiceBase,
            useClass: RequestParamService
        }
    ]
})
export class ReportListModule {}