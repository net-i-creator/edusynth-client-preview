(function () {
    const loading = document.getElementById('editor-access-loading');
    const denied = document.getElementById('editor-access-denied');
    const workspace = document.getElementById('editor-workspace');
    const form = document.getElementById('news-editor-form');
    const titleInput = document.getElementById('news-title');
    const titleSizeInput = document.getElementById('news-title-size');
    const contentInput = document.getElementById('news-content');
    const excerptInput = document.getElementById('news-excerpt');
    const imageInput = document.getElementById('news-image');
    const dropZone = document.getElementById('news-image-drop');
    const selectedImage = document.getElementById('selected-image');
    const message = document.getElementById('editor-message');
    const publishButton = document.getElementById('publish-button');
    let previewObjectUrl = null;

    const defaultTitle = 'Заголовок будущей новости';
    const defaultExcerpt = 'Здесь появится короткое описание публикации — именно так её увидят читатели в разделе новостей.';
    document.getElementById('preview-date').textContent = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());

    function derivedExcerpt() {
        const explicit = excerptInput.value.trim();
        if (explicit) return explicit;
        return contentInput.value.trim().replace(/\s+/g, ' ').slice(0, 280);
    }

    function updatePreview() {
        document.getElementById('title-count').textContent = `${titleInput.value.length}/180`;
        document.getElementById('excerpt-count').textContent = `${excerptInput.value.length}/500`;
        document.getElementById('preview-title').textContent = titleInput.value.trim() || defaultTitle;
        document.getElementById('preview-title').style.setProperty('--news-title-size', `${Number(titleSizeInput.value) / 16}rem`);
        document.getElementById('title-size-value').textContent = `${titleSizeInput.value} px`;
        document.getElementById('preview-excerpt').textContent = derivedExcerpt() || defaultExcerpt;
    }

    function showMessage(text, type = 'success', link = null) {
        message.className = `editor-message editor-message--${type}`;
        message.replaceChildren();
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        message.appendChild(paragraph);
        if (link) {
            const anchor = document.createElement('a');
            anchor.href = link;
            anchor.textContent = 'Открыть публикацию ↗';
            message.appendChild(anchor);
        }
    }

    function clearImage() {
        imageInput.value = '';
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
        selectedImage.classList.add('hidden');
        document.getElementById('preview-image-wrap').classList.add('hidden');
        document.getElementById('preview-image').removeAttribute('src');
    }

    function useImage(file) {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
            showMessage('Выберите изображение JPG, PNG, WebP или GIF.', 'error');
            clearImage();
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            showMessage('Картинка больше 8 МБ. Выберите файл меньшего размера.', 'error');
            clearImage();
            return;
        }
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = URL.createObjectURL(file);
        document.getElementById('selected-image-thumb').src = previewObjectUrl;
        document.getElementById('selected-image-name').textContent = file.name;
        document.getElementById('selected-image-size').textContent = `${(file.size / 1024 / 1024).toFixed(1)} МБ`;
        document.getElementById('preview-image').src = previewObjectUrl;
        selectedImage.classList.remove('hidden');
        document.getElementById('preview-image-wrap').classList.remove('hidden');
        message.classList.add('hidden');
    }

    titleInput.addEventListener('input', updatePreview);
    titleSizeInput.addEventListener('input', updatePreview);
    contentInput.addEventListener('input', updatePreview);
    excerptInput.addEventListener('input', updatePreview);
    imageInput.addEventListener('change', () => useImage(imageInput.files[0]));
    document.getElementById('remove-image').addEventListener('click', clearImage);

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropZone.classList.add('is-dragging');
        });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropZone.classList.remove('is-dragging');
        });
    });
    dropZone.addEventListener('drop', (event) => {
        const file = event.dataTransfer.files[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        imageInput.files = transfer.files;
        useImage(file);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        message.classList.add('hidden');
        if (!form.reportValidity()) return;

        publishButton.disabled = true;
        publishButton.querySelector('span').textContent = 'Публикуем…';
        try {
            const post = await api.publishNews(new FormData(form));
            showMessage('Готово — новость опубликована и уже появилась на сайте.', 'success', `news-post.html?slug=${encodeURIComponent(post.slug)}`);
            form.reset();
            clearImage();
            updatePreview();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            showMessage(error.message || 'Не удалось опубликовать новость.', 'error');
        } finally {
            publishButton.disabled = false;
            publishButton.querySelector('span').textContent = 'Опубликовать';
        }
    });

    const localPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
        && new URLSearchParams(window.location.search).has('preview');
    if (localPreview) {
        loading.classList.add('hidden');
        document.getElementById('editor-account').textContent = 'preview@localhost';
        workspace.classList.remove('hidden');
        updatePreview();
        return;
    }

    if (!api.getToken()) {
        window.location.replace('auth.html?redirect=news-editor.html');
        return;
    }

    api.getNewsAdminStatus().then((status) => {
        loading.classList.add('hidden');
        if (!status || !status.allowed) {
            denied.classList.remove('hidden');
            return;
        }
        document.getElementById('editor-account').textContent = status.email;
        workspace.classList.remove('hidden');
        titleInput.focus();
    }).catch(() => {
        loading.classList.add('hidden');
        denied.classList.remove('hidden');
    });

    updatePreview();
})();
