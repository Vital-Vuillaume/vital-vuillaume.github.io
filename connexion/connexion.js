const panelAuth = window.VitaLoadPanelAuth;
const form = document.getElementById('login-form');
const errorMessage = document.getElementById('login-error');

async function checkExistingSession() {
  const sessionId = panelAuth.getSessionId();
  if (!sessionId) return;

  try {
    await panelAuth.requireSession();
    window.location.replace('/');
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
    window.location.replace('/');
  } catch (error) {
    errorMessage.textContent = error.message || 'Le serveur est momentanément inaccessible.';
  } finally {
    submitButton.disabled = false;
  }
});

checkExistingSession();
