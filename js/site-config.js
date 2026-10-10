/**
 * Site-wide links and config (update when real URLs are ready).
 */
const SITE_CONFIG = {
    social: {
        vk: 'https://vk.com/UmBazaRF',
        max: 'https://max.ru/channel_UmBaza',
        dzen: 'https://dzen.ru/umbaza102',
    },
    support: {
        email: 'partners@умбаза.рф',
        emailAscii: 'partners@xn--80aabzw5b.xn--p1ai',
    },
    extraLink: {
        label: 'О проекте',
        url: '#',
        enabled: false,
    },
    ministry: {
        text: 'Все уроки формируются в соответствии со стандартами Министерства образования Российской Федерации',
    },
};

const ROLE_LABELS = {
    student: 'Ученик',
    parent: 'Родитель',
    teacher: 'Преподаватель',
};

const EDUCATION_LEVEL_LABELS = {
    school: 'Школа',
    university: 'ВУЗ',
    extra: 'Доп. образование',
};

function applySiteLinks() {
    document.querySelectorAll('[data-link-vk]').forEach(el => {
        el.href = SITE_CONFIG.social.vk;
    });
    document.querySelectorAll('[data-link-max]').forEach(el => {
        el.href = SITE_CONFIG.social.max;
    });
    document.querySelectorAll('[data-link-dzen]').forEach(el => {
        el.href = SITE_CONFIG.social.dzen;
    });
    const extra = document.getElementById('extra-footer-link');
    if (extra && SITE_CONFIG.extraLink.enabled) {
        extra.href = SITE_CONFIG.extraLink.url;
        extra.textContent = SITE_CONFIG.extraLink.label;
        extra.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', applySiteLinks);
