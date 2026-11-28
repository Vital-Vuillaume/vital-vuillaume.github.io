const panelAuth = window.VitaLoadPanelAuth;
const form = document.getElementById('login-form');
const errorMessage = document.getElementById('login-error');

function getSafeReturnPath(candidate) {
  if (!candidate) return null;
  try {
    const target = new URL(candidate, window.location.origin);
    const path = target.pathname.replace(/\/+$/, '') || '/';
    if (target.origin !== window.location.origin ||
        path === '/connexion' || path.startsWith('/connexion/')) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch (error) {
    console.error('Adresse de retour après connexion invalide :', error);
    return null;
  }
}

function redirectAfterLogin() {
  const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
  const returnPath =
    getSafeReturnPath(requestedPath) ||
    getSafeReturnPath(document.referrer) ||
    '/';
  window.location.replace(returnPath);
}

async function checkExistingSession() {
  const sessionId = panelAuth.getSessionId();
  if (!sessionId) return;

  try {
    await panelAuth.requireSession();
    redirectAfterLogin();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.textContent = '';
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(window.config.getApiUrl('/vital/api/panel/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.elements.username.value,
        password: form.elements.password.value
      })
    });
    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText };
      }
    }
    if (!response.ok) throw new Error(data.error || `Connexion impossible (${response.status}).`);

    localStorage.setItem(panelAuth.sessionKey, data.sessionId);
    redirectAfterLogin();
  } catch (error) {
    errorMessage.textContent = error.message || 'Le serveur est momentanément inaccessible.';
  } finally {
    submitButton.disabled = false;
  }
});

checkExistingSession();
