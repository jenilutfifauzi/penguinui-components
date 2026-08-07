const INTERACTIVE_EVENTS = /(?:\bx-on:|@)([a-z]+)((?:\.[a-z-]+)*)\s*=/gi;

export function detectInteraction(source) {
    const events = [];
    for (const match of source.matchAll(INTERACTIVE_EVENTS)) {
        const event = match[1].toLowerCase();
        const modifiers = match[2].toLowerCase().split('.').filter(Boolean);
        if (event === 'click' && modifiers.some((modifier) => ['outside', 'away', 'self'].includes(modifier))) continue;
        events.push(event);
    }

    const hasClick = events.includes('click');
    const hasContextMenu = events.includes('contextmenu');
    const hasHover = events.some((event) => ['mouseover', 'mouseenter'].includes(event));

    if (hasClick && hasContextMenu) return 'click-or-contextmenu';
    if (hasContextMenu) return 'contextmenu';
    if (hasHover) return 'hover';
    if (hasClick) return 'click';
    return 'none';
}

/* ponytail: trigger metadata is intentionally source-derived; snippets remain the source of truth. */
