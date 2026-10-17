const panelAuth = window.VitaLoadPanelAuth;
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
let currentPath = '';
let selectedFile = '';
let resolveDialog;

function clearSelection() {
  selectedFile = '';
  selectedFileLabel.textContent = 'Aucun fichier sélectionné';
  contentEditor.value = '';
  contentEditor.hidden = true;
  editorEmpty.hidden = false;
  editorPanel.hidden = true;
  saveButton.disabled = true;
  fileMessage.textContent = '';
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
  root.textContent = 'VitaLoad';
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

  const displayPath = `/VitaLoad${currentPath ? `/${currentPath}` : ''}`;
  terminalPrompt.textContent = `${displayPath} $`;
}

function createAction(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `vl-button vl-button-secondary item-action ${className || ''}`.trim();
  button.textContent = label === 'Renommer' ? '✎' : '🗑';
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
    createAction('Renommer', '', () => renameEntry(itemPath, entry.name)),
    createAction('Supprimer', 'vl-button-danger', () => deleteEntry(itemPath, entry.name))
  );
  card.append(openButton, actions);
  return card;
}

async function loadDirectory(directory = currentPath) {
  pageError.textContent = '';
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
  } catch (error) {
    showError(error);
  }
}

async function openFile(filePath) {
  pageError.textContent = '';
  try {
    const data = await panelAuth.request(
      `/vital/api/panel/serveur/file?path=${encodeURIComponent(filePath)}`
    );
    selectedFile = data.path;
    selectedFileLabel.textContent = selectedFile;
    contentEditor.value = data.content;
    contentEditor.hidden = false;
    editorEmpty.hidden = true;
    editorPanel.hidden = false;
    saveButton.disabled = false;
    fileMessage.textContent = '';
    await loadDirectory();
  } catch (error) {
    showError(error);
  }
}

function showFileDialog({ title, message = '', label = '', value = '', confirmLabel = 'Confirmer', input = true }) {
  fileDialogTitle.textContent = title;
  fileDialogMessage.textContent = message;
  fileDialogMessage.hidden = !message;
  fileDialogLabel.textContent = label;
  fileDialogLabel.hidden = !input;
  fileDialogInput.hidden = !input;
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
    uploadMessage.textContent = `${result.uploaded} fichier(s) importé(s).`;
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

saveButton.addEventListener('click', async () => {
  if (!selectedFile) return;
  saveButton.disabled = true;
  fileMessage.textContent = '';
  try {
    await panelAuth.request('/vital/api/panel/serveur/file', {
      method: 'PUT',
      body: JSON.stringify({ path: selectedFile, content: contentEditor.value })
    });
    fileMessage.textContent = 'Fichier enregistré.';
    await loadDirectory();
  } catch (error) {
    fileMessage.textContent = error.message;
  } finally {
    saveButton.disabled = false;
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

async function initialize() {
  try {
    const session = await panelAuth.requireSession();
    document.getElementById('username').textContent = session.username;
    await loadDirectory();
  } catch (error) {
    showError(error);
  }
}

initialize();
