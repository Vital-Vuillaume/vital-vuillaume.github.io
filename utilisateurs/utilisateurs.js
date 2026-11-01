const panelAuth = window.VitaLoadPanelAuth;
const usersApp = document.getElementById('users-app');
const deniedState = document.getElementById('users-denied');
const deniedMessage = document.getElementById('users-denied-message');
const createUserForm = document.getElementById('create-user-form');
const createUserError = document.getElementById('create-user-error');
const usersList = document.getElementById('users-list');
const usersEmpty = document.getElementById('users-empty');
const usersStatus = document.getElementById('users-status');
const createRole = createUserForm.elements.role;
const createSiteInputs = [...createUserForm.querySelectorAll('input[name="allowedSites"]')];

function showDenied(message) {
  usersApp.hidden = true;
  deniedState.hidden = false;
  deniedMessage.textContent = message;
}

function updateCreateSites() {
  const isSuperadmin = createRole.value === 'superadmin';
  createSiteInputs.forEach((input) => {
    input.disabled = isSuperadmin;
    if (isSuperadmin) input.checked = false;
  });
}

function createSiteCheckbox(site, checked, disabled = false) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = 'allowedSites';
  input.value = site;
  input.checked = checked;
  input.disabled = disabled;
  const text = document.createElement('span');
  text.textContent = site === 'serveur' ? 'Serveur' : 'Stockage';
  label.append(input, text);
  return label;
}

function createUserRow(user, currentUser) {
  const row = document.createElement('article');
  row.className = 'user-row';

  const identity = document.createElement('div');
  identity.className = 'user-identity';
  const username = document.createElement('strong');
  username.textContent = user.username;
  const identityHint = document.createElement('span');
  identityHint.textContent = user.userId === currentUser.userId ? 'Compte connecté' : 'Compte utilisateur';
  identity.append(username, identityHint);

  const roleField = document.createElement('label');
  roleField.className = 'user-role-field';
  const roleLabel = document.createElement('span');
  roleLabel.textContent = 'Rôle';
  const role = document.createElement('select');
  role.className = 'vl-input';
  for (const [value, label] of [['admin', 'Admin'], ['superadmin', 'Superadmin']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    role.append(option);
  }
  role.value = user.role;
  if (user.username === 'vital' || (user.userId === currentUser.userId && currentUser.role === 'superadmin')) {
    role.disabled = true;
  }
  roleField.append(roleLabel, role);

  const siteAccess = document.createElement('fieldset');
  siteAccess.className = 'site-access-fields user-site-access';
  const siteLegend = document.createElement('legend');
  siteLegend.textContent = 'Sites';
  siteAccess.append(siteLegend);
  const siteInputs = ['serveur', 'stockage'].map((site) => {
    const inputLabel = createSiteCheckbox(site, user.allowedSites.includes(site), user.role === 'superadmin');
    const input = inputLabel.querySelector('input');
    siteAccess.append(inputLabel);
    return input;
  });
  role.addEventListener('change', () => {
    const isSuperadmin = role.value === 'superadmin';
    siteInputs.forEach((input) => {
      input.disabled = isSuperadmin;
      if (isSuperadmin) input.checked = false;
    });
  });

  const actions = document.createElement('div');
  actions.className = 'user-actions';
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'vl-button vl-button-secondary';
  save.textContent = 'Enregistrer';
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      await panelAuth.request(`/vital/api/panel/users/${encodeURIComponent(user.userId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: role.value,
          allowedSites: role.value === 'superadmin'
            ? []
            : siteInputs.filter((input) => input.checked).map((input) => input.value)
        })
      });
      setStatus(`Accès de « ${user.username} » mis à jour.`);
      await loadUsers(currentUser);
    } catch (error) {
      setStatus(error.message || 'Impossible de modifier ce compte.', true);
      save.disabled = false;
    }
  });
  actions.append(save);

  if (user.username !== 'vital' && user.userId !== currentUser.userId) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'vl-button vl-button-danger';
    remove.textContent = 'Supprimer';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Supprimer le compte « ${user.username} » et révoquer ses sessions ?`)) return;
      remove.disabled = true;
      try {
        await panelAuth.request(`/vital/api/panel/users/${encodeURIComponent(user.userId)}`, {
          method: 'DELETE'
        });
        setStatus(`Compte « ${user.username} » supprimé.`);
        await loadUsers(currentUser);
      } catch (error) {
        setStatus(error.message || 'Impossible de supprimer ce compte.', true);
        remove.disabled = false;
      }
    });
    actions.append(remove);
  }

  row.append(identity, roleField, siteAccess, actions);
  return row;
}

function setStatus(message, isError = false) {
  usersStatus.textContent = message;
  usersStatus.classList.toggle('is-error', isError);
}

async function loadUsers(currentUser) {
  const data = await panelAuth.request('/vital/api/panel/users');
  const fragment = document.createDocumentFragment();
  for (const user of data.users) fragment.append(createUserRow(user, currentUser));
  usersList.replaceChildren(fragment);
  usersEmpty.hidden = data.users.length > 0;
}

createRole.addEventListener('change', updateCreateSites);

createUserForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  createUserError.textContent = '';
  const submitButton = createUserForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const formData = new FormData(createUserForm);
  try {
    await panelAuth.request('/vital/api/panel/users', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role'),
        allowedSites: formData.getAll('allowedSites')
      })
    });
    createUserForm.reset();
    updateCreateSites();
    setStatus(`Compte « ${formData.get('username')} » créé.`);
    await loadUsers(currentSession);
  } catch (error) {
    createUserError.textContent = error.message || 'Impossible de créer ce compte.';
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById('refresh-users').addEventListener('click', () => {
  loadUsers(currentSession).catch((error) => setStatus(error.message, true));
});

let currentSession;

async function initialize() {
  try {
    currentSession = await panelAuth.requireSession();
    if (currentSession.role !== 'superadmin') {
      showDenied('Seul un compte superadmin peut gérer les utilisateurs.');
      return;
    }
    usersApp.hidden = false;
    updateCreateSites();
    await loadUsers(currentSession);
  } catch (error) {
    if (panelAuth.getSessionId()) showDenied(error.message || 'Impossible de vérifier les autorisations.');
  }
}

initialize();
