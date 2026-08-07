import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import focus from '@alpinejs/focus';
import mask from '@alpinejs/mask';

Alpine.plugin(collapse);
Alpine.plugin(focus);
Alpine.plugin(mask);
window.Alpine = Alpine;
Alpine.start();

const reportHeight = () => {
    window.parent.postMessage({
        type: 'penguinui-preview-height',
        src: window.location.pathname,
        height: document.documentElement.scrollHeight,
    }, '*');
};

window.addEventListener('load', reportHeight);
new ResizeObserver(reportHeight).observe(document.documentElement);
setTimeout(reportHeight, 250);
setTimeout(reportHeight, 1000);
