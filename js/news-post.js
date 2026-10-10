(function () {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const loading = document.getElementById('news-article-loading');
    const article = document.getElementById('news-article');
    const errorState = document.getElementById('news-article-error');

    function showError() {
        loading.classList.add('hidden');
        article.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    if (!slug || typeof api === 'undefined') {
        showError();
        return;
    }

    api.getNewsArticle(slug).then((post) => {
        if (!post) {
            showError();
            return;
        }
        document.title = `${post.title} — УмБаза`;
        document.querySelector('meta[name="description"]').content = post.excerpt;
        document.getElementById('article-title').textContent = post.title;
        const titleSize = Math.min(72, Math.max(24, Number(post.title_font_size) || 36));
        document.getElementById('article-title').style.setProperty('--news-title-size', `${titleSize / 16}rem`);
        document.getElementById('article-excerpt').textContent = post.excerpt;

        const date = document.getElementById('article-date');
        date.dateTime = post.published_at;
        date.textContent = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(post.published_at));

        if (post.image_url) {
            const image = document.getElementById('article-image');
            image.src = post.image_url;
            image.alt = post.title;
            image.classList.remove('hidden');
        }

        const content = document.getElementById('article-content');
        post.content.split(/\n{2,}/).forEach((block) => {
            const paragraph = document.createElement('p');
            paragraph.textContent = block.trim();
            content.appendChild(paragraph);
        });

        loading.classList.add('hidden');
        article.classList.remove('hidden');
    }).catch(showError);
})();
