(function (global) {
    'use strict';

    const purifier = global.DOMPurify;
    const purifierConfig = Object.freeze({
        USE_PROFILES: { html: true },
        SANITIZE_DOM: true,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        FORBID_TAGS: [
            'base', 'button', 'embed', 'form', 'iframe', 'input', 'link',
            'meta', 'object', 'script', 'select', 'style', 'template', 'textarea',
        ],
        FORBID_ATTR: ['id', 'name', 'srcdoc', 'srcset', 'style'],
    });
    const urlAttributes = new Set([
        'action', 'background', 'cite', 'formaction', 'href', 'poster', 'src',
        'srcset', 'xlink:href',
    ]);
    const dataImagePrefix = /^data:image\/(?:gif|jpe?g|png|webp);base64,/i;
    const base64Payload = /^[a-z0-9+/=\r\n]+$/i;

    function asString(value) {
        return value == null ? '' : String(value);
    }

    function escapeHtml(value) {
        return asString(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        })[character]);
    }

    function isSafeMarkupUrl(value, attributeName) {
        const compact = asString(value).trim().replace(/[\u0000-\u0020\u007f]+/g, '');
        const scheme = compact.match(/^([a-z][a-z0-9+.-]*):/i);
        if (!scheme) return true;

        const protocol = scheme[1].toLowerCase();
        if (protocol === 'http' || protocol === 'https') return true;
        return attributeName === 'href' && (protocol === 'mailto' || protocol === 'tel');
    }

    function removeUnsafeUrls(template) {
        template.content.querySelectorAll('*').forEach((element) => {
            Array.from(element.attributes).forEach((attribute) => {
                const name = attribute.name.toLowerCase();
                if (urlAttributes.has(name) && !isSafeMarkupUrl(attribute.value, name)) {
                    element.removeAttribute(attribute.name);
                }
            });

            if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
                const rel = new Set((element.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
                rel.add('noopener');
                rel.add('noreferrer');
                element.setAttribute('rel', Array.from(rel).join(' '));
            }
        });
    }

    function sanitizeHtml(value) {
        const html = asString(value);
        if (!purifier || typeof purifier.sanitize !== 'function') {
            return escapeHtml(html);
        }

        try {
            const cleanHtml = purifier.sanitize(html, purifierConfig);
            const template = document.createElement('template');
            template.innerHTML = cleanHtml;
            removeUnsafeUrls(template);
            return template.innerHTML;
        } catch (error) {
            console.error('Lesson HTML sanitization failed');
            return escapeHtml(html);
        }
    }

    function safeImageUrl(value) {
        const candidate = asString(value).trim();
        if (!candidate) return null;

        if (dataImagePrefix.test(candidate)) {
            const payload = candidate.slice(candidate.indexOf(',') + 1);
            return payload && base64Payload.test(payload) ? candidate : null;
        }

        return isSafeMarkupUrl(candidate, 'src') ? candidate : null;
    }

    global.lessonSanitizer = Object.freeze({ sanitizeHtml, safeImageUrl });
})(window);
