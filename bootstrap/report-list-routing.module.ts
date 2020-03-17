import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReportComparisonComponent } from '../ui/report-comparison/report-comparison.component';
import { ReportIntersectionComponent } from '../ui/report-intersection/report-intersection.component';
import { ReportListPageComponent } from '../ui/report-list-page/report-list-page.component';
import { ReportSimpleComponent } from '../ui/report-simple/report-simple.component';

const reportListRoutes: Routes = [
    {
        path: '',
        component: ReportListPageComponent,
        children: [
            {
                path: 'simple',
                component: ReportSimpleComponent
            },
            {
                path: 'comparison',
                component: ReportComparisonComponent
            },
            {
                path: 'intersection',
                component: ReportIntersectionComponent
            },
            {
                path: '',
                redirectTo: 'simple'
            }
        ]
    }
];

/**
 * Состояние модуля "Отчеты"
 */
@NgModule({
    imports: [
        RouterModule.forChild(reportListRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class ReportListRoutingModule {}