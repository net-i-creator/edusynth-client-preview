/** Build the same primary navigation on every public УмБаза page. */
(function () {
    const isNewsArticle = window.location.pathname.includes('/news/');
    const isFilePage = window.location.protocol === 'file:';
    const isGitHubPreview = window.location.hostname === 'net-i-creator.github.io';
    const prefix = isNewsArticle ? '../' : '';
    const useRelativeLinks = isFilePage || isGitHubPreview;
    const homeHref = useRelativeLinks ? `${isNewsArticle ? '../' : ''}index.html` : '/';
    const lessonHref = useRelativeLinks
        ? `${isNewsArticle ? '../' : ''}index.html#levels-section`
        : '/#levels-section';

    const links = [
        { href: homeHref, label: 'Главная', match: /^\/$|\/index\.html$/ },
        { href: lessonHref, label: 'Создать урок' },
        { href: `${prefix}leaderboard.html`, label: 'Доска почёта', match: /\/leaderboard\.html$/ },
        { href: `${prefix}plans.html`, label: 'Тарифы', match: /\/plans\.html$/ },
        { href: `${prefix}faq.html`, label: 'FAQ', match: /\/faq\.html$/ },
        { href: `${prefix}news.html`, label: 'Новости и аналитика', match: /\/news(?:\/|\.html$)/ },
        { href: `${prefix}marketplace.html`, label: 'Найти репетитора', match: /\/marketplace\.html$/ },
        { href: useRelativeLinks ? `${homeHref}#reviews` : '/#reviews', label: 'Отзывы' },
        { href: `${prefix}franchise.html`, label: 'Франшиза', match: /\/franchise\.html$/ },
    ];

    function renderLink(link) {
        const active = link.match?.test(window.location.pathname);
        return `<a href="${link.href}" class="nav-link${active ? ' is-active' : ''}"${active ? ' aria-current="page"' : ''}>${link.label}</a>`;
    }

    function buildNavigation() {
        const current = document.querySelector('nav');
        if (!current || current.hasAttribute('data-nav-contextual')) return;

        const loggedIn = !!window.localStorage.getItem('access_token');
        current.className = 'site-nav relative z-40 border-b border-theme glass';
        current.innerHTML = `
            <div class="site-nav__inner max-w-6xl mx-auto px-4 sm:px-6">
                <a href="${homeHref}" class="site-nav__brand" aria-label="УмБаза — главная">
                    <span class="site-nav__logo"><img src="${prefix}assets/brand/umbaza-mark-v2.png" alt="" class="brand-mark brand-mark--nav"></span>
                    <span class="site-nav__title">УмБаза</span>
                </a>
                <div class="site-nav__links" aria-label="Основные разделы">
                    ${links.map(renderLink).join('')}
                </div>
                <div class="site-nav__socials" aria-label="УмБаза в социальных сетях">
                    <a href="https://vk.com/UmBazaRF" target="_blank" rel="noopener noreferrer" class="social-icon social-icon--app" aria-label="ВКонтакте"><img src="${prefix}assets/logos/vk-square.png" alt=""></a>
                    <a href="https://max.ru/channel_UmBaza" target="_blank" rel="noopener noreferrer" class="social-icon social-icon--app" aria-label="MAX"><img src="${prefix}assets/logos/max-square.png" alt=""></a>
                    <a href="https://dzen.ru/umbaza102" target="_blank" rel="noopener noreferrer" class="social-icon social-icon--app" aria-label="Дзен"><img src="${prefix}assets/logos/dzen-square.png" alt=""></a>
                </div>
                <a href="${prefix}${loggedIn ? 'account.html' : 'auth.html'}" id="nav-account" class="btn-account">${loggedIn ? 'Кабинет' : 'Войти'}</a>
            </div>`;
    }

    document.addEventListener('DOMContentLoaded', buildNavigation);
})();
