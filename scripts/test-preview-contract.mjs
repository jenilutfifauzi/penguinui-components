import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectInteraction } from './preview-metadata.mjs';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

assert.equal(detectInteraction('<button x-on:click="open = ! open">'), 'click');
assert.equal(detectInteraction('<button @click="open = ! open">'), 'click');
assert.equal(detectInteraction('<button x-on:mouseover="open = true">'), 'hover');
assert.equal(detectInteraction('<button x-on:contextmenu.prevent="open = true">'), 'contextmenu');
assert.equal(detectInteraction('<button x-on:click="open = true" x-on:contextmenu.prevent="open = true">'), 'click-or-contextmenu');
assert.equal(detectInteraction('<div class="static">Text</div>'), 'none');

const cases = [
    ['dropdowns/dropdown-with-click', 'click'],
    ['dropdowns/dropdown-with-hover', 'hover'],
    ['dropdowns/context-menu-dropdown', 'click-or-contextmenu'],
    ['alert/alert-dismiss-functionality', 'click'],
];

for (const [name, interaction] of cases) {
    const mdx = await readFile(path.join(repoRoot, 'content/docs', `${name}.mdx`), 'utf8');
    assert.match(mdx, new RegExp(`interaction="${interaction}"`));
}

console.log(`Preview contract passed for ${cases.length} interaction-aware pages.`);

/* ponytail: contract test only covers trigger classification and generated wiring; browser behavior is smoke-tested separately. */
