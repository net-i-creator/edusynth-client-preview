(function () {
    const section = document.getElementById('published-news');
    const list = document.getElementById('published-news-list');
    if (!section || !list || typeof api === 'undefined') return;

    const editorLink = document.getElementById('news-editor-link');
    if (editorLink && api.getToken()) {
        api.getNewsAdminStatus()
            .then((status) => {
                if (status && status.allowed) editorLink.classList.remove('hidden');
            })
            .catch(() => {});
    }

    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    function createPostCard(post) {
        const card = document.createElement('article');
        card.className = `news-feed-card glass rounded-2xl ${post.image_url ? 'news-feed-card--with-image' : ''}`;

        if (post.image_url) {
            const imageLink = document.createElement('a');
            imageLink.href = `news-post.html?slug=${encodeURIComponent(post.slug)}`;
            imageLink.className = 'news-feed-card__media';
            const image = document.createElement('img');
            image.src = post.image_url;
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            imageLink.appendChild(image);
            card.appendChild(imageLink);
        }

        const body = document.createElement('div');
        body.className = 'news-feed-card__body';

        const meta = document.createElement('div');
        meta.className = 'news-feed-card__meta';
        const dot = document.createElement('span');
        dot.className = 'news-feed-card__dot';
        dot.setAttribute('aria-hidden', 'true');
        const time = document.createElement('time');
        time.dateTime = post.published_at;
        time.textContent = dateFormatter.format(new Date(post.published_at));
        meta.append(dot, time);

        const title = document.createElement('h2');
        title.className = 'news-feed-card__title';
        const titleSize = Math.min(72, Math.max(24, Number(post.title_font_size) || 36));
        title.style.setProperty('--news-title-size', `${titleSize / 16}rem`);
        const titleLink = document.createElement('a');
        titleLink.href = `news-post.html?slug=${encodeURIComponent(post.slug)}`;
        titleLink.textContent = post.title;
        title.appendChild(titleLink);

        const excerpt = document.createElement('p');
        excerpt.className = 'news-feed-card__excerpt';
        excerpt.textContent = post.excerpt;

        const readMore = document.createElement('a');
        readMore.href = titleLink.href;
        readMore.className = 'news-feed-card__read-more';
        readMore.textContent = 'Читать публикацию';
        readMore.setAttribute('aria-label', `Читать публикацию «${post.title}»`);

        body.append(meta, title, excerpt, readMore);
        card.appendChild(body);
        return card;
    }

    api.getNews()
        .then((posts) => {
            if (!Array.isArray(posts) || !posts.length) return;
            const fragment = document.createDocumentFragment();
            posts.forEach((post) => fragment.appendChild(createPostCard(post)));
            list.appendChild(fragment);
            section.classList.remove('hidden');
        })
        .catch((error) => console.warn('Не удалось загрузить новые публикации:', error));
})();
