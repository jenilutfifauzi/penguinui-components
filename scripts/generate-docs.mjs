import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(root);
const contentRoot = path.join(repoRoot, 'content', 'docs');

const ignored = new Set(['.git', '.next', 'content', 'node_modules']);

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

async function writePage(sourcePath) {
    const relative = relativeSource(sourcePath);
    const parts = relative.split('/');
    const category = parts.at(-2);
    const filename = parts.at(-1);
    const output = path.join(contentRoot, category, filename.replace(/\.html$/, '.mdx'));
    const source = escapeMdxCode(await readFile(sourcePath, 'utf8'));
    const title = titleFromFilename(filename);

    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `---\ntitle: ${title}\ndescription: ${title} component built with Tailwind CSS and Alpine.js.\n---\n\n# ${title}\n\nSource component: \`${relative}\`\n\n\`\`\`html\n${source}\n\`\`\`\n`, 'utf8');
}

const sources = (await collectHtml(repoRoot)).sort();
const categories = [...new Set(sources.map((source) => path.basename(path.dirname(source))))].sort();
for (const category of categories) await rm(path.join(contentRoot, category), { recursive: true, force: true });
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
    '5. Replace placeholder data, links, IDs, and event handlers for your application.',
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
console.log(`Generated ${sources.length} documentation pages from HTML components.`);
