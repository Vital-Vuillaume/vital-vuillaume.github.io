const panelAuth = window.VitaLoadPanelAuth;
const storageApp = document.getElementById('storage-app');
const loadingState = document.getElementById('storage-loading');
const deniedState = document.getElementById('storage-denied');
const deniedMessage = document.getElementById('storage-denied-message');
const messageItemsContainer = document.getElementById('message-items');
const fileItemsContainer = document.getElementById('file-items');
const messagesEmptyState = document.getElementById('messages-empty');
const filesEmptyState = document.getElementById('files-empty');
const messageStatus = document.getElementById('storage-message');
const breadcrumbs = document.getElementById('storage-breadcrumbs');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-content');
const uploadInput = document.getElementById('storage-upload-input');
const directoryUploadInput = document.getElementById('storage-directory-input');
const uploadButton = document.getElementById('storage-attach');
const sendButton = document.getElementById('send-message');
const selectedFilesLabel = document.getElementById('selected-files');
const deleteDialog = document.getElementById('delete-dialog');
const deleteForm = document.getElementById('delete-form');
const deleteDescription = document.getElementById('delete-description');
const renameDialog = document.getElementById('rename-dialog');
const renameForm = document.getElementById('rename-form');
const renameInput = document.getElementById('rename-input');
const renameError = document.getElementById('rename-error');
const renameTitle = document.getElementById('rename-title');
const renameEyebrow = document.getElementById('rename-eyebrow');
const renameLabel = document.getElementById('rename-label');
const messageEditDialog = document.getElementById('message-edit-dialog');
const messageEditForm = document.getElementById('message-edit-form');
const messageEditInput = document.getElementById('message-edit-input');
const messageEditError = document.getElementById('message-edit-error');
const messageEditConfirm = document.getElementById('message-edit-confirm');
const pageSize = 50;
let selectedDeleteItem = null;
let selectedRenameItem = null;
let selectedMessage = null;
let renameDialogMode = 'rename';
let renderedItemCount = 0;
let activeStorageTab = 'message';
let currentPath = '';
let statusTimeout;
let hideTimeout;

function notify(message, type = 'success') {
  clearTimeout(statusTimeout);
  clearTimeout(hideTimeout);
  messageStatus.textContent = message;
  messageStatus.classList.toggle('is-error', type === 'error');
  messageStatus.hidden = false;
  messageStatus.classList.remove('is-visible');
  requestAnimationFrame(() => messageStatus.classList.add('is-visible'));
  statusTimeout = setTimeout(() => {
    messageStatus.classList.remove('is-visible');
    hideTimeout = setTimeout(() => {
      messageStatus.hidden = true;
      messageStatus.textContent = '';
    }, 220);
  }, type === 'error' ? 6000 : 3200);
}

function clearNotification() {
  clearTimeout(statusTimeout);
  clearTimeout(hideTimeout);
  messageStatus.classList.remove('is-visible', 'is-error');
  messageStatus.hidden = true;
  messageStatus.textContent = '';
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['o', 'Kio', 'Mio', 'Gio'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 || value >= 100 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('fr-CH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function updateQuota(usage) {
  const percent = usage.quotaBytes > 0
    ? Math.min(100, Math.max(0, usage.usedBytes / usage.quotaBytes * 100))
    : 0;
  const fill = document.getElementById('quota-fill');
  const bar = document.getElementById('quota-bar');
  fill.style.width = `${percent}%`;
  fill.classList.toggle('is-near-limit', percent >= 80);
  bar.setAttribute('aria-valuenow', String(Math.round(percent)));
  document.getElementById('quota-remaining').textContent = `${formatBytes(usage.remainingBytes)} restant`;
  document.getElementById('quota-summary').textContent =
    `${formatBytes(usage.usedBytes)} utilisés sur ${formatBytes(usage.quotaBytes)}`;
}

function createDownloadButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-action';
  button.textContent = '↓';
  button.setAttribute('aria-label', 'Télécharger');
  button.title = 'Télécharger';
  button.addEventListener('click', () => downloadFile(item));
  return button;
}

async function downloadFile(item) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = window.config.getApiUrl(
    `/vital/api/panel/storage/files/${encodeURIComponent(item.id)}/download`
  );
  form.target = 'storage-download-frame';
  form.hidden = true;
  const sessionField = document.createElement('input');
  sessionField.type = 'hidden';
  sessionField.name = 'sessionId';
  sessionField.value = panelAuth.getSessionId();
  form.append(sessionField);
  document.body.append(form);
  form.submit();
  form.remove();
  notify(`Téléchargement de « ${item.name} » lancé.`);
}

function createDeleteButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'delete-item';
  button.textContent = 'Supprimer';
  button.addEventListener('click', () => {
    selectedDeleteItem = item;
    if (item.type === 'folder') {
      deleteDescription.textContent = `Le dossier « ${item.name} » ne peut être supprimé que lorsqu’il est vide.`;
    } else if (item.type === 'file') {
      deleteDescription.textContent = `« ${item.name} » sera définitivement supprimé et ${formatBytes(item.sizeBytes)} seront libérés.`;
    } else {
      deleteDescription.textContent = 'Ce message sera définitivement supprimé et son contenu retiré du calcul du quota.';
    }
    deleteDialog.showModal();
  });
  return button;
}

function createRenameButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-action';
  button.textContent = '✎';
  button.setAttribute('aria-label', 'Renommer');
  button.title = 'Renommer';
  button.addEventListener('click', () => {
    renameDialogMode = 'rename';
    selectedRenameItem = item;
    renameInput.value = item.name;
    renameInput.placeholder = 'Nouveau nom';
    renameError.textContent = '';
    renameEyebrow.textContent = item.type === 'folder' ? 'Dossier' : 'Fichier';
    renameTitle.textContent = `Renommer le ${item.type === 'folder' ? 'dossier' : 'fichier'}`;
    renameLabel.textContent = `Nouveau nom du ${item.type === 'folder' ? 'dossier' : 'fichier'}`;
    document.getElementById('rename-confirm').textContent = 'Renommer';
    renameInput.required = true;
    renameDialog.showModal();
    renameInput.focus();
    renameInput.select();
  });
  return button;
}

function createMoveButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'file-action';
  button.textContent = '↗';
  button.setAttribute('aria-label', 'Déplacer');
  button.title = 'Déplacer';
  button.addEventListener('click', () => {
    renameDialogMode = 'move';
    selectedRenameItem = item;
    renameInput.value = currentPath;
    renameInput.placeholder = 'Ex. projets/images';
    renameError.textContent = '';
    renameEyebrow.textContent = item.type === 'folder' ? 'Dossier' : 'Fichier';
    renameTitle.textContent = `Déplacer le ${item.type === 'folder' ? 'dossier' : 'fichier'}`;
    renameLabel.textContent = 'Chemin du dossier de destination (vide pour la racine)';
    document.getElementById('rename-confirm').textContent = 'Déplacer';
    renameInput.required = false;
    renameDialog.showModal();
    renameInput.focus();
    renameInput.select();
  });
  return button;
}

function fileIcon(item) {
  if (typeof item.mimeType === 'string' && item.mimeType.startsWith('image/')) return '🖼️';
  const extension = item.name.split('.').pop().toLowerCase();
  if (['zip', 'gz', 'tar', '7z', 'rar'].includes(extension)) return '📦';
  if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm'].includes(extension)) return '🎞️';
  if (['js', 'ts', 'html', 'css', 'json', 'md', 'txt', 'py'].includes(extension)) return '📄';
  return '📃';
}

function createFileCard(item) {
  const card = document.createElement('article');
  card.className = 'file-card';
  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'file-open';
  openButton.setAttribute(
    'aria-label',
    item.type === 'folder' ? `Ouvrir le dossier ${item.name}` : `Télécharger ${item.name}`
  );
  const icon = document.createElement('span');
  icon.className = 'file-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = item.type === 'folder' ? '📁' : fileIcon(item);

  const name = document.createElement('strong');
  name.textContent = item.name;
  name.className = 'file-name';
  const size = document.createElement('span');
  size.className = 'file-size';
  size.textContent = item.type === 'folder' ? 'Dossier' : formatBytes(item.sizeBytes);
  openButton.append(icon, name, size);
  openButton.addEventListener('click', () => {
    if (item.type === 'folder') {
      currentPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      renderedItemCount = 0;
      loadStorage();
    } else {
      downloadFile(item);
    }
  });

  const actions = document.createElement('div');
  actions.className = 'file-actions';
  const actionButtons = [];
  if (item.type === 'file') actionButtons.push(createDownloadButton(item));
  actionButtons.push(createRenameButton(item), createMoveButton(item), createDeleteButton(item));
  actionButtons.forEach((button) => {
    const isDeleteButton = button.classList.contains('delete-item');
    button.classList.remove('file-action', 'delete-item');
    button.classList.add('vl-button', 'vl-button-secondary', 'item-action');
    if (isDeleteButton) {
      button.classList.add('vl-button-danger');
      button.textContent = '🗑';
      button.setAttribute('aria-label', 'Supprimer');
      button.title = 'Supprimer';
    }
    actions.append(button);
  });
  card.append(openButton, actions);
  return card;
}

function renderBreadcrumbs() {
  breadcrumbs.replaceChildren();
  const root = document.createElement('button');
  root.type = 'button';
  root.className = 'breadcrumb';
  root.textContent = 'Stockage';
  root.addEventListener('click', () => {
    currentPath = '';
    renderedItemCount = 0;
    loadStorage();
  });
  breadcrumbs.append(root);

  let folderPath = '';
  for (const segment of currentPath ? currentPath.split('/') : []) {
    breadcrumbs.append(document.createTextNode(' / '));
    folderPath = folderPath ? `${folderPath}/${segment}` : segment;
    const destination = folderPath;
    const crumb = document.createElement('button');
    crumb.type = 'button';
    crumb.className = 'breadcrumb';
    crumb.textContent = segment;
    crumb.addEventListener('click', () => {
      currentPath = destination;
      renderedItemCount = 0;
      loadStorage();
    });
    breadcrumbs.append(crumb);
  }
}

function renderMessages(items, prepend = false) {
  if (!prepend) messageItemsContainer.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const bubble = document.createElement('article');
    bubble.className = 'storage-item message-item';
    const heading = document.createElement('div');
    heading.className = 'item-heading';
    const type = document.createElement('span');
    type.className = 'item-type';
    type.textContent = 'Message';
    const date = document.createElement('time');
    date.dateTime = new Date(item.createdAt).toISOString();
    date.textContent = formatDate(item.createdAt);
    heading.append(type, date);
    bubble.append(heading);

    const content = document.createElement('p');
    content.className = 'message-text';
    content.textContent = item.content;
    bubble.append(content);
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'file-action vl-button vl-button-secondary';
    editButton.textContent = 'Modifier';
    editButton.addEventListener('click', () => {
      selectedMessage = item;
      messageEditInput.value = item.content;
      messageEditError.textContent = '';
      messageEditDialog.showModal();
      messageEditInput.focus();
      messageEditInput.select();
    });
    actions.append(editButton, createDeleteButton(item));
    bubble.append(actions);
    fragment.append(bubble);
  }
  if (prepend) messageItemsContainer.prepend(fragment);
  else messageItemsContainer.append(fragment);
}

function renderFiles(items, prepend = false) {
  if (!prepend) fileItemsContainer.replaceChildren();
  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(createFileCard(item)));
  if (prepend) fileItemsContainer.prepend(fragment);
  else fileItemsContainer.append(fragment);
}

async function loadStorage({ older = false } = {}) {
  try {
    const offset = older ? renderedItemCount : 0;
    const data = activeStorageTab === 'file'
      ? await panelAuth.request(
        `/vital/api/panel/storage/explorer?path=${encodeURIComponent(currentPath)}&limit=${pageSize}&offset=${offset}`
      )
      : await panelAuth.request(
        `/vital/api/panel/storage?type=message&limit=${pageSize}&offset=${offset}`
      );
    updateQuota(data);
    const label = activeStorageTab === 'message' ? 'message' : 'élément';
    document.getElementById('item-count').textContent =
      `${data.itemCount} ${label}${data.itemCount === 1 ? '' : 's'}`;
    const container = activeStorageTab === 'message' ? messageItemsContainer : fileItemsContainer;
    const previousHeight = container.scrollHeight;
    if (!older) renderedItemCount = 0;
    if (activeStorageTab === 'message') {
      renderMessages(data.items, older);
      messagesEmptyState.hidden = data.itemCount > 0;
      document.getElementById('load-messages-older').hidden = !data.hasMore;
    } else {
      currentPath = data.path;
      renderBreadcrumbs();
      renderFiles(data.items, older);
      filesEmptyState.textContent = currentPath ? 'Ce dossier est vide.' : 'Aucun fichier ou dossier dans Stockage.';
      filesEmptyState.hidden = data.itemCount > 0;
      document.getElementById('load-files-older').hidden = !data.hasMore;
    }
    renderedItemCount = older ? renderedItemCount + data.items.length : data.items.length;
    if (older && activeStorageTab === 'message') {
      container.scrollTop += container.scrollHeight - previousHeight;
    } else if (!older && activeStorageTab === 'message') {
      container.scrollTop = container.scrollHeight;
    }
    return true;
  } catch (error) {
    notify(error.message, 'error');
    return false;
  }
}

function showDenied(message) {
  loadingState.hidden = true;
  storageApp.hidden = true;
  deniedState.hidden = false;
  deniedMessage.textContent = message;
}

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = messageInput.value;
  if (!content.trim()) {
    notify('Écris un message avant de l’envoyer.', 'error');
    messageInput.focus();
    return;
  }
  sendButton.disabled = true;
  try {
    await panelAuth.request('/vital/api/panel/storage/messages', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    messageInput.value = '';
    await loadStorage();
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    sendButton.disabled = false;
  }
});

document.getElementById('storage-attach').addEventListener('click', () => uploadInput.click());
async function ensureDirectory(folderPath) {
  let parentPath = currentPath;
  for (const name of folderPath.split('/').filter(Boolean)) {
    let offset = 0;
    let exists = false;
    while (true) {
      const listing = await panelAuth.request(
        `/vital/api/panel/storage/explorer?path=${encodeURIComponent(parentPath)}&limit=100&offset=${offset}`
      );
      const matching = listing.items.find((item) => item.name === name);
      if (matching) {
        if (matching.type !== 'folder') throw new Error(`« ${name} » existe déjà comme fichier.`);
        exists = true;
        break;
      }
      if (!listing.hasMore) break;
      offset += listing.items.length;
    }
    if (!exists) {
      await panelAuth.request('/vital/api/panel/storage/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parentPath })
      });
    }
    parentPath = parentPath ? `${parentPath}/${name}` : name;
  }
}

async function uploadFiles(files, preserveFolders = false) {
  if (files.length === 0) return;
  selectedFilesLabel.textContent = `${files.length} fichier${files.length === 1 ? '' : 's'} sélectionné${files.length === 1 ? '' : 's'}`;

  uploadButton.disabled = true;
  document.getElementById('storage-import-directory').disabled = true;
  let uploadedCount = 0;
  try {
    const groupedFiles = new Map();
    for (const file of files) {
      const segments = preserveFolders && file.webkitRelativePath
        ? file.webkitRelativePath.split('/').filter(Boolean).slice(1, -1)
        : [];
      const folderPath = segments.join('/');
      if (!groupedFiles.has(folderPath)) groupedFiles.set(folderPath, []);
      groupedFiles.get(folderPath).push(file);
    }

    for (const [relativePath, grouped] of groupedFiles) {
      if (preserveFolders && relativePath) await ensureDirectory(relativePath);
      const targetPath = relativePath
        ? (currentPath ? `${currentPath}/${relativePath}` : relativePath)
        : currentPath;
      for (let start = 0; start < grouped.length; start += 100) {
        const batch = grouped.slice(start, start + 100);
        const body = new FormData();
        batch.forEach((file) => body.append('files', file));
        const result = await panelAuth.request(
          `/vital/api/panel/storage/upload?path=${encodeURIComponent(targetPath)}`, {
            method: 'POST',
            body
          }
        );
        uploadedCount += result.uploaded;
      }
    }
    notify(`${uploadedCount} fichier${uploadedCount === 1 ? '' : 's'} ajouté${uploadedCount === 1 ? '' : 's'}.`);
    await loadStorage();
  } catch (error) {
    const detail = uploadedCount
      ? `Import interrompu après ${uploadedCount} fichier${uploadedCount === 1 ? '' : 's'} : ${error.message}`
      : error.message;
    notify(detail, 'error');
  } finally {
    uploadButton.disabled = false;
    document.getElementById('storage-import-directory').disabled = false;
    selectedFilesLabel.textContent = 'Images et fichiers · 5 Gio au total';
  }
}

uploadInput.addEventListener('change', async () => {
  const files = Array.from(uploadInput.files || []);
  uploadInput.value = '';
  await uploadFiles(files);
});

document.getElementById('storage-import-directory').addEventListener('click', () => {
  directoryUploadInput.click();
});
directoryUploadInput.addEventListener('change', async () => {
  const files = Array.from(directoryUploadInput.files || []);
  directoryUploadInput.value = '';
  await uploadFiles(files, true);
});

uploadInput.addEventListener('input', () => {
  const count = uploadInput.files?.length || directoryUploadInput.files?.length || 0;
  selectedFilesLabel.textContent = count
    ? `${count} fichier${count === 1 ? '' : 's'} sélectionné${count === 1 ? '' : 's'}`
    : 'Images et fichiers · 5 Gio au total';
});

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedDeleteItem) return;
  const item = selectedDeleteItem;
  selectedDeleteItem = null;
  deleteDialog.close();
  try {
    await panelAuth.request(`/vital/api/panel/storage/${encodeURIComponent(item.id)}`, {
      method: 'DELETE'
    });
    notify(item.type === 'folder' ? 'Dossier supprimé.' : 'Élément supprimé et espace libéré.');
    await loadStorage();
  } catch (error) {
    notify(error.message, 'error');
  }
});

document.getElementById('delete-cancel').addEventListener('click', () => deleteDialog.close());
document.getElementById('rename-cancel').addEventListener('click', () => renameDialog.close());
renameForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const isCreateFolder = renameDialogMode === 'create-folder';
  if (!isCreateFolder && !selectedRenameItem) return;
  const item = selectedRenameItem;
  const value = renameInput.value.trim();
  if (!value && renameDialogMode !== 'move') {
    renameError.textContent = isCreateFolder ? 'Saisis le nom du dossier.' : 'Saisis un nom.';
    renameInput.focus();
    return;
  }

  const confirmButton = document.getElementById('rename-confirm');
  confirmButton.disabled = true;
  renameError.textContent = '';
  try {
    if (isCreateFolder) {
      await panelAuth.request('/vital/api/panel/storage/folders', {
        method: 'POST',
        body: JSON.stringify({ name: value, parentPath: currentPath })
      });
    } else {
      await panelAuth.request(`/vital/api/panel/storage/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(renameDialogMode === 'move'
          ? { type: item.type, parentPath: value }
          : { type: item.type, name: value })
      });
    }
    selectedRenameItem = null;
    renameDialog.close();
    notify(isCreateFolder ? `Dossier « ${value} » créé.` : renameDialogMode === 'move'
      ? 'Élément déplacé.'
      : `${item.type === 'folder' ? 'Dossier' : 'Fichier'} renommé.`);
    await loadStorage();
  } catch (error) {
    renameError.textContent = error.message;
  } finally {
    confirmButton.disabled = false;
  }
});

document.getElementById('new-storage-folder').addEventListener('click', () => {
  renameDialogMode = 'create-folder';
  selectedRenameItem = null;
  renameInput.value = '';
  renameInput.placeholder = 'Nom du dossier';
  renameError.textContent = '';
  renameEyebrow.textContent = 'Explorateur Stockage';
  renameTitle.textContent = 'Créer un dossier';
  renameLabel.textContent = 'Nom du nouveau dossier';
  document.getElementById('rename-confirm').textContent = 'Créer';
  renameInput.required = true;
  renameDialog.showModal();
  renameInput.focus();
});

document.getElementById('message-edit-cancel').addEventListener('click', () => {
  selectedMessage = null;
  messageEditDialog.close();
});
messageEditForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedMessage) return;
  const content = messageEditInput.value;
  if (!content.trim()) {
    messageEditError.textContent = 'Écris un message avant de l’enregistrer.';
    messageEditInput.focus();
    return;
  }
  messageEditConfirm.disabled = true;
  messageEditError.textContent = '';
  try {
    await panelAuth.request(`/vital/api/panel/storage/messages/${encodeURIComponent(selectedMessage.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    });
    selectedMessage = null;
    messageEditDialog.close();
    await loadStorage();
  } catch (error) {
    messageEditError.textContent = error.message;
  } finally {
    messageEditConfirm.disabled = false;
  }
});

function selectStorageTab(tab) {
  activeStorageTab = tab;
  const isMessages = tab === 'message';
  const messagesTab = document.getElementById('messages-tab');
  const filesTab = document.getElementById('files-tab');
  messagesTab.classList.toggle('is-active', isMessages);
  messagesTab.setAttribute('aria-selected', String(isMessages));
  filesTab.classList.toggle('is-active', !isMessages);
  filesTab.setAttribute('aria-selected', String(!isMessages));
  document.getElementById('messages-panel').hidden = !isMessages;
  document.getElementById('files-panel').hidden = isMessages;
  document.getElementById('storage-section-title').textContent = isMessages ? 'Messages' : 'Fichiers';
  document.getElementById('files-empty').textContent = currentPath
    ? 'Ce dossier est vide.'
    : 'Aucun fichier ou dossier dans Stockage.';
  renderedItemCount = 0;
  clearNotification();
  loadStorage();
}

document.getElementById('messages-tab').addEventListener('click', () => selectStorageTab('message'));
document.getElementById('files-tab').addEventListener('click', () => selectStorageTab('file'));
document.getElementById('storage-refresh').addEventListener('click', () => {
  clearNotification();
  loadStorage();
});
document.getElementById('load-messages-older').addEventListener('click', () => loadStorage({ older: true }));
document.getElementById('load-files-older').addEventListener('click', () => loadStorage({ older: true }));

async function initialize() {
  try {
    const session = await panelAuth.requireSession();
    if (session.username !== 'admin') {
      showDenied('Seul le compte nommé « admin » peut accéder à cet espace.');
      return;
    }
    await panelAuth.request('/vital/api/panel/storage/access');
    loadingState.hidden = true;
    storageApp.hidden = false;
    await loadStorage();
  } catch (error) {
    if (error.message.includes('Accès réservé')) {
      showDenied(error.message);
      return;
    }
    showDenied(error.message || 'Impossible de vérifier les droits administrateur.');
  }
}

initialize();
