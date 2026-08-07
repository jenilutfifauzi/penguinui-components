import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(root);
const contentRoot = path.join(repoRoot, 'content', 'docs');
const publicRoot = path.join(repoRoot, 'public', 'preview');
const ignored = new Set(['.git', '.next', '.source', 'content', 'node_modules', 'public']);
const execFileAsync = promisify(execFile);

function titleFromFilename(filename) {
    return filename
        .replace(/\.html$/, '')
        .split(/[-_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeMdxCode(source) {
    return source.replaceAll('```', '``\\`');
}

function detectPlugins(source) {
    const plugins = [];
    if (/\bx-collapse\b/.test(source)) plugins.push('@alpinejs/collapse');
    if (/\bx-trap(?:\.|=|\s)/.test(source)) plugins.push('@alpinejs/focus');
    if (/\bx-mask(?:\.|=|\s)/.test(source)) plugins.push('@alpinejs/mask');
    return plugins;
}

async function collectHtml(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (ignored.has(entry.name)) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await collectHtml(absolute));
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }

    return files;
}

function relativeSource(absolute) {
    return path.relative(repoRoot, absolute).split(path.sep).join('/');
}

function previewSlug(relative) {
    return `/preview/${relative.replace(/\.html$/, '')}/index.html`;
}

async function writePreview(sourcePath) {
    const relative = relativeSource(sourcePath);
    const output = path.join(publicRoot, relative.replace(/\.html$/, ''), 'index.html');
    const source = await readFile(sourcePath, 'utf8');
    const preview = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/preview/preview.css">
</head>
<body>
<main class="preview-root">${source}</main>
<script type="module" src="/preview/preview-runtime.js"></script>
</body>
</html>
`;
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, preview, 'utf8');
}

async function writePage(sourcePath) {
    const relative = relativeSource(sourcePath);
    const parts = relative.split('/');
    const category = parts.at(-2);
    const filename = parts.at(-1);
    const output = path.join(contentRoot, category, filename.replace(/\.html$/, '.mdx'));
    const source = await readFile(sourcePath, 'utf8');
    const title = titleFromFilename(filename);
    const plugins = detectPlugins(source);
    const pluginText = plugins.length > 0
        ? `\nRequired Alpine plugins: ${plugins.map((plugin) => `\`${plugin}\``).join(', ')}.`
        : '';
    const usage = [
        '## Usage',
        '',
        'Copy the HTML fragment above into a page that already loads Tailwind CSS and Alpine.js.',
        pluginText,
        '',
        'If the snippet contains placeholder links, IDs, or data, replace them with values from your application.',
    ].join('\n');

    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `---\ntitle: ${title}\ndescription: ${title} component built with Tailwind CSS and Alpine.js.\n---\n\n<ComponentPreview src="${previewSlug(relative)}" title="${title}" />\n\n## Source\n\nSource component: \`${relative}\`\n\n\`\`\`html\n${escapeMdxCode(source)}\n\`\`\`\n\n${usage}\n`, 'utf8');
    await writePreview(sourcePath);
}

const sources = (await collectHtml(repoRoot)).sort();
const categories = [...new Set(sources.map((source) => path.basename(path.dirname(source))))].sort();
for (const category of categories) await rm(path.join(contentRoot, category), { recursive: true, force: true });
await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });
const previewCssSource = `@import 'tailwindcss';
@source './';
@custom-variant dark (&:where(.dark, .dark *));
@theme {
    --font-body: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
    --font-title: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
    --color-surface: var(--color-white);
    --color-surface-alt: var(--color-neutral-50);
    --color-on-surface: var(--color-neutral-600);
    --color-on-surface-strong: var(--color-neutral-900);
    --color-primary: var(--color-black);
    --color-on-primary: var(--color-neutral-100);
    --color-secondary: var(--color-neutral-800);
    --color-on-secondary: var(--color-white);
    --color-outline: var(--color-neutral-300);
    --color-outline-strong: var(--color-neutral-800);
    --color-surface-dark: var(--color-neutral-950);
    --color-surface-dark-alt: var(--color-neutral-900);
    --color-on-surface-dark: var(--color-neutral-300);
    --color-on-surface-dark-strong: var(--color-white);
    --color-primary-dark: var(--color-white);
    --color-on-primary-dark: var(--color-black);
    --color-secondary-dark: var(--color-neutral-300);
    --color-on-secondary-dark: var(--color-black);
    --color-outline-dark: var(--color-neutral-700);
    --color-outline-dark-strong: var(--color-neutral-300);
    --color-info: var(--color-sky-500);
    --color-on-info: var(--color-white);
    --color-success: var(--color-green-500);
    --color-on-success: var(--color-white);
    --color-warning: var(--color-amber-500);
    --color-on-warning: var(--color-white);
    --color-danger: var(--color-red-500);
    --color-on-danger: var(--color-white);
    --radius-radius: var(--radius-sm);
}
[x-cloak] { display: none !important; }
html, body { min-width: 0; }
body { margin: 0; min-height: 100vh; background: white; color: var(--color-on-surface); font-family: var(--font-body); }
.preview-root { min-height: 100vh; padding: 2rem; }
.preview-root > :first-child { width: 100%; }
button, a, input, select, textarea { font: inherit; }
@media (max-width: 640px) { .preview-root { padding: 1rem; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }
`;
const compiledPreviewCss = await postcss([tailwindcss()]).process(previewCssSource, {
    from: path.join(repoRoot, 'preview.css'),
    to: path.join(publicRoot, 'preview.css'),
});
await writeFile(path.join(publicRoot, 'preview.css'), compiledPreviewCss.css, 'utf8');
await execFileAsync('pnpm', ['exec', 'esbuild', 'scripts/preview-runtime.js', '--bundle', '--format=iife', '--outfile=public/preview/preview-runtime.js'], { cwd: repoRoot });

const landingPage = [
    '---',
    'title: Penguin UI',
    'description: Tailwind CSS and Alpine.js UI components.',
    '---',
    '',
    '# Penguin UI',
    '',
    'Penguin UI is a collection of HTML fragments built with Tailwind CSS and Alpine.js.',
    '',
    '## Usage',
    '',
    '1. Load Tailwind CSS.',
    '2. Load Alpine.js for interactive components.',
    '3. Import the repository `style.css` when using Penguin UI design tokens.',
    '4. Copy a component source from its documentation page.',
    '5. Replace placeholder data, links, and IDs for your application.',
    '',
    'Browse the component categories in the sidebar.',
    '',
].join('\n');
await writeFile(path.join(contentRoot, 'index.mdx'), landingPage, 'utf8');
await writeFile(path.join(contentRoot, 'meta.json'), JSON.stringify({ title: 'Components', pages: ['index', ...categories] }, null, 2) + '\n', 'utf8');
for (const category of categories) {
    await mkdir(path.join(contentRoot, category), { recursive: true });
    await writeFile(path.join(contentRoot, category, 'meta.json'), JSON.stringify({ title: titleFromFilename(`${category}.html`), defaultOpen: true }, null, 2) + '\n', 'utf8');
}

for (const source of sources) await writePage(source);
console.log(`Generated ${sources.length} documentation pages and isolated previews.`);
