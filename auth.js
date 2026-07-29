// ============================================================
// Forga AI - نظام المصادقة (Google OAuth)
// ============================================================

const AUTH_CONFIG = {
    // تم استبدال هذا بمفتاح العميل الخاص بك من Google Cloud Console
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: window.location.origin + '/login.html',
    scope: 'email profile'
};

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this._loadSession();
    }

    _loadSession() {
        try {
            const session = localStorage.getItem('forga_session');
            if (session) {
                const data = JSON.parse(session);
                this.user = data.user;
                this.token = data.token;
                this.isAuthenticated = true;
            }
        } catch (e) {
            console.warn('فشل تحميل الجلسة:', e);
        }
    }

    _saveSession(user, token) {
        this.user = user;
        this.token = token;
        this.isAuthenticated = true;
        localStorage.setItem('forga_session', JSON.stringify({ user, token }));
    }

    clearSession() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('forga_session');
    }

    // بدء تسجيل الدخول عبر Google
    loginWithGoogle() {
        const state = Math.random().toString(36).substring(2, 15);
        const nonce = Math.random().toString(36).substring(2, 15);
        
        const params = new URLSearchParams({
            client_id: AUTH_CONFIG.clientId,
            redirect_uri: AUTH_CONFIG.redirectUri,
            response_type: 'token id_token',
            scope: AUTH_CONFIG.scope,
            state: state,
            nonce: nonce,
            prompt: 'select_account'
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        window.location.href = authUrl;
    }

    // معالجة إعادة التوجيه من Google
    handleRedirect() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const idToken = params.get('id_token');
            
            if (accessToken) {
                // التحقق من المستخدم باستخدام ID Token
                this._verifyUser(idToken);
                return true;
            }
        }
        return false;
    }

    _verifyUser(idToken) {
        // في الإنتاج، يجب التحقق من ID Token على الخادم
        // هنا نقوم بمحاكاة بسيطة
        try {
            // فك تشفير JWT (محاكاة)
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            const user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            };
            
            this._saveSession(user, idToken);
            window.location.href = '/';
        } catch (e) {
            console.error('فشل التحقق من المستخدم:', e);
        }
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    logout() {
        this.clearSession();
        window.location.href = '/login.html';
    }
}

// ============================================================
// تهيئة مدير المصادقة
// ============================================================
const auth = new AuthManager();

// معالجة إعادة التوجيه في صفحة تسجيل الدخول
if (window.location.pathname.includes('login.html')) {
    if (auth.handleRedirect()) {
        // تم تسجيل الدخول بنجاح
    }
}

// زر تسجيل الدخول
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('googleLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            auth.loginWithGoogle();
        });
    }

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    // عرض البريد الإلكتروني
    const userEmail = document.getElementById('userEmail');
    if (userEmail && auth.isLoggedIn()) {
        const user = auth.getUser();
        userEmail.textContent = user?.email || 'مستخدم';
    }

    // التحقق من المصادقة
    if (!auth.isLoggedIn() && !window.location.pathname.includes('login.html')) {
        window.location.href = '/login.html';
    }
});