const panelAuth = window.VitaLoadPanelAuth;
const serverApp = document.getElementById('server-app');
const serverDenied = document.getElementById('server-denied');
const fileList = document.getElementById('file-list');
const breadcrumbs = document.getElementById('breadcrumbs');
const emptyState = document.getElementById('empty-state');
const pageError = document.getElementById('page-error');
const uploadMessage = document.getElementById('upload-message');
const editorPanel = document.getElementById('editor-panel');
const contentEditor = document.getElementById('file-content');
const editorEmpty = document.getElementById('editor-empty');
const selectedFileLabel = document.getElementById('selected-file');
const fileMessage = document.getElementById('file-message');
const saveButton = document.getElementById('save-file');
const cancelChangesButton = document.getElementById('cancel-file-changes');
const changesCount = document.getElementById('changes-count');
const changesList = document.getElementById('changes-list');
const changesMessage = document.getElementById('changes-message');
const applyChangesButton = document.getElementById('apply-changes');
const discardChangesButton = document.getElementById('discard-changes');
const serverLogsPanel = document.getElementById('server-logs-panel');
const serverLogs = document.getElementById('server-logs');
const logsUpdated = document.getElementById('logs-updated');
const logsMessage = document.getElementById('logs-message');
const emergencyShutdownPanel = document.getElementById('emergency-shutdown-panel');
const shutdownHelp = emergencyShutdownPanel?.querySelector('.shutdown-help');
const fileDialog = document.getElementById('file-dialog');
const fileDialogForm = document.getElementById('file-dialog-form');
const fileDialogTitle = document.getElementById('file-dialog-title');
const fileDialogMessage = document.getElementById('file-dialog-message');
const fileDialogLabel = document.getElementById('file-dialog-label');
const fileDialogInput = document.getElementById('file-dialog-input');
const fileDialogConfirm = document.getElementById('file-dialog-confirm');
const terminalOutput = document.getElementById('terminal-output');
const terminalPrompt = document.getElementById('terminal-prompt');
const terminalInput = document.getElementById('terminal-input');
const emergencyShutdownButton = document.getElementById('emergency-shutdown');
let currentPath = '';
let selectedFile = '';
let savedContent = '';
let saveInProgress = false;
let changesInProgress = false;
let logsRequestInProgress = false;
let shutdownInProgress = false;
let resolveDialog;

function hasUnsavedChanges() {
  return Boolean(selectedFile) && contentEditor.value !== savedContent;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForBackendRestart() {
  await wait(2500);
  let disconnected = false;
  const deadline = Date.now() + 60000;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);
    try {
      await panelAuth.request('/vital/api/panel/auth/session', { signal: controller.signal });
      if (disconnected) return true;
    } catch (error) {
      if (error.message === 'Votre session a expiré.' || error.message === 'Connexion requise.') {
        return false;
      }
      disconnected = true;
    } finally {
      window.clearTimeout(timeout);
    }
    await wait(400);
  }
  return false;
}

function updateEditorState(message) {
  const hasChanges = hasUnsavedChanges();
  saveButton.disabled = !hasChanges || saveInProgress;
  saveButton.textContent = saveInProgress ? 'Enregistrement…' : 'Enregistrer le brouillon';
  cancelChangesButton.disabled = !hasChanges || saveInProgress;
  fileMessage.classList.toggle('is-unsaved', hasChanges);
  fileMessage.classList.toggle('is-saved', Boolean(selectedFile) && !hasChanges);
  fileMessage.textContent = message || (
    hasChanges ? 'Texte modifié localement. Enregistrez-le dans le brouillon.' :
      selectedFile ? 'Contenu enregistré dans le brouillon.' : ''
  );
}

async function loadChanges() {
  try {
    const data = await panelAuth.request('/vital/api/panel/serveur/changes');
    changesList.replaceChildren();
    changesCount.textContent = String(data.changes.length);
    applyChangesButton.disabled = data.changes.length === 0 || changesInProgress;
    discardChangesButton.disabled = data.changes.length === 0 || changesInProgress;
    applyChangesButton.classList.toggle('is-update-pending', data.changes.length > 0);
    applyChangesButton.classList.toggle('is-update-current', data.changes.length === 0);

    for (const change of data.changes) {
      const row = document.createElement('li');
      row.className = 'change-item';
      const action = document.createElement('span');
      action.className = `change-action is-${change.action}`;
      action.textContent = change.action === 'added' ? 'Ajouté' :
        change.action === 'modified' ? 'Modifié' : 'Supprimé';
      const changedPath = document.createElement('span');
      changedPath.className = 'change-path';
      changedPath.textContent = change.path;
      changedPath.title = change.path;
      const kind = document.createElement('span');
      kind.className = 'change-kind';
      kind.textContent = change.type === 'directory' ? 'Dossier' :
        change.type === 'file' ? formatSize(change.sizeBytes) : 'Élément';
      const undoButton = document.createElement('button');
      undoButton.type = 'button';
      undoButton.className = 'vl-button vl-button-secondary change-undo';
      undoButton.textContent = change.action === 'deleted' ? 'Restaurer' : 'Annuler';
      undoButton.setAttribute(
        'aria-label',
        `${change.action === 'deleted' ? 'Restaurer' : 'Annuler'} ${change.path}`
      );
      undoButton.addEventListener('click', () => discardChange(change, undoButton));
      row.append(action, changedPath, kind, undoButton);
      changesList.append(row);
    }

    changesMessage.classList.remove('is-error', 'is-success');
    changesMessage.textContent = data.changes.length === 0
      ? data.excludedCount > 0
        ? `${data.excludedCount} élément(s) inaccessible(s) sont exclus du brouillon.`
        : 'Aucun changement en attente.'
      : `${data.changes.length} changement(s) prêt(s) à être appliqué(s).` +
        (data.excludedCount > 0 ? ` ${data.excludedCount} élément(s) inaccessible(s) sont exclus.` : '');
  } catch (error) {
    changesMessage.classList.add('is-error');
    changesMessage.textContent = error.message || 'Impossible de charger les changements.';
  }
}

async function loadServerLogs() {
  if (logsRequestInProgress || document.hidden || serverLogsPanel.hidden) return;
  logsRequestInProgress = true;
  try {
    const data = await panelAuth.request('/vital/api/panel/serveur/logs');
    serverLogs.textContent = data.content || 'Aucune sortie du backend pour le moment.';
    logsUpdated.textContent = data.truncated
      ? `Affichage limité aux dernières lignes · actualisé ${new Date(data.updatedAt).toLocaleTimeString('fr-FR')}`
      : `Actualisé ${new Date(data.updatedAt).toLocaleTimeString('fr-FR')}`;
    logsMessage.classList.remove('is-error');
    logsMessage.textContent = data.truncated
      ? 'Les lignes plus anciennes ne sont pas affichées.'
      : 'Actualisation automatique toutes les 5 secondes.';
    serverLogs.scrollTop = serverLogs.scrollHeight;
  } catch (error) {
    logsMessage.classList.add('is-error');
    logsMessage.textContent = error.message || 'Impossible de charger les journaux.';
  } finally {
    logsRequestInProgress = false;
  }
}

async function discardChange(change, button) {
  if (changesInProgress) return;
  const affectsSelection = selectedFile === change.path || selectedFile.startsWith(`${change.path}/`);
  if (affectsSelection && hasUnsavedChanges() && !(await confirmDiscardChanges())) return;

  const confirmed = await showFileDialog({
    title: change.action === 'deleted' ? 'Restaurer ce changement ?' : 'Annuler ce changement ?',
    message: change.type === 'directory'
      ? `${change.path} est un dossier. Cela annulera aussi les changements de son contenu.`
      : `${change.path} sera restauré à son état d’origine.`,
    confirmLabel: change.action === 'deleted' ? 'Restaurer' : 'Annuler ce changement',
    input: false
  });
  if (confirmed === null) return;

  changesInProgress = true;
  button.disabled = true;
  applyChangesButton.disabled = true;
  discardChangesButton.disabled = true;
  changesMessage.classList.remove('is-error', 'is-success');
  changesMessage.textContent = `Annulation de ${change.path}…`;
  let operationMessage = '';
  let operationFailed = false;
  try {
    await panelAuth.request('/vital/api/panel/serveur/discard-item', {
      method: 'POST',
      body: JSON.stringify({ path: change.path })
    });

    if (affectsSelection) {
      if (change.action === 'added' && change.type === 'directory') {
        clearSelection();
      } else {
        const data = await panelAuth.request(
          `/vital/api/panel/serveur/file?path=${encodeURIComponent(selectedFile)}`
        );
        savedContent = data.content;
        contentEditor.value = data.content;
        updateEditorState('Le fichier sélectionné a été restauré dans le brouillon.');
      }
    }
    operationMessage = `Changement annulé : ${change.path}.`;
    await loadDirectory();
  } catch (error) {
    operationFailed = true;
    operationMessage = error.message || `Impossible d’annuler ${change.path}.`;
  } finally {
    changesInProgress = false;
    await loadChanges();
    changesMessage.classList.toggle('is-error', operationFailed);
    changesMessage.classList.toggle('is-success', !operationFailed && Boolean(operationMessage));
    if (operationMessage) changesMessage.textContent = operationMessage;
  }
}

function clearSelection() {
  selectedFile = '';
  savedContent = '';
  selectedFileLabel.textContent = 'Aucun fichier sélectionné';
  contentEditor.value = '';
  contentEditor.hidden = true;
  editorEmpty.hidden = false;
  editorPanel.hidden = true;
  updateEditorState();
}

function showError(error) {
  pageError.textContent = error.message || 'Une erreur est survenue.';
}

function joinPath(directory, name) {
  return directory ? `${directory}/${name}` : name;
}

function parentPath(filePath) {
  const separator = filePath.lastIndexOf('/');
  return separator === -1 ? '' : filePath.slice(0, separator);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function iconFor(entry) {
  if (entry.type === 'directory') return '📁';
  if (entry.type !== 'file') return '📄';
  const extension = entry.name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(extension)) return '🖼️';
  if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm'].includes(extension)) return '🎞️';
  if (['zip', 'gz', 'tar', '7z'].includes(extension)) return '📦';
  if (['js', 'ts', 'html', 'css', 'json', 'md', 'py'].includes(extension)) return '📄';
  return '📃';
}

function renderBreadcrumbs() {
  breadcrumbs.replaceChildren();
  const segments = currentPath ? currentPath.split('/') : [];
  const root = document.createElement('button');
  root.type = 'button';
  root.className = 'breadcrumb';
  root.textContent = 'js-backend';
  root.addEventListener('click', () => loadDirectory(''));
  breadcrumbs.append(root);

  let path = '';
  for (const segment of segments) {
    breadcrumbs.append(document.createTextNode(' / '));
    path = joinPath(path, segment);
    const target = path;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'breadcrumb';
    button.textContent = segment;
    button.addEventListener('click', () => loadDirectory(target));
    breadcrumbs.append(button);
  }

  const displayPath = `/js-backend${currentPath ? `/${currentPath}` : ''}`;
  terminalPrompt.textContent = `${displayPath} $`;
}

function createAction(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `vl-button vl-button-secondary item-action ${className || ''}`.trim();
  button.textContent = label === 'Renommer' ? '✎' : label === 'Télécharger' ? '↓' : '🗑';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function renderEntry(entry) {
  const itemPath = joinPath(currentPath, entry.name);
  const card = document.createElement('article');
  card.className = `file-card${selectedFile === itemPath ? ' is-selected' : ''}`;

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'file-open';
  openButton.disabled = entry.type === 'other';
  openButton.setAttribute('aria-label', `${entry.type === 'directory' ? 'Ouvrir le dossier' : 'Ouvrir le fichier'} ${entry.name}`);

  const icon = document.createElement('span');
  icon.className = 'file-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = iconFor(entry);
  const name = document.createElement('span');
  name.className = 'file-name';
  name.textContent = entry.name;
  const size = document.createElement('span');
  size.className = 'file-size';
  size.textContent = formatSize(entry.size);
  openButton.append(icon, name, size);
  openButton.addEventListener('click', () => {
    if (entry.type === 'directory') loadDirectory(itemPath);
    else if (entry.type === 'file') openFile(itemPath);
  });

  const actions = document.createElement('div');
  actions.className = 'file-actions';
  actions.append(
    createAction('Télécharger', 'item-action-download', () => downloadEntry(itemPath, entry.type)),
    createAction('Renommer', '', () => renameEntry(itemPath, entry.name)),
    createAction('Supprimer', 'vl-button-danger', () => deleteEntry(itemPath, entry.name))
  );
  card.append(openButton, actions);
  return card;
}

async function downloadEntry(itemPath, type) {
  pageError.textContent = '';
  try {
    const sessionId = panelAuth.getSessionId();
    if (!sessionId) {
      panelAuth.clearSession();
      window.location.replace('/connexion/');
      throw new Error('Connexion requise.');
    }
    const apiUrl = window.config?.getApiUrl
      ? window.config.getApiUrl('/vital/api/panel/serveur/download')
      : '/vital/api/panel/serveur/download';
    const response = await fetch(`${apiUrl}?path=${encodeURIComponent(itemPath)}`, {
      headers: { 'X-Panel-Session': sessionId }
    });
    if (response.status === 401) {
      panelAuth.clearSession();
      window.location.replace('/connexion/');
      throw new Error('Votre session a expiré.');
    }
    if (!response.ok) {
      let message = `Le téléchargement a échoué (${response.status}).`;
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch {}
      throw new Error(message);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    const itemName = itemPath.split('/').pop();
    link.download = type === 'directory' ? `${itemName}.zip` : itemName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    showError(error);
  }
}

async function loadDirectory(directory = currentPath) {
  pageError.textContent = '';
  if (hasUnsavedChanges() && parentPath(selectedFile) !== directory) {
    const confirmed = await confirmDiscardChanges();
    if (!confirmed) return;
  }
  try {
    const data = await panelAuth.request(
      `/vital/api/panel/serveur/list?path=${encodeURIComponent(directory)}`
    );
    if (selectedFile && parentPath(selectedFile) !== data.path) {
      clearSelection();
    }
    currentPath = data.path;
    renderBreadcrumbs();
    fileList.replaceChildren();

    const entries = data.entries.sort((first, second) => {
      if (first.type !== second.type) return first.type === 'directory' ? -1 : 1;
      return first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    for (const entry of entries) fileList.append(renderEntry(entry));
    emptyState.hidden = entries.length !== 0;
    await loadChanges();
  } catch (error) {
    showError(error);
  }
}

async function openFile(filePath) {
  if (selectedFile === filePath) return;
  if (hasUnsavedChanges() && !(await confirmDiscardChanges())) return;
  pageError.textContent = '';
  try {
    const data = await panelAuth.request(
      `/vital/api/panel/serveur/file?path=${encodeURIComponent(filePath)}`
    );
    selectedFile = data.path;
    savedContent = data.content;
    selectedFileLabel.textContent = selectedFile;
    contentEditor.value = data.content;
    contentEditor.hidden = false;
    editorEmpty.hidden = true;
    editorPanel.hidden = false;
    updateEditorState();
    await loadDirectory();
  } catch (error) {
    showError(error);
  }
}

async function confirmDiscardChanges() {
  const confirmed = await showFileDialog({
    title: 'Texte local non enregistré',
    message: 'Abandonner les changements de texte non enregistrés ? Les autres changements du brouillon seront conservés.',
    confirmLabel: 'Abandonner',
    input: false
  });
  return confirmed !== null;
}

function showFileDialog({
  title,
  message = '',
  label = '',
  value = '',
  confirmLabel = 'Confirmer',
  input = true,
  inputType = 'text',
  autocomplete = 'off'
}) {
  fileDialogTitle.textContent = title;
  fileDialogMessage.textContent = message;
  fileDialogMessage.hidden = !message;
  fileDialogLabel.textContent = label;
  fileDialogLabel.hidden = !input;
  fileDialogInput.hidden = !input;
  fileDialogInput.type = inputType;
  fileDialogInput.autocomplete = autocomplete;
  fileDialogInput.value = value;
  fileDialogConfirm.textContent = confirmLabel;
  fileDialog.returnValue = '';

  return new Promise((resolve) => {
    resolveDialog = resolve;
    fileDialog.showModal();
    if (input) fileDialogInput.focus();
    else fileDialogConfirm.focus();
  });
}

fileDialogForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (resolveDialog) resolveDialog(fileDialogInput.value);
  resolveDialog = null;
  fileDialog.close('confirm');
});

document.getElementById('file-dialog-cancel').addEventListener('click', () => {
  fileDialog.close('cancel');
});

fileDialog.addEventListener('close', () => {
  if (resolveDialog) resolveDialog(null);
  resolveDialog = null;
  fileDialogInput.value = '';
  fileDialogInput.type = 'text';
  fileDialogInput.autocomplete = 'off';
});

async function createEntry(type) {
  const isDirectory = type === 'directory';
  const name = await showFileDialog({
    title: isDirectory ? 'Créer un dossier' : 'Créer un fichier',
    label: isDirectory ? 'Nom du dossier' : 'Nom du fichier',
    confirmLabel: 'Créer'
  });
  if (name === null) return;
  if (!name.trim()) {
    showError(new Error('Le nom ne peut pas être vide.'));
    return;
  }
  if (!isDirectory && hasUnsavedChanges() && !(await confirmDiscardChanges())) return;

  try {
    await panelAuth.request('/vital/api/panel/serveur/item', {
      method: 'POST',
      body: JSON.stringify({ path: joinPath(currentPath, name.trim()), type })
    });
    await loadDirectory();
    if (!isDirectory) await openFile(joinPath(currentPath, name.trim()));
  } catch (error) {
    showError(error);
  }
}

async function renameEntry(itemPath, oldName) {
  const name = await showFileDialog({
    title: 'Renommer',
    label: 'Nouveau nom',
    value: oldName,
    confirmLabel: 'Renommer'
  });
  if (name === null || name.trim() === oldName) return;
  if (!name.trim()) {
    showError(new Error('Le nom ne peut pas être vide.'));
    return;
  }

  try {
    const data = await panelAuth.request('/vital/api/panel/serveur/item', {
      method: 'PATCH',
      body: JSON.stringify({ path: itemPath, name: name.trim() })
    });
    if (selectedFile === itemPath || selectedFile.startsWith(`${itemPath}/`)) {
      selectedFile = `${data.path}${selectedFile.slice(itemPath.length)}`;
      selectedFileLabel.textContent = selectedFile;
    }
    await loadDirectory();
  } catch (error) {
    showError(error);
  }
}

async function deleteEntry(itemPath, name) {
  if (hasUnsavedChanges() &&
      (selectedFile === itemPath || selectedFile.startsWith(`${itemPath}/`)) &&
      !(await confirmDiscardChanges())) return;
  const confirmed = await showFileDialog({
    title: 'Supprimer',
    message: `Supprimer « ${name} » ? La suppression d’un dossier supprime aussi tout son contenu.`,
    confirmLabel: 'Supprimer',
    input: false
  });
  if (confirmed === null) return;

  try {
    await panelAuth.request(`/vital/api/panel/serveur/item?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });
    if (selectedFile === itemPath || selectedFile.startsWith(`${itemPath}/`)) {
      clearSelection();
    }
    await loadDirectory();
  } catch (error) {
    showError(error);
  }
}

document.getElementById('new-file').addEventListener('click', () => createEntry('file'));
document.getElementById('new-directory').addEventListener('click', () => createEntry('directory'));
document.getElementById('refresh').addEventListener('click', () => loadDirectory());
document.getElementById('import-files').addEventListener('click', () => {
  document.getElementById('file-upload-input').click();
});
document.getElementById('import-directory').addEventListener('click', () => {
  document.getElementById('directory-upload-input').click();
});

async function importSelection(input) {
  const files = Array.from(input.files || []);
  input.value = '';
  if (files.length === 0) return;

  const formData = new FormData();
  const paths = files.map((file) => {
    const relativePath = file.webkitRelativePath || file.name;
    formData.append('files', file);
    return relativePath;
  });
  formData.append('paths', JSON.stringify(paths));

  pageError.textContent = '';
  uploadMessage.textContent = 'Import en cours…';
  const importButtons = [
    document.getElementById('import-files'),
    document.getElementById('import-directory')
  ];
  importButtons.forEach((button) => { button.disabled = true; });
  try {
    const result = await panelAuth.request('/vital/api/panel/serveur/upload', {
      method: 'POST',
      body: formData
    });
    uploadMessage.textContent = `${result.uploaded} fichier(s) ajouté(s) au brouillon.`;
    await loadDirectory();
  } catch (error) {
    uploadMessage.textContent = '';
    showError(error);
  } finally {
    importButtons.forEach((button) => { button.disabled = false; });
  }
}

document.getElementById('file-upload-input').addEventListener('change', (event) => {
  importSelection(event.currentTarget);
});
document.getElementById('directory-upload-input').addEventListener('change', (event) => {
  importSelection(event.currentTarget);
});

contentEditor.addEventListener('input', () => updateEditorState());

cancelChangesButton.addEventListener('click', () => {
  if (!selectedFile || !hasUnsavedChanges()) return;
  contentEditor.value = savedContent;
  updateEditorState('Modifications locales annulées. Le brouillon enregistré est conservé.');
});

saveButton.addEventListener('click', async () => {
  if (!selectedFile || !hasUnsavedChanges() || saveInProgress) return;
  const contentToSave = contentEditor.value;
  saveInProgress = true;
  contentEditor.disabled = true;
  updateEditorState('Enregistrement dans le brouillon…');
  try {
    await panelAuth.request('/vital/api/panel/serveur/file', {
      method: 'PUT',
      body: JSON.stringify({ path: selectedFile, content: contentToSave })
    });
    savedContent = contentToSave;
    updateEditorState('Brouillon enregistré. Cliquez sur « Mettre à jour et redémarrer » pour appliquer les changements.');
    await loadDirectory();
  } catch (error) {
    updateEditorState(error.message);
  } finally {
    saveInProgress = false;
    contentEditor.disabled = false;
    updateEditorState(fileMessage.textContent);
  }
});

applyChangesButton.addEventListener('click', async () => {
  if (changesInProgress || applyChangesButton.disabled) return;
  if (hasUnsavedChanges()) {
    changesMessage.classList.add('is-error');
    changesMessage.textContent = 'Enregistrez ou annulez le texte modifié avant de mettre à jour le serveur.';
    return;
  }
  changesInProgress = true;
  applyChangesButton.disabled = true;
  discardChangesButton.disabled = true;
  changesMessage.classList.remove('is-error', 'is-success');
  changesMessage.textContent = 'Application des changements…';
  let operationMessage = '';
  let operationFailed = false;
  let restartWasScheduled = false;
  try {
    const result = await panelAuth.request('/vital/api/panel/serveur/apply', { method: 'POST' });
    operationMessage = result.applied === 0
      ? 'Aucun changement à appliquer.'
      : `${result.applied} changement(s) appliqué(s) au serveur.`;
    if (result.restartScheduled) {
      restartWasScheduled = true;
      operationMessage = 'Changements appliqués. Redémarrage du serveur en cours…';
      if (await waitForBackendRestart()) {
        window.location.reload();
        return;
      }
      throw new Error('Les changements sont appliqués, mais le backend ne répond pas après le redémarrage. Vérifie /var/log/vitaload-server.log et redémarre Node manuellement si nécessaire.');
    }
    if (selectedFile) {
      const selectedWasRemoved = result.changes.some((change) =>
        change.action === 'deleted' &&
        (selectedFile === change.path || selectedFile.startsWith(`${change.path}/`))
      );
      if (selectedWasRemoved) {
        clearSelection();
      } else {
        const data = await panelAuth.request(
          `/vital/api/panel/serveur/file?path=${encodeURIComponent(selectedFile)}`
        );
        savedContent = data.content;
        contentEditor.value = data.content;
        updateEditorState('Fichier mis à jour sur le serveur.');
      }
    }
    await loadDirectory();
  } catch (error) {
    operationFailed = true;
    operationMessage = error.message || 'Impossible d’appliquer les changements.';
  } finally {
    changesInProgress = false;
    if (!restartWasScheduled) await loadChanges();
    changesMessage.classList.toggle('is-error', operationFailed);
    changesMessage.classList.toggle('is-success', !operationFailed && Boolean(operationMessage));
    if (operationMessage) changesMessage.textContent = operationMessage;
  }
});

discardChangesButton.addEventListener('click', async () => {
  if (changesInProgress || discardChangesButton.disabled) return;
  if (hasUnsavedChanges() && !(await confirmDiscardChanges())) return;
  const confirmed = await showFileDialog({
    title: 'Tout annuler',
    message: 'Annuler toutes les modifications du brouillon : fichiers, dossiers, imports et commandes du terminal ?',
    confirmLabel: 'Tout annuler',
    input: false
  });
  if (confirmed === null) return;
  changesInProgress = true;
  applyChangesButton.disabled = true;
  discardChangesButton.disabled = true;
  changesMessage.classList.remove('is-error', 'is-success');
  changesMessage.textContent = 'Annulation du brouillon…';
  let operationMessage = '';
  let operationFailed = false;
  try {
    await panelAuth.request('/vital/api/panel/serveur/discard', { method: 'POST' });
    clearSelection();
    operationMessage = 'Tous les changements du brouillon ont été annulés.';
    await loadDirectory();
  } catch (error) {
    operationFailed = true;
    operationMessage = error.message || 'Impossible d’annuler les changements.';
  } finally {
    changesInProgress = false;
    await loadChanges();
    changesMessage.classList.toggle('is-error', operationFailed);
    changesMessage.classList.toggle('is-success', !operationFailed && Boolean(operationMessage));
    if (operationMessage) changesMessage.textContent = operationMessage;
  }
});

document.getElementById('logout').addEventListener('click', async () => {
  try {
    await panelAuth.request('/vital/api/panel/auth/logout', { method: 'POST' });
  } catch (error) {
    showError(error);
  } finally {
    panelAuth.clearSession();
    window.location.replace('/connexion/');
  }
});

emergencyShutdownButton?.addEventListener('click', async () => {
  if (shutdownInProgress) return;
  const confirmed = await showFileDialog({
    title: 'Arrêter le serveur ?',
    message: 'Le site restera indisponible jusqu’au redémarrage manuel de Node.',
    confirmLabel: 'Continuer',
    input: false
  });
  if (confirmed === null) return;

  const password = await showFileDialog({
    title: 'Confirmer avec ton mot de passe',
    message: 'Saisis le mot de passe de ton compte pour envoyer la demande d’arrêt.',
    label: 'Mot de passe',
    confirmLabel: 'Éteindre le serveur',
    inputType: 'password',
    autocomplete: 'current-password'
  });
  if (password === null || password.length === 0) return;

  shutdownInProgress = true;
  emergencyShutdownButton.disabled = true;
  emergencyShutdownButton.textContent = 'Arrêt en cours…';
  if (shutdownHelp) shutdownHelp.textContent = 'Envoi de la demande d’arrêt au backend…';
  try {
    await panelAuth.request('/vital/api/panel/serveur/shutdown', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    if (shutdownHelp) shutdownHelp.textContent = 'Confirmation reçue. Le backend s’arrête ; redémarre Node manuellement pour remettre le site en ligne.';
  } catch (error) {
    if (shutdownHelp) shutdownHelp.textContent = error.message || 'Impossible d’arrêter le serveur.';
    shutdownInProgress = false;
    emergencyShutdownButton.disabled = false;
    emergencyShutdownButton.textContent = 'Arrêt d’urgence';
  }
});

document.getElementById('terminal-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const line = terminalInput.value.trim();
  if (!line) return;

  terminalOutput.textContent += `\n${terminalPrompt.textContent} ${line}\n`;
  terminalInput.value = '';
  try {
    const data = await panelAuth.request('/vital/api/panel/serveur/terminal', {
      method: 'POST',
      body: JSON.stringify({ line, cwd: currentPath })
    });
    terminalOutput.textContent += `${data.output}\n`;
    currentPath = data.cwd;
    await loadDirectory(currentPath);
  } catch (error) {
    terminalOutput.textContent += `${error.message}\n`;
  }
  terminalOutput.textContent = terminalOutput.textContent.slice(-20000);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});

document.getElementById('clear-terminal').addEventListener('click', () => {
  terminalOutput.textContent = '';
});

document.getElementById('refresh-logs').addEventListener('click', () => loadServerLogs());
window.setInterval(() => loadServerLogs(), 5000);

async function initialize() {
  try {
    const session = await panelAuth.requireSession();
    if (session.role !== 'superadmin' && !session.allowedSites?.includes('serveur')) {
      serverApp.hidden = true;
      serverDenied.hidden = false;
      return;
    }
    document.getElementById('username').textContent = session.username;
    emergencyShutdownPanel.hidden = false;
    serverLogsPanel.hidden = false;
    await loadDirectory();
    await loadServerLogs();
  } catch (error) {
    showError(error);
  }
}

initialize();
