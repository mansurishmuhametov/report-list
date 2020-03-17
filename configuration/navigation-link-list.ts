import { LayoutView } from '@shared/layouts';
import { NavigationLink } from '@shared/navigation/core/navigation-link';

export const navigationLinkList: NavigationLink[] = [
    {
        title: 'reportType.simple',
        link: ['simple'],
        hasClaim: 'navigate.element.report-list',
        featureToggle: 'development:report_list_module',
        layoutViews: [ LayoutView.Mall ]
    },
    {
        title: 'reportType.comparison',
        link: ['comparison'],
        hasClaim: 'navigate.element.report-list',
        featureToggle: 'development:report_list_module',
        layoutViews: [ LayoutView.Mall ]
    },
    {
        title: 'reportType.intersection',
        link: ['intersection'],
        hasClaim: 'navigate.element.report-list',
        featureToggle: 'development:report_list_module',
        layoutViews: [ LayoutView.Mall ]
    }
];