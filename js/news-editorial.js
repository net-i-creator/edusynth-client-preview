(() => {
    const list = document.getElementById('news-list');
    const storageKey = 'umbaza-news-return';
    const read = () => { try { return JSON.parse(sessionStorage.getItem(storageKey)); } catch { return null; } };
    if (list) {
        const cards = [...list.querySelectorAll('[data-news-category]')];
        const filters = [...document.querySelectorAll('[data-news-filter]')];
        let category = 'all';
        function select(value) {
            category = filters.some(button => button.dataset.newsFilter === value) ? value : 'all';
            let shown = 0;
            cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.newsCategory !== category; if (!card.hidden) shown++; });
            filters.forEach(button => { const active = button.dataset.newsFilter === category; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
            document.getElementById('news-empty').style.display = shown ? 'none' : 'block';
        }
        const save = () => {
            const context = { category, y: window.scrollY, url: location.href };
            history.replaceState({ ...history.state, newsContext: context }, '');
            try { sessionStorage.setItem(storageKey, JSON.stringify(context)); } catch {}
        };
        filters.forEach(button => button.addEventListener('click', () => { select(button.dataset.newsFilter); save(); }));
        document.addEventListener('click', event => { const a = event.target.closest('a'); if (a && /\/news\/|news-post\.html/.test(a.href)) save(); });
        function restore() {
            const previous = document.referrer ? new URL(document.referrer) : null;
            const saved = read();
            const returning = previous?.origin === location.origin && (/\/news\//.test(previous.pathname) || previous.pathname.endsWith('/news-post.html'));
            const state = history.state?.newsContext || (returning && saved?.url === location.href ? saved : null);
            select(state?.category || 'all');
            if (state) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: state.y, behavior: 'instant' })));
        }
        restore();
        window.addEventListener('pageshow', restore);
    } else if (document.body.classList.contains('editorial-page')) {
        document.querySelectorAll('a[href$="news.html"]').forEach(link => link.addEventListener('click', event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            const context = read();
            const referrer = document.referrer;
            if (context && referrer && new URL(referrer).origin === location.origin && new URL(referrer).pathname.endsWith('/news.html') && history.length > 1) {
                event.preventDefault(); history.back();
            }
        }));
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('editorial-reveal'); observer.unobserve(entry.target); }
        }), { threshold: .08 });
        document.querySelectorAll('.news-hero, .news-feature, .news-card, .editorial-cover').forEach(element => observer.observe(element));
    }
})();
