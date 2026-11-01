const panelAuth = window.VitaLoadPanelAuth;
const storageApp = document.getElementById('storage-app');
const deniedState = document.getElementById('storage-denied');
const deniedMessage = document.getElementById('storage-denied-message');
const messageItemsContainer = document.getElementById('message-items');
const fileItemsContainer = document.getElementById('file-items');
const trashItemsContainer = document.getElementById('trash-items');
const messagesEmptyState = document.getElementById('messages-empty');
const filesEmptyState = document.getElementById('files-empty');
const trashEmptyState = document.getElementById('trash-empty');
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
const fileEditorPanel = document.getElementById('file-editor-panel');
const fileEditTitle = document.getElementById('file-editor-title');
const fileEditInput = document.getElementById('file-edit-input');
const fileEditError = document.getElementById('file-edit-error');
const fileEditSave = document.getElementById('save-storage-file');
const fileEditCancel = document.getElementById('cancel-storage-file-changes');
const storageSearchInput = document.getElementById('storage-search');
const storageSortSelect = document.getElementById('storage-sort');
const filePreviewDialog = document.getElementById('file-preview-dialog');
const filePreviewTitle = document.getElementById('file-preview-title');
const filePreviewBody = document.getElementById('file-preview-body');
const pageSize = 50;
const storageTabKey = 'vitaload_storage_active_tab';
let selectedDeleteItem = null;
let deleteFromTrash = false;
let selectedTrashItem = null;
let selectedRenameItem = null;
let selectedMessage = null;
let selectedStorageFile = null;
let savedFileContent = '';
let renameDialogMode = 'rename';
let renderedItemCount = 0;
const savedStorageTab = localStorage.getItem(storageTabKey);
let activeStorageTab = ['file', 'trash'].includes(savedStorageTab) ? savedStorageTab : 'message';
let currentPath = '';
let statusTimeout;
let searchTimeout;
let previewObjectUrl = '';
let previewRequest = 0;

function notify(message, type = 'success') {
  clearTimeout(statusTimeout);
  messageStatus.textContent = message;
  messageStatus.classList.toggle('is-error', type === 'error');
  messageStatus.hidden = false;
  statusTimeout = setTimeout(() => {
    messageStatus.hidden = true;
    messageStatus.textContent = '';
  }, type === 'error' ? 6000 : 3200);
}

function clearNotification() {
  clearTimeout(statusTimeout);
  messageStatus.classList.remove('is-error');
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

function setQuotaProgress(trackId, fillId, percentId, percent) {
  const boundedPercent = Math.min(100, Math.max(0, percent));
  const formattedPercent = `${boundedPercent.toFixed(boundedPercent % 1 === 0 ? 0 : 1)} %`;
  const track = document.getElementById(trackId);
  const fill = document.getElementById(fillId);
  fill.style.width = `${boundedPercent}%`;
  fill.classList.toggle('is-near-limit', boundedPercent >= 80);
  track.setAttribute('aria-valuenow', String(Math.round(boundedPercent)));
  document.getElementById(percentId).textContent = formattedPercent;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('fr-CH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function updateQuota(usage) {
  const percentOfQuota = (bytes) => usage.quotaBytes > 0 ? bytes / usage.quotaBytes * 100 : 0;
  const percent = percentOfQuota(usage.usedBytes);
  const fill = document.getElementById('quota-fill');
  const bar = document.getElementById('quota-bar');
  fill.style.width = `${percent}%`;
  fill.classList.toggle('is-near-limit', percent >= 80);
  bar.setAttribute('aria-valuenow', String(Math.round(percent)));
  document.getElementById('quota-remaining').textContent = `${formatBytes(usage.remainingBytes)} restant`;
  document.getElementById('quota-summary').textContent =
    `${formatBytes(usage.usedBytes)} utilisés sur ${formatBytes(usage.quotaBytes)}`;
  document.getElementById('quota-files-size').textContent = formatBytes(usage.fileBytes);
  document.getElementById('quota-files-count').textContent =
    `${usage.fileCount} fichier${usage.fileCount === 1 ? '' : 's'}`;
  document.getElementById('quota-messages-size').textContent = formatBytes(usage.messageBytes);
  document.getElementById('quota-messages-count').textContent =
    `${usage.messageCount} message${usage.messageCount === 1 ? '' : 's'}`;
  document.getElementById('quota-used-detail').textContent = formatBytes(usage.usedBytes);
  document.getElementById('quota-remaining-detail').textContent = formatBytes(usage.remainingBytes);
  document.getElementById('quota-capacity-detail').textContent = formatBytes(usage.quotaBytes);
  document.getElementById('quota-overview').textContent =
    `${formatBytes(usage.usedBytes)} utilisés sur ${formatBytes(usage.quotaBytes)}`;
  setQuotaProgress(
    'quota-total-track',
    'quota-total-fill',
    'quota-used-percent',
    percent
  );
  setQuotaProgress(
    'quota-files-track',
    'quota-files-fill',
    'quota-files-percent',
    percentOfQuota(usage.fileBytes)
  );
  setQuotaProgress(
    'quota-messages-track',
    'quota-messages-fill',
    'quota-messages-percent',
    percentOfQuota(usage.messageBytes)
  );
}

function createDownloadButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vl-button vl-button-secondary item-action item-action-download';
  button.textContent = '↓';
  const label = item.type === 'folder' ? 'Télécharger le dossier' : 'Télécharger';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', (event) => event.stopPropagation());
  button.addEventListener('click', () => downloadFile(item));
  return button;
}

async function downloadFile(item) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = window.config.getApiUrl(
    `/vital/api/panel/storage/${item.type === 'folder' ? 'folders' : 'files'}/${encodeURIComponent(item.id)}/download`
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

function previewKind(item) {
  if (typeof item.mimeType !== 'string') return null;
  if (['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'].includes(item.mimeType)) return 'image';
  if (item.mimeType === 'application/pdf') return 'pdf';
  if (['video/mp4', 'video/webm', 'video/ogg'].includes(item.mimeType)) return 'video';
  return null;
}

async function previewFile(item, kind) {
  const requestId = ++previewRequest;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = '';
  filePreviewTitle.textContent = item.name;
  filePreviewBody.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'file-preview-loading';
  loading.textContent = 'Chargement de l’aperçu…';
  filePreviewBody.append(loading);
  if (!filePreviewDialog.open) filePreviewDialog.showModal();

  try {
    const sessionId = panelAuth.getSessionId();
    if (!sessionId) throw new Error('Connexion requise.');
    const response = await fetch(
      window.config.getApiUrl(`/vital/api/panel/storage/files/${encodeURIComponent(item.id)}?inline=1`),
      { headers: { 'X-Panel-Session': sessionId } }
    );
    if (!response.ok) {
      if (response.status === 401) {
        panelAuth.clearSession();
        window.location.replace('/connexion/');
        throw new Error('Votre session a expiré.');
      }
      const responseText = await response.text();
      let message = `Impossible de charger l’aperçu (${response.status}).`;
      try {
        message = JSON.parse(responseText).error || message;
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    if (requestId !== previewRequest || !filePreviewDialog.open) {
      URL.revokeObjectURL(objectUrl);
      return;
    }
    previewObjectUrl = objectUrl;
    const preview = document.createElement(kind === 'image' ? 'img' : kind === 'video' ? 'video' : 'iframe');
    preview.className = `file-preview-media file-preview-${kind}`;
    if (kind === 'image') {
      preview.alt = item.name;
    } else if (kind === 'video') {
      preview.controls = true;
      preview.preload = 'metadata';
    } else {
      preview.title = `Aperçu de ${item.name}`;
    }
    preview.src = previewObjectUrl;
    filePreviewBody.replaceChildren(preview);
  } catch (error) {
    if (requestId !== previewRequest || !filePreviewDialog.open) return;
    const message = document.createElement('p');
    message.className = 'file-preview-error';
    message.textContent = error.message || 'Impossible de charger l’aperçu.';
    filePreviewBody.replaceChildren(message);
  }
}

function createDeleteButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vl-button vl-button-secondary item-action vl-button-danger';
  button.textContent = '🗑';
  button.setAttribute('aria-label', 'Supprimer');
  button.title = 'Supprimer';
  button.addEventListener('click', (event) => event.stopPropagation());
  button.addEventListener('click', () => {
    selectedDeleteItem = item;
    deleteFromTrash = false;
    document.getElementById('delete-dialog-title').textContent = 'Mettre dans la corbeille ?';
    document.getElementById('delete-confirm').textContent = 'Mettre dans la corbeille';
    if (item.type === 'folder') {
      deleteDescription.textContent = `Le dossier « ${item.name} » et tout son contenu seront déplacés dans la corbeille.`;
    } else if (item.type === 'file') {
      deleteDescription.textContent = `« ${item.name} » sera déplacé dans la corbeille. L’espace restera compté dans le quota jusqu’à sa suppression définitive.`;
    } else {
      deleteDescription.textContent = 'Ce message sera déplacé dans la corbeille et pourra être restauré.';
    }
    deleteDialog.showModal();
  });
  return button;
}

function createRenameButton(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vl-button vl-button-secondary item-action';
  button.textContent = '✎';
  button.setAttribute('aria-label', 'Renommer');
  button.title = 'Renommer';
  button.addEventListener('click', (event) => event.stopPropagation());
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

function fileIcon(item) {
  if (typeof item.mimeType === 'string' && item.mimeType.startsWith('image/')) return '🖼️';
  const extension = item.name.split('.').pop().toLowerCase();
  if (['zip', 'gz', 'tar', '7z', 'rar'].includes(extension)) return '📦';
  if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm'].includes(extension)) return '🎞️';
  if (['js', 'ts', 'html', 'css', 'json', 'md', 'txt', 'py'].includes(extension)) return '📄';
  return '📃';
}

async function openStorageFile(item) {
  const kind = previewKind(item);
  if (kind) {
    await previewFile(item, kind);
    return;
  }
  if (selectedStorageFile && fileEditInput.value !== savedFileContent) {
    setFileEditorMessage('Enregistre ou annule les modifications avant de sélectionner un autre fichier.', 'error');
    return;
  }
  setFileEditorMessage('');
  try {
    const data = await panelAuth.request(
      `/vital/api/panel/storage/files/${encodeURIComponent(item.id)}/content`
    );
    selectedStorageFile = item;
    savedFileContent = data.content;
    fileEditTitle.textContent = item.name;
    fileEditInput.value = data.content;
    fileEditInput.hidden = false;
    fileEditorPanel.hidden = false;
    updateFileEditorState();
    fileEditorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    if (error.status === 413 || error.status === 415) {
      await downloadFile(item);
      return;
    }
    notify(error.message || 'Impossible de lire ce fichier.', 'error');
  }
}

function setFileEditorMessage(message, type = '') {
  fileEditError.textContent = message;
  fileEditError.classList.toggle('is-error', type === 'error');
  fileEditError.classList.toggle('is-saved', type === 'success');
  fileEditError.classList.toggle('is-unsaved', type === 'unsaved');
}

function closeFileEditor() {
  selectedStorageFile = null;
  savedFileContent = '';
  fileEditInput.value = '';
  fileEditInput.hidden = true;
  fileEditInput.disabled = false;
  fileEditorPanel.hidden = true;
  setFileEditorMessage('');
  updateFileEditorState();
}

function updateFileEditorState(message = '', type = '') {
  const hasChanges = Boolean(selectedStorageFile) && fileEditInput.value !== savedFileContent;
  fileEditSave.disabled = !hasChanges;
  fileEditCancel.disabled = !selectedStorageFile;
  if (message) {
    setFileEditorMessage(message, type || (hasChanges ? 'unsaved' : 'success'));
  } else if (hasChanges) {
    setFileEditorMessage('Modifications non enregistrées.', 'unsaved');
  } else if (!fileEditError.classList.contains('is-error')) {
    setFileEditorMessage('');
  }
}

function resetStorageSearch() {
  clearTimeout(searchTimeout);
  storageSearchInput.value = '';
}

function createFileCard(item) {
  const card = document.createElement('article');
  card.className = 'file-card';
  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'file-open';
  openButton.setAttribute(
    'aria-label',
    item.type === 'folder' ? `Ouvrir le dossier ${item.name}` : `Afficher le fichier ${item.name}`
  );
  const icon = document.createElement('span');
  icon.className = 'file-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = item.type === 'folder' ? '📁' : fileIcon(item);

  const name = document.createElement('span');
  name.textContent = item.name;
  name.className = 'file-name';
  const size = document.createElement('span');
  size.className = 'file-size';
  size.textContent = item.type === 'folder' ? 'Dossier' : formatBytes(item.sizeBytes);
  openButton.append(icon, name, size);
  openButton.addEventListener('click', () => {
    if (item.type === 'folder') {
      if (selectedStorageFile && fileEditInput.value !== savedFileContent) {
        setFileEditorMessage('Enregistre ou annule les modifications avant de changer de dossier.', 'error');
        return;
      }
      closeFileEditor();
      resetStorageSearch();
      currentPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      renderedItemCount = 0;
      loadStorage();
    } else {
      openStorageFile(item);
    }
  });

  const actions = document.createElement('div');
  actions.className = 'file-actions';
  actions.append(createDownloadButton(item), createRenameButton(item), createDeleteButton(item));
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
    if (selectedStorageFile && fileEditInput.value !== savedFileContent) {
      setFileEditorMessage('Enregistre ou annule les modifications avant de changer de dossier.', 'error');
      return;
    }
    closeFileEditor();
    resetStorageSearch();
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
      if (selectedStorageFile && fileEditInput.value !== savedFileContent) {
        setFileEditorMessage('Enregistre ou annule les modifications avant de changer de dossier.', 'error');
        return;
      }
      closeFileEditor();
      resetStorageSearch();
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

function createTrashCard(item) {
  const card = document.createElement('article');
  card.className = 'trash-entry';
  const details = document.createElement('div');
  details.className = 'trash-entry-details';
  const heading = document.createElement('div');
  heading.className = 'trash-entry-heading';
  const title = document.createElement('strong');
  title.textContent = item.type === 'folder' ? `📁 ${item.name}` : item.type === 'file' ? `📄 ${item.name}` : '✉️ Message';
  const type = document.createElement('span');
  type.textContent = item.type === 'folder' ? 'Dossier' : item.type === 'file' ? 'Fichier' : 'Message';
  heading.append(title, type);
  const meta = document.createElement('p');
  meta.className = 'trash-entry-meta';
  meta.textContent = `Supprimé le ${formatDate(item.deletedAt)}`;
  if (item.type === 'folder') {
    meta.textContent += ` · ${item.folderCount} dossier${item.folderCount === 1 ? '' : 's'} · ${item.fileCount} fichier${item.fileCount === 1 ? '' : 's'}`;
  } else if (item.type === 'file') {
    meta.textContent += ` · ${formatBytes(item.sizeBytes)}`;
  }
  details.append(heading, meta);
  if (item.type === 'message' && item.content) {
    const content = document.createElement('p');
    content.className = 'trash-entry-content';
    content.textContent = item.content;
    details.append(content);
  }
  const actions = document.createElement('div');
  actions.className = 'trash-entry-actions';
  const restoreButton = document.createElement('button');
  restoreButton.type = 'button';
  restoreButton.className = 'vl-button vl-button-secondary';
  restoreButton.textContent = 'Restaurer';
  restoreButton.addEventListener('click', async () => {
    restoreButton.disabled = true;
    try {
      const result = await panelAuth.request(
        `/vital/api/panel/storage/trash/${encodeURIComponent(item.id)}/restore`,
        { method: 'POST' }
      );
      updateQuota(result);
      notify(`« ${item.name || 'Message'} » restauré.`);
      await loadStorage();
    } catch (error) {
      notify(error.message || 'Impossible de restaurer cet élément.', 'error');
      restoreButton.disabled = false;
    }
  });
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'vl-button vl-button-danger';
  deleteButton.textContent = 'Supprimer définitivement';
  deleteButton.addEventListener('click', () => {
    deleteFromTrash = true;
    selectedTrashItem = item;
    document.getElementById('delete-dialog-title').textContent = 'Supprimer définitivement ?';
    document.getElementById('delete-confirm').textContent = 'Supprimer définitivement';
    deleteDescription.textContent = `« ${item.name || 'Message'} » sera supprimé définitivement et ne pourra plus être restauré.`;
    deleteDialog.showModal();
  });
  actions.append(restoreButton, deleteButton);
  card.append(details, actions);
  return card;
}

function renderTrash(items, prepend = false) {
  if (!prepend) trashItemsContainer.replaceChildren();
  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(createTrashCard(item)));
  if (prepend) trashItemsContainer.prepend(fragment);
  else trashItemsContainer.append(fragment);
}

async function loadStorage({ older = false } = {}) {
  try {
    const offset = older ? renderedItemCount : 0;
    const data = activeStorageTab === 'file'
      ? await panelAuth.request(
        `/vital/api/panel/storage/explorer?path=${encodeURIComponent(currentPath)}&search=${encodeURIComponent(storageSearchInput.value.trim())}&sort=${encodeURIComponent(storageSortSelect.value)}&limit=${pageSize}&offset=${offset}`
      )
      : activeStorageTab === 'trash'
        ? await panelAuth.request(`/vital/api/panel/storage/trash?limit=${pageSize}&offset=${offset}`)
      : await panelAuth.request(
        `/vital/api/panel/storage?type=message&limit=${pageSize}&offset=${offset}`
      );
    updateQuota(data);
    const itemCountLabel = activeStorageTab === 'trash'
      ? `${data.itemCount} élément${data.itemCount === 1 ? '' : 's'} dans la corbeille`
      : `${data.itemCount} ${activeStorageTab === 'message' ? 'message' : 'élément'}${data.itemCount === 1 ? '' : 's'}`;
    document.getElementById('item-count').textContent = itemCountLabel;
    const container = activeStorageTab === 'message'
      ? messageItemsContainer
      : activeStorageTab === 'trash' ? trashItemsContainer : fileItemsContainer;
    const previousHeight = container.scrollHeight;
    if (!older) renderedItemCount = 0;
    if (activeStorageTab === 'message') {
      renderMessages(data.items, older);
      messagesEmptyState.hidden = data.itemCount > 0;
      document.getElementById('load-messages-older').hidden = !data.hasMore;
    } else if (activeStorageTab === 'trash') {
      renderTrash(data.items, older);
      trashEmptyState.hidden = data.itemCount > 0;
      document.getElementById('load-trash-older').hidden = !data.hasMore;
    } else {
      currentPath = data.path;
      renderBreadcrumbs();
      renderFiles(data.items, older);
      filesEmptyState.textContent = storageSearchInput.value.trim()
        ? 'Aucun fichier ou dossier correspondant à la recherche.'
        : currentPath ? 'Ce dossier est vide.' : 'Aucun fichier ou dossier dans Stockage.';
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
  if (deleteFromTrash && !selectedTrashItem) return;
  if (!deleteFromTrash && !selectedDeleteItem) return;
  const isTrashDeletion = deleteFromTrash;
  const item = selectedDeleteItem;
  const trashItem = selectedTrashItem;
  selectedDeleteItem = null;
  selectedTrashItem = null;
  deleteDialog.close();
  try {
    if (isTrashDeletion) {
      deleteFromTrash = false;
      const result = await panelAuth.request(
        `/vital/api/panel/storage/trash/${encodeURIComponent(trashItem.id)}`,
        { method: 'DELETE' }
      );
      updateQuota(result);
      notify(
        result.warning ? `Élément supprimé définitivement. ${result.warning}` : 'Élément supprimé définitivement.',
        result.warning ? 'error' : 'success'
      );
      await loadStorage();
      return;
    }
    const result = await panelAuth.request(`/vital/api/panel/storage/${encodeURIComponent(item.id)}`, {
      method: 'DELETE'
    });
    if (selectedStorageFile?.id === item.id) {
      closeFileEditor();
    }
    if (item.type !== 'message') {
      const summary = item.type === 'folder'
        ? `Dossier « ${item.name} » déplacé dans la corbeille avec ${result.deletedFolders - 1} sous-dossier(s) et ${result.deletedFiles} fichier(s).`
        : 'Élément déplacé dans la corbeille.';
      notify(summary);
    } else {
      notify('Message déplacé dans la corbeille.');
    }
    await loadStorage();
  } catch (error) {
    deleteFromTrash = false;
    notify(error.message, 'error');
  }
});

document.getElementById('delete-cancel').addEventListener('click', () => deleteDialog.close());
deleteDialog.addEventListener('close', () => {
  selectedDeleteItem = null;
  selectedTrashItem = null;
  deleteFromTrash = false;
});
document.getElementById('rename-cancel').addEventListener('click', () => renameDialog.close());
renameForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const isCreateFolder = renameDialogMode === 'create-folder';
  const isCreateFile = renameDialogMode === 'create-file';
  if (!isCreateFolder && !isCreateFile && !selectedRenameItem) return;
  const item = selectedRenameItem;
  const value = renameInput.value.trim();
  if (!value) {
    renameError.textContent = isCreateFolder ? 'Saisis le nom du dossier.' :
      isCreateFile ? 'Saisis le nom du fichier.' : 'Saisis un nom.';
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
    } else if (isCreateFile) {
      await panelAuth.request('/vital/api/panel/storage/files', {
        method: 'POST',
        body: JSON.stringify({ name: value, folderPath: currentPath })
      });
    } else {
      await panelAuth.request(`/vital/api/panel/storage/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ type: item.type, name: value })
      });
      if (selectedStorageFile?.id === item.id) {
        selectedStorageFile.name = value;
        fileEditTitle.textContent = value;
      }
    }
    selectedRenameItem = null;
    renameDialog.close();
    notify(isCreateFolder ? `Dossier « ${value} » créé.` :
      isCreateFile ? `Fichier « ${value} » créé.` :
        `${item.type === 'folder' ? 'Dossier' : 'Fichier'} renommé.`);
    await loadStorage();
  } catch (error) {
    renameError.textContent = error.message;
  } finally {
    confirmButton.disabled = false;
  }
});

document.getElementById('new-storage-file').addEventListener('click', () => {
  renameDialogMode = 'create-file';
  selectedRenameItem = null;
  renameInput.value = '';
  renameInput.placeholder = 'Nom du fichier';
  renameError.textContent = '';
  renameEyebrow.textContent = 'Explorateur Stockage';
  renameTitle.textContent = 'Créer un fichier vide';
  renameLabel.textContent = 'Nom du nouveau fichier';
  document.getElementById('rename-confirm').textContent = 'Créer';
  renameInput.required = true;
  renameDialog.showModal();
  renameInput.focus();
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

fileEditSave.addEventListener('click', async () => {
  if (!selectedStorageFile) return;
  fileEditSave.disabled = true;
  fileEditCancel.disabled = true;
  fileEditInput.disabled = true;
  setFileEditorMessage('Enregistrement en cours…');
  const content = fileEditInput.value;
  try {
    await panelAuth.request(
      `/vital/api/panel/storage/files/${encodeURIComponent(selectedStorageFile.id)}/content`,
      {
        method: 'PUT',
        body: JSON.stringify({ content })
      }
    );
    savedFileContent = content;
    closeFileEditor();
    await loadStorage();
  } catch (error) {
    updateFileEditorState(error.message || 'Impossible d’enregistrer le fichier.', 'error');
  } finally {
    fileEditInput.disabled = false;
  }
});

fileEditInput.addEventListener('input', () => {
  updateFileEditorState();
});

fileEditCancel.addEventListener('click', () => {
  closeFileEditor();
});

function selectStorageTab(tab) {
  if (tab !== 'file' && selectedStorageFile && fileEditInput.value !== savedFileContent) {
    setFileEditorMessage('Enregistre ou annule les modifications avant de changer d’onglet.', 'error');
    return;
  }
  if (tab !== 'file') closeFileEditor();
  activeStorageTab = tab;
  localStorage.setItem(storageTabKey, tab);
  updateStorageTabView();
  renderedItemCount = 0;
  clearNotification();
  loadStorage();
}

function updateStorageTabView() {
  const isMessages = activeStorageTab === 'message';
  const isFiles = activeStorageTab === 'file';
  const isTrash = activeStorageTab === 'trash';
  const messagesTab = document.getElementById('messages-tab');
  const filesTab = document.getElementById('files-tab');
  const trashTab = document.getElementById('trash-tab');
  messagesTab.classList.toggle('is-active', isMessages);
  messagesTab.setAttribute('aria-selected', String(isMessages));
  filesTab.classList.toggle('is-active', isFiles);
  filesTab.setAttribute('aria-selected', String(isFiles));
  trashTab.classList.toggle('is-active', isTrash);
  trashTab.setAttribute('aria-selected', String(isTrash));
  document.getElementById('messages-panel').hidden = !isMessages;
  document.getElementById('files-panel').hidden = !isFiles;
  document.getElementById('trash-panel').hidden = !isTrash;
  document.getElementById('storage-section-title').textContent =
    isMessages ? 'Messages' : isFiles ? 'Fichiers' : 'Corbeille';
  document.getElementById('files-empty').textContent = currentPath
    ? 'Ce dossier est vide.'
    : 'Aucun fichier ou dossier dans Stockage.';
}

document.getElementById('messages-tab').addEventListener('click', () => selectStorageTab('message'));
document.getElementById('files-tab').addEventListener('click', () => selectStorageTab('file'));
document.getElementById('trash-tab').addEventListener('click', () => selectStorageTab('trash'));
document.getElementById('load-trash-older').addEventListener('click', () => loadStorage({ older: true }));
storageSearchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    renderedItemCount = 0;
    loadStorage();
  }, 250);
});
storageSortSelect.addEventListener('change', () => {
  renderedItemCount = 0;
  loadStorage();
});
document.getElementById('file-preview-close').addEventListener('click', () => filePreviewDialog.close());
filePreviewDialog.addEventListener('close', () => {
  previewRequest += 1;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = '';
  filePreviewBody.replaceChildren();
});
document.getElementById('quota-toggle').addEventListener('click', () => {
  document.getElementById('quota-details').showModal();
});
document.getElementById('quota-dialog-close').addEventListener('click', () => {
  document.getElementById('quota-details').close();
});
document.getElementById('storage-refresh').addEventListener('click', () => {
  clearNotification();
  loadStorage();
});
document.getElementById('load-messages-older').addEventListener('click', () => loadStorage({ older: true }));
document.getElementById('load-files-older').addEventListener('click', () => loadStorage({ older: true }));

async function initialize() {
  if (!panelAuth.getSessionId()) {
    window.location.replace('/connexion/');
    return;
  }

  try {
    const session = await panelAuth.requireSession();
    if (session.role !== 'superadmin' && !session.allowedSites?.includes('stockage')) {
      showDenied('Votre compte ne dispose pas d’un accès au site Stockage.');
      return;
    }
    storageApp.hidden = false;
    updateStorageTabView();
    await loadStorage();
  } catch (error) {
    if (!panelAuth.getSessionId()) return;
    showDenied(error.message || 'Impossible de vérifier vos autorisations.');
  }
}

initialize();
