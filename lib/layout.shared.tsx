import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: 'Penguin UI',
        },
        links: [
            {
                text: 'GitHub',
                url: 'https://github.com/jenilutfifauzi/penguinui-components',
                external: true,
            },
        ],
    };
}
