import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';

export function generateStaticParams() {
    return source.generateParams();
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug?: string[] }>;
}) {
    const { slug } = await params;
    const page = source.getPage(slug);
    if (!page) notFound();

    const MDX = page.data.body;

    return (
        <DocsPage toc={page.data.toc}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsBody>
                <MDX />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug?: string[] }>;
}) {
    const { slug } = await params;
    const page = source.getPage(slug);
    if (!page) return {};

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
