/**
 * УмБаза API Client
 */

const API_BASE = (() => {
    const host = window.location.hostname;
    if ((host === 'localhost' || host === '127.0.0.1') && window.location.port !== '4183') {
        return 'http://localhost:8001';
    }
    // Production API is served from the same VPS and domain.
    return window.location.origin;
})();

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    getToken() {
        return localStorage.getItem('access_token');
    }

    setTokens(access, refresh) {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    _headers(extra = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...extra,
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Always send guest id so stale/invalid JWTs still work as anonymous.
        // (After DB reset, old tokens decode but user no longer exists.)
        if (typeof getGuestId === 'function') {
            headers['X-Guest-Id'] = getGuestId();
        } else {
            let id = localStorage.getItem('guest_id');
            if (!id) {
                id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2);
                localStorage.setItem('guest_id', id);
            }
            headers['X-Guest-Id'] = id;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this._headers(options.headers);
        if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
            delete headers['Content-Type'];
        }
        // Lesson generation can take 30–90s; hang forever looks like a broken site.
        const timeoutMs = options.timeoutMs ?? (endpoint.includes('/generate') ? 150000 : 45000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });

            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    const retryHeaders = this._headers(options.headers);
                    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
                        delete retryHeaders['Content-Type'];
                    }
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers: retryHeaders,
                        signal: controller.signal,
                    });
                    return this.handleResponse(retryResponse);
                }
                this.clearTokens();
                return null;
            }

            return this.handleResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            if (error && error.name === 'AbortError') {
                throw new Error('Сервер не ответил вовремя. Обновите страницу и попробуйте ещё раз.');
            }
            if (error && /Failed to fetch|NetworkError|Load failed/i.test(String(error.message || error))) {
                throw new Error('Нет связи с сервером генерации. Обновите страницу (Ctrl+Shift+R) и попробуйте снова.');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Network error' }));
            const message = typeof error.detail === 'string'
                ? error.detail
                : Array.isArray(error.detail)
                    ? error.detail.map(e => e.msg).join(', ')
                    : 'Request failed';
            throw new Error(message);
        }
        return response.json();
    }

    async refreshToken() {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return false;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refresh }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.access_token, data.refresh_token);
                return true;
            }
        } catch (e) {
            console.error('Token refresh failed:', e);
        }

        return false;
    }

    async getSiteConfig() {
        return this.request('/api/config');
    }

    async register(email, password, fullName, role = 'student', phone = null, nickname = null, promoCode = null) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                full_name: fullName,
                role,
                phone,
                nickname,
                promo_code: promoCode,
            }),
        });
    }

    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async forgotPassword(email) {
        return this.request('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token, password) {
        return this.request('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }

    async sendSupport(email, message) {
        return this.request('/api/support', {
            method: 'POST',
            body: JSON.stringify({ email, message }),
        });
    }

    async getMe() {
        return this.request('/api/auth/me');
    }

    async updateProfile(data) {
        return this.request('/api/auth/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async generateLesson(topic, grade, subject, educationLevel = 'school') {
        return this.request('/api/lessons/generate', {
            method: 'POST',
            body: JSON.stringify({
                topic,
                grade: parseInt(grade, 10),
                subject,
                education_level: educationLevel,
            }),
        });
    }

    async getLesson(lessonId) {
        return this.request(`/api/lessons/${lessonId}`);
    }

    async getLessonHistory() {
        return this.request('/api/lessons/history/');
    }

    async checkQuiz(lessonId, answers) {
        return this.request('/api/quiz/check', {
            method: 'POST',
            body: JSON.stringify({ lesson_id: lessonId, answers }),
        });
    }

    async getDashboardStats() {
        return this.request('/api/dashboard/stats');
    }

    async getBillingPlans() {
        return this.request('/api/billing/plans');
    }

    async createCheckout(plan) {
        return this.request(`/api/billing/checkout/${encodeURIComponent(plan)}`, { method: 'POST' });
    }

    async getBillingStatus() {
        return this.request('/api/billing/status');
    }

    async getNews(limit = 50) {
        return this.request(`/api/news?limit=${encodeURIComponent(limit)}`);
    }

    async getNewsArticle(slug) {
        return this.request(`/api/news/${encodeURIComponent(slug)}`);
    }

    async getNewsAdminStatus() {
        return this.request('/api/news/admin/status');
    }

    async publishNews(formData) {
        return this.request('/api/news', {
            method: 'POST',
            body: formData,
            timeoutMs: 90000,
        });
    }

    async getLeaderboard(limit = 100) {
        return this.request(`/api/leaderboard?limit=${limit}`);
    }

    async getRouletteStatus() {
        return this.request('/api/roulette/status');
    }

    async getRoulettePool(pool) {
        return this.request(`/api/roulette/pools/${pool}`);
    }

    async spinRoulette(pool) {
        return this.request(`/api/roulette/spin/${pool}`, { method: 'POST' });
    }
}

const api = new ApiClient();
