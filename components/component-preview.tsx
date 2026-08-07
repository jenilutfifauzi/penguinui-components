'use client';

import { useEffect, useState } from 'react';

type ComponentPreviewProps = {
    src: string;
    title: string;
};

export function ComponentPreview({ src, title }: ComponentPreviewProps) {
    const [height, setHeight] = useState(280);

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin && event.origin !== 'null') return;
            if (event.data?.type !== 'penguinui-preview-height') return;
            if (event.data.src !== src) return;
            const nextHeight = Number(event.data.height);
            if (Number.isFinite(nextHeight)) setHeight(Math.max(180, Math.min(nextHeight, 1200)));
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [src]);

    return (
        <div className="not-prose my-8 overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
            <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-fd-muted-foreground">
                    Preview
                </span>
                <span className="text-xs text-fd-muted-foreground">Alpine.js + Tailwind CSS</span>
            </div>
            <iframe
                title={`${title} preview`}
                src={src}
                sandbox="allow-scripts"
                loading="lazy"
                className="block w-full border-0 bg-white"
                style={{ height }}
            />
        </div>
    );
}
