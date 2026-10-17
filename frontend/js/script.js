function getProjectTitle() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Accueil';

    const project = segments[0] === 'index.html'
        ? 'Accueil'
        : segments[segments.length - 1].endsWith('.html') && segments.length > 1
            ? segments[segments.length - 2]
            : segments[0];

    if (project === 'login') return 'Server · Connexion';
    return project
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function installVitaLoadHeader() {
    const existingHeader = document.querySelector('.vl-site-header, .topbar');
    const oldNavigation = document.querySelector('.nav');
    const accountElements = existingHeader
        ? Array.from(existingHeader.querySelectorAll('#username, #logout, .info, .logout'))
        : oldNavigation
            ? Array.from(oldNavigation.querySelectorAll('.info, .logout'))
            : [];
    const header = document.createElement('header');
    header.className = 'vl-site-header';

    const brand = document.createElement('a');
    brand.className = 'vl-site-brand';
    brand.href = '/';

    const siteName = document.createElement('span');
    siteName.className = 'vl-site-name';
    siteName.textContent = 'VitaLoad';

    const projectName = document.createElement('span');
    projectName.className = 'vl-project-name';
    projectName.textContent = getProjectTitle();
    brand.append(siteName, projectName);
    header.append(brand);

    const account = document.createElement('div');
    account.className = 'vl-header-account';
    for (const element of accountElements) account.append(element);

    const panelUsername = account.querySelector('#username') || document.createElement('span');
    panelUsername.classList.add('vl-panel-username');
    if (!panelUsername.id) panelUsername.textContent = '';
    const panelLogout = account.querySelector('#logout') || document.createElement('button');
    panelLogout.classList.add('vl-panel-logout', 'vl-button', 'vl-button-secondary');
    if (!panelLogout.id) {
        panelLogout.type = 'button';
        panelLogout.textContent = 'Déconnexion';
    }
    const panelLogin = document.createElement('a');
    panelLogin.className = 'vl-panel-login';
    panelLogin.href = '/connexion/';
    panelLogin.textContent = 'Connexion';
    panelLogin.hidden = true;

    const panelAccount = document.createElement('div');
    panelAccount.className = 'vl-panel-account';
    panelAccount.hidden = true;
    panelAccount.append(panelUsername, panelLogout);
    account.append(panelLogin, panelAccount);
    header.append(account);

    if (existingHeader) existingHeader.remove();
    if (oldNavigation) oldNavigation.remove();
    document.querySelector('.blockPage')?.closest('.description')?.remove();
    document.body.classList.add('vl-modern-page');
    document.body.prepend(header);
    return { panelUsername, panelLogout, panelLogin, panelAccount };
}

window.VitaLoadPanelAuth = {
    sessionKey: 'panel_session_id',
    getSessionId() {
        return localStorage.getItem(this.sessionKey);
    },
    clearSession() {
        localStorage.removeItem(this.sessionKey);
    },
    async request(url, options = {}) {
        const sessionId = this.getSessionId();
        if (!sessionId) {
            this.clearSession();
            window.location.replace('/connexion/');
            throw new Error('Connexion requise.');
        }

        const headers = new Headers(options.headers || {});
        headers.set('X-Panel-Session', sessionId);
        if (options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const requestUrl = window.config && window.config.getApiUrl &&
            url.startsWith('/vital/api/')
            ? window.config.getApiUrl(url)
            : url;
        const response = await fetch(requestUrl, { ...options, headers });
        const responseText = await response.text();
        let data = {};
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data = { error: responseText };
            }
        }

        if (response.status === 401) {
            this.clearSession();
            window.location.replace('/connexion/');
            throw new Error('Votre session a expiré.');
        }
        if (!response.ok) {
            throw new Error(data.error || `La requête a échoué (${response.status}).`);
        }
        return data;
    },
    async requireSession() {
        const session = await this.request('/vital/api/panel/auth/session');
        return session;
    }
};

const panelHeader = installVitaLoadHeader();
const info = document.querySelector(".info");
const logout = document.querySelector(".logout");
const blockPage = document.querySelector(".blockPage");

async function updatePanelHeader() {
    const sessionId = window.VitaLoadPanelAuth.getSessionId();
    if (!sessionId) {
        panelHeader.panelLogin.hidden = false;
        panelHeader.panelAccount.hidden = true;
        return;
    }

    try {
        const response = await fetch(window.config.getApiUrl('/vital/api/panel/auth/session'), {
            headers: { 'X-Panel-Session': sessionId }
        });
        const responseText = await response.text();
        let data = {};
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(responseText);
            }
        }
        if (response.status === 401) {
            window.VitaLoadPanelAuth.clearSession();
            panelHeader.panelLogin.hidden = false;
            panelHeader.panelAccount.hidden = true;
            return;
        }
        if (!response.ok) {
            throw new Error(data.error || `Vérification impossible (${response.status}).`);
        }

        panelHeader.panelUsername.textContent = data.username;
        panelHeader.panelAccount.hidden = false;
        panelHeader.panelLogin.hidden = true;
    } catch (error) {
        console.error('Impossible de vérifier la session VitaLoad :', error);
        panelHeader.panelUsername.textContent = 'Session indisponible';
        panelHeader.panelAccount.hidden = false;
        panelHeader.panelLogin.hidden = true;
    }
}

if (!panelHeader.panelLogout.id) {
    panelHeader.panelLogout.addEventListener('click', async () => {
        panelHeader.panelLogout.disabled = true;
        try {
            await window.VitaLoadPanelAuth.request('/vital/api/panel/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Erreur lors de la déconnexion du panneau :', error);
        } finally {
            window.VitaLoadPanelAuth.clearSession();
            window.location.reload();
        }
    });
}

updatePanelHeader();

let userId = localStorage.getItem('user_id');

async function getUserInfo() {
    if (!userId) {
        SignInText();
        return null;
    }
    try {
        const res = await fetch(`https://${window.config.ipServer}/profile/${userId}`);
        const data = await res.json();

        if (data.success) {
            logout.textContent = "Log Out";
            const username = data.user.username;
            info.textContent = username;
            info.href = `${window.location.origin}/profile/#${username}`;

            return username;
        } else {
            console.error("Erreur :", data);
            SignInText();
            return null;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        SignInText();

        return null;
    }
}

if (info && logout) getUserInfo();

function SignInText() {
    if (logout) logout.style.display = "none";
    if (info) {
        info.textContent = "Login";
        info.href = `${window.location.origin}/login`;
    }
}

if (logout) {
    logout.addEventListener('click', () => {
        localStorage.removeItem('user_id');
        location.reload();
    });
}

const logoBlock = document.querySelector(".logoBlock");

if (logoBlock) {
    logoBlock.addEventListener('click', () => {
        window.location.href = window.location.origin;
    });
}

if (blockPage) {
    blockPage.addEventListener('click', () => {
        window.location.href = window.location.href.split('#')[0]
    });
}

const titleNav = document.querySelector(".titleNav");

const infoPage = document.querySelector(".infoPage");

const titlePage = getProjectTitle();

if (infoPage) {
    if (titlePage == "") {
        infoPage.textContent = "Home";
    } else {
        infoPage.textContent = titlePage;
    }
}

document.title = `VitaLoad ${titlePage}`;

const production = document.querySelector(".production");

if (production) {
    production.textContent = `ⓒ ${new Date().getFullYear()} - Vital production`;
}