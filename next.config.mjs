import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/docs/:path*.md',
                destination: '/llms.mdx/docs/:path*',
            },
        ];
    },
};

export default withMDX(nextConfig);
