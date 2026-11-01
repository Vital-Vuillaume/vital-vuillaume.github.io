const databaseName = 'vitaload-video-library';
const databaseVersion = 1;
const allowedExtensions = new Set([
  '3gp', 'avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'ts', 'webm'
]);
const sessionKey = 'panel_session_id';
const sharedLibrary = document.getElementById('shared-library');
const sharedLibraryMessage = document.getElementById('shared-library-message');
const localLibrary = document.getElementById('local-library');
const sharedEmpty = document.getElementById('shared-library-empty');
const localEmpty = document.getElementById('local-library-empty');
const sharedUsage = document.getElementById('shared-library-usage');
const localStorageUsed = document.getElementById('local-storage-used');
const localStorageAvailable = document.getElementById('local-storage-available');
const localStorageQuota = document.getElementById('local-storage-quota');
const localStorageProgress = document.getElementById('local-storage-progress');
const localStorageNote = document.getElementById('local-storage-note');
const localStorageDetails = document.getElementById('local-storage-details');
const localStorageEmpty = document.getElementById('local-storage-empty');
const sharedStorageUsed = document.getElementById('shared-storage-used');
const sharedStorageAvailable = document.getElementById('shared-storage-available');
const sharedStorageQuota = document.getElementById('shared-storage-quota');
const sharedStorageProgress = document.getElementById('shared-storage-progress');
const sharedStorageNote = document.getElementById('shared-storage-note');
const sharedStorageDetails = document.getElementById('shared-storage-details');
const sharedStorageEmpty = document.getElementById('shared-storage-empty');
const uploadForm = document.getElementById('upload-form');
const uploadDestinationField = document.getElementById('upload-destination-field');
const uploadDestination = document.getElementById('upload-destination');
const uploadType = document.getElementById('upload-type');
const uploadTitle = document.getElementById('upload-title');
const seriesTitleField = document.getElementById('series-title-field');
const dropHelp = document.getElementById('drop-help');
const dropInstruction = document.getElementById('drop-instruction');
const uploadEyebrow = document.getElementById('upload-eyebrow');
const uploadStorageLabel = document.getElementById('upload-storage-label');
const folderInput = document.getElementById('video-folder');
const chooseFolderButton = document.getElementById('choose-folder');
const fileExplorer = document.getElementById('file-explorer');
const explorerBreadcrumbs = document.getElementById('explorer-breadcrumbs');
const explorerCurrentFolder = document.getElementById('explorer-current-folder');
const explorerList = document.getElementById('explorer-list');
const explorerEmpty = document.getElementById('explorer-empty');
const explorerHint = document.getElementById('explorer-hint');
const selectedFilesLabel = document.getElementById('selected-files');
const uploadSubmit = document.getElementById('upload-submit');
const uploadProgress = document.getElementById('upload-progress');
const uploadMessage = document.getElementById('upload-message');
const playerDialog = document.getElementById('video-player-dialog');
const videoPlayer = document.getElementById('video-player');
const playerTitle = document.getElementById('player-title');
const playerSubtitle = document.getElementById('player-subtitle');
const playerKind = document.getElementById('player-kind');
const playerMessage = document.getElementById('player-message');
const seasonOption = document.getElementById('season-option');
const episodeOption = document.getElementById('episode-option');
const seasonSelect = document.getElementById('season-select');
const episodeSelect = document.getElementById('episode-select');
const playbackSpeed = document.getElementById('playback-speed');
const subtitleInput = document.getElementById('subtitle-file');
const autoplayNext = document.getElementById('autoplay-next');
let selectedVideos = [];
let isSuperadmin = false;
let currentCollection = null;
let currentSource = 'local';
let currentEpisodeIndex = 0;
let currentVideoUrl = '';
let currentSubtitleUrl = '';
let databasePromise;
let selectedFromFolder = false;
let explorerEntries = [];
let explorerRootName = '';
let explorerPath = '';
let selectedPaths = new Set();

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('collections')) {
        database.createObjectStore('collections', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('videos')) {
        const store = database.createObjectStore('videos', { keyPath: 'id' });
        store.createIndex('collectionId', 'collectionId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };
  });
  return databasePromise;
}

function transactionPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Enregistrement local annulé.'));
  });
}

function localVideoId() {
  return crypto.randomUUID();
}

async function saveLocalCollection(collection, files) {
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  transaction.objectStore('collections').put(collection);
  for (const { id, file, collectionId, ...metadata } of files) {
    transaction.objectStore('videos').put({
      id,
      collectionId,
      ...metadata,
      blob: file
    });
  }
  await completed;
}

async function getLocalCollections() {
  const database = await openDatabase();
  return requestPromise(database.transaction('collections').objectStore('collections').getAll());
}

async function getLocalVideo(id) {
  const database = await openDatabase();
  return requestPromise(database.transaction('videos').objectStore('videos').get(id));
}

async function removeLocalCollection(collection) {
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  transaction.objectStore('collections').delete(collection.id);
  const videoStore = transaction.objectStore('videos');
  const index = videoStore.index('collectionId');
  const videos = await requestPromise(index.getAllKeys(IDBKeyRange.only(collection.id)));
  for (const id of videos) videoStore.delete(id);
  await completed;
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

function collectionByteSize(collection) {
  return collection.videos.reduce((sum, video) => {
    const size = Number(video.sizeBytes);
    return sum + (Number.isFinite(size) && size >= 0 ? size : 0);
  }, 0);
}

function collectionCounts(collections) {
  const movies = collections.filter((collection) => collection.type === 'movie').length;
  const series = collections.filter((collection) => collection.type === 'series').length;
  const episodes = collections.reduce((sum, collection) => sum + collection.videos.length, 0);
  return `${movies} film${movies === 1 ? '' : 's'} · ${series} série${series === 1 ? '' : 's'} · ${episodes} épisode${episodes === 1 ? '' : 's'}`;
}

function renderStorageDetails(container, collections) {
  container.replaceChildren();
  for (const collection of collections) {
    const details = makeElement('details', 'storage-collection');
    const summary = document.createElement('summary');
    const name = makeElement('span', 'storage-collection-title', collection.title);
    const size = makeElement('strong', 'storage-collection-size', formatBytes(collectionByteSize(collection)));
    summary.append(name, size);
    details.append(summary);

    const episodes = document.createElement('ul');
    episodes.className = 'storage-episode-list';
    for (const video of collection.videos) {
      const item = document.createElement('li');
      const videoTitle = video.title || video.fileName || 'Vidéo sans titre';
      const description = collection.type === 'series'
        ? `${video.seasonName || 'Saison inconnue'} · Épisode ${video.episodeOrder || '?'} · ${videoTitle}`
        : videoTitle;
      item.append(
        makeElement('span', '', description),
        makeElement('strong', '', formatBytes(Number(video.sizeBytes)))
      );
      episodes.append(item);
    }
    details.append(episodes);
    container.append(details);
  }
}

function updateSharedStorage(data) {
  const collections = data.collections;
  const usedBytes = Number(data.usedBytes);
  const quotaBytes = Number(data.quotaBytes);
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);
  sharedStorageUsed.textContent = formatBytes(usedBytes);
  sharedStorageAvailable.textContent = formatBytes(remainingBytes);
  sharedStorageQuota.textContent = formatBytes(quotaBytes);
  sharedStorageProgress.value = quotaBytes > 0
    ? Math.min(100, (usedBytes / quotaBytes) * 100)
    : 0;
  sharedStorageNote.textContent = collectionCounts(collections);
  renderStorageDetails(sharedStorageDetails, collections);
  sharedStorageEmpty.hidden = collections.length > 0;
}

async function updateLocalStorage(collections) {
  const usedBytes = collections.reduce((sum, collection) => sum + collectionByteSize(collection), 0);
  localStorageUsed.textContent = formatBytes(usedBytes);
  localStorageNote.textContent = collectionCounts(collections);
  renderStorageDetails(localStorageDetails, collections);
  localStorageEmpty.hidden = collections.length > 0;

  if (!navigator.storage?.estimate) {
    localStorageAvailable.textContent = 'Indisponible';
    localStorageQuota.textContent = 'Indisponible';
    localStorageProgress.value = 0;
    localStorageNote.textContent += ' · Estimation du quota non prise en charge par ce navigateur.';
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quotaBytes = Number(estimate.quota);
    const originUsageBytes = Number(estimate.usage);
    if (!Number.isFinite(quotaBytes) || quotaBytes <= 0 || !Number.isFinite(originUsageBytes)) {
      throw new Error('Le navigateur n’a pas fourni d’estimation valide.');
    }
    localStorageAvailable.textContent = formatBytes(Math.max(0, quotaBytes - originUsageBytes));
    localStorageQuota.textContent = formatBytes(quotaBytes);
    localStorageProgress.value = Math.min(100, (originUsageBytes / quotaBytes) * 100);
    localStorageNote.textContent =
      `${collectionCounts(collections)} · Libre estimé pour l’ensemble des données de ce site dans le navigateur.`;
  } catch (error) {
    localStorageAvailable.textContent = 'Indisponible';
    localStorageQuota.textContent = 'Indisponible';
    localStorageProgress.value = 0;
    localStorageNote.textContent =
      `${collectionCounts(collections)} · Estimation du quota impossible : ${error.message}`;
  }
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('is-error', isError);
}

function extensionOf(name) {
  return name.split('.').pop().toLowerCase();
}

function isVideoFile(file) {
  return allowedExtensions.has(extensionOf(file.name));
}

function displayName(filePath) {
  const filename = filePath.split('/').pop() || filePath;
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Vidéo';
}

function naturalCompare(left, right) {
  return left.localeCompare(right, 'fr', { numeric: true, sensitivity: 'base' });
}

function episodeDetails(entry, index) {
  const pathParts = entry.path.split('/').filter(Boolean);
  let seasonNumber = null;
  for (const part of pathParts.slice(0, -1)) {
    const match = /^(?:saison|season|s)\s*(\d+)$/i.exec(part);
    if (match) {
      seasonNumber = Number(match[1]);
      break;
    }
  }
  const filenameMatch = /(?:^|[^a-z0-9])s(\d{1,3})[\s._-]*e(\d{1,4})(?:[^0-9]|$)|(?:^|[^0-9])(\d{1,3})x(\d{1,4})(?:[^0-9]|$)/i.exec(entry.file.name);
  if (filenameMatch) seasonNumber = seasonNumber || Number(filenameMatch[1] || filenameMatch[3]);
  const seasonOrder = seasonNumber || 1;
  const seasonName = `Saison ${seasonOrder}`;
  const episodeOrder = filenameMatch ? Number(filenameMatch[2] || filenameMatch[4]) : index + 1;
  return {
    title: displayName(entry.file.name),
    seasonName,
    seasonOrder,
    episodeOrder
  };
}

function createSeasonEntries(files) {
  const initial = files.map((entry) => ({ ...entry, details: episodeDetails(entry, 0) }));
  const groups = new Map();
  for (const entry of initial) {
    const group = groups.get(entry.details.seasonOrder) || [];
    group.push(entry);
    groups.set(entry.details.seasonOrder, group);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([seasonOrder, seasonFiles]) => {
      seasonFiles.sort((left, right) => naturalCompare(left.file.name, right.file.name));
      const assigned = new Set();
      return seasonFiles.map((entry, index) => {
        let episodeOrder = entry.details.episodeOrder;
        if (assigned.has(episodeOrder)) episodeOrder = index + 1;
        assigned.add(episodeOrder);
        return {
          ...entry,
          details: {
            ...entry.details,
            seasonOrder,
            seasonName: `Saison ${seasonOrder}`,
            episodeOrder
          }
        };
      });
    });
}

function getSelectedEntries() {
  if (uploadType.value === 'movie' && selectedFromFolder) {
    throw new Error('En mode Film, sélectionne des vidéos individuelles. Choisis Série pour importer un dossier.');
  }
  const files = selectedVideos.filter(({ file }) => isVideoFile(file));
  if (files.length === 0) throw new Error('Sélectionne au moins une vidéo compatible.');
  if (uploadType.value === 'series') return createSeasonEntries(files);
  return files.sort((left, right) => naturalCompare(left.path, right.path)).map((entry) => ({
    ...entry,
    details: { title: displayName(entry.file.name), seasonName: null, seasonOrder: null, episodeOrder: 1 }
  }));
}

function updateSelectedFiles() {
  const valid = selectedVideos.filter(({ file }) => isVideoFile(file));
  if (valid.length === 0) {
    selectedFilesLabel.textContent = 'Aucune vidéo sélectionnée.';
    return;
  }
  const total = valid.reduce((sum, entry) => sum + entry.file.size, 0);
  selectedFilesLabel.textContent =
    `${valid.length} vidéo${valid.length === 1 ? '' : 's'} · ${formatBytes(total)} · ` +
    valid.slice(0, 3).map((entry) => entry.path.split('/').pop()).join(', ') +
    (valid.length > 3 ? ` et ${valid.length - 3} autre(s)` : '');
}

function updateUploadCopy() {
  const isSeries = uploadType.value === 'series';
  if (!isSeries && selectedFromFolder) {
    selectedVideos = [];
    selectedPaths.clear();
    selectedFromFolder = false;
    updateSelectedFiles();
    setMessage(uploadMessage, '');
  }
  seriesTitleField.hidden = !isSeries;
  uploadTitle.required = isSeries;
  dropInstruction.textContent = isSeries
    ? 'Parcours les dossiers pour choisir une série complète'
    : 'Parcours les dossiers et sélectionne les films à importer';
  dropHelp.textContent = isSeries
    ? 'Ouvre le dossier de la série, puis choisis-le : les sous-dossiers de saisons seront reconnus.'
    : 'Tu peux naviguer dans les sous-dossiers, puis sélectionner un ou plusieurs fichiers vidéo.';
}

function updateUploadDestinationCopy() {
  const isSharedDestination = isSuperadmin && uploadDestination.value === 'shared';
  uploadEyebrow.textContent = isSharedDestination ? 'Bibliothèque publique' : 'Bibliothèque personnelle';
  uploadStorageLabel.textContent = isSharedDestination
    ? 'Visible par tous · quota serveur 10 Gio'
    : 'Enregistré uniquement dans ce navigateur';
  uploadSubmit.textContent = isSharedDestination
    ? 'Importer et partager'
    : 'Enregistrer dans ma bibliothèque';
}

function useFiles(fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return;
  const firstRelativePath = files[0].webkitRelativePath || files[0].name;
  explorerRootName = firstRelativePath.split('/')[0] || 'Dossier sélectionné';
  explorerEntries = files.map((file) => {
    const relativeParts = (file.webkitRelativePath || file.name).split('/').filter(Boolean);
    return {
      file,
      path: relativeParts.length > 1 ? relativeParts.slice(1).join('/') : file.name
    };
  });
  explorerPath = '';
  selectedPaths.clear();
  selectedVideos = [];
  selectedFromFolder = false;
  fileExplorer.hidden = false;
  setMessage(uploadMessage, '');
  renderFileExplorer();
  updateSelectedFiles();
}

function renderFileExplorer() {
  explorerBreadcrumbs.replaceChildren();
  const rootButton = makeElement('button', 'explorer-crumb', explorerRootName);
  rootButton.type = 'button';
  rootButton.addEventListener('click', () => {
    explorerPath = '';
    renderFileExplorer();
  });
  explorerBreadcrumbs.append(rootButton);

  const pathParts = explorerPath.split('/').filter(Boolean);
  pathParts.forEach((part, index) => {
    explorerBreadcrumbs.append(makeElement('span', 'explorer-breadcrumb-separator', '/'));
    const crumb = makeElement('button', 'explorer-crumb', part);
    crumb.type = 'button';
    crumb.addEventListener('click', () => {
      explorerPath = pathParts.slice(0, index + 1).join('/');
      renderFileExplorer();
    });
    explorerBreadcrumbs.append(crumb);
  });

  const currentFolderName = pathParts[pathParts.length - 1];
  const canUseCurrentFolder = uploadType.value === 'series' && currentFolderName &&
    canSelectSeriesFolder(explorerPath, currentFolderName);
  explorerCurrentFolder.hidden = !canUseCurrentFolder;
  explorerCurrentFolder.textContent = canUseCurrentFolder
    ? `Choisir « ${currentFolderName} » comme série`
    : 'Choisir ce dossier comme série';

  explorerList.replaceChildren();
  const currentParts = pathParts;
  const prefix = currentParts.length ? `${currentParts.join('/')}/` : '';
  const childFolders = new Set();
  const currentFiles = [];
  for (const entry of explorerEntries) {
    if (!entry.path.startsWith(prefix)) continue;
    const remainder = entry.path.slice(prefix.length);
    const separator = remainder.indexOf('/');
    if (separator >= 0) childFolders.add(remainder.slice(0, separator));
    else currentFiles.push(entry);
  }

  for (const folderName of [...childFolders].sort((left, right) => naturalCompare(left, right))) {
    const folderPath = prefix ? `${prefix}${folderName}` : folderName;
    const row = makeElement('div', 'explorer-entry explorer-folder');
    const openButton = makeElement('button', 'explorer-open-folder', `📁 ${folderName}`);
    openButton.type = 'button';
    openButton.addEventListener('click', () => {
      explorerPath = folderPath;
      renderFileExplorer();
    });
    row.append(openButton);
    if (uploadType.value === 'series' && canSelectSeriesFolder(folderPath, folderName)) {
      const chooseSeriesButton = makeElement('button', 'explorer-use-folder', 'Choisir cette série');
      chooseSeriesButton.type = 'button';
      chooseSeriesButton.addEventListener('click', () => selectExplorerSeries(folderPath, folderName));
      row.append(chooseSeriesButton);
    }
    explorerList.append(row);
  }

  currentFiles.sort((left, right) => naturalCompare(left.file.name, right.file.name));
  for (const entry of currentFiles) {
    const row = makeElement('label', 'explorer-entry explorer-file');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedPaths.has(entry.path);
    checkbox.disabled = !isVideoFile(entry.file);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedPaths.add(entry.path);
      else selectedPaths.delete(entry.path);
      selectedFromFolder = false;
      selectedVideos = explorerEntries.filter((candidate) => selectedPaths.has(candidate.path));
      updateSelectedFiles();
    });
    const fileName = makeElement('span', 'explorer-file-name', `🎞 ${entry.file.name}`);
    const size = makeElement('span', 'explorer-file-size', formatBytes(entry.file.size));
    row.append(checkbox, fileName, size);
    explorerList.append(row);
  }

  explorerEmpty.hidden = childFolders.size > 0 || currentFiles.length > 0;
  explorerHint.textContent = uploadType.value === 'series'
    ? 'Ouvre le dossier de la série (par exemple « tulsa-king »), puis clique sur « Choisir cette série ». Les dossiers de saisons ne sont pas proposés comme séries.'
    : 'Coche les fichiers vidéo à importer. Les dossiers servent uniquement à naviguer : ils ne seront pas importés comme films.';
}

function canSelectSeriesFolder(folderPath, folderName) {
  if (/^(?:film|films|movie|movies|serie|series|tv|video|videos)$/i.test(folderName)) return false;
  if (/^(?:saison|season|s)\s*\d+$/i.test(folderName)) return false;
  const prefix = folderPath ? `${folderPath}/` : '';
  let hasDirectVideo = false;
  let hasSeasonFolder = false;
  for (const entry of explorerEntries) {
    if (!entry.path.startsWith(prefix)) continue;
    const remainder = entry.path.slice(prefix.length);
    const separator = remainder.indexOf('/');
    if (separator < 0 && isVideoFile(entry.file)) hasDirectVideo = true;
    if (separator >= 0 && /^(?:saison|season|s)\s*\d+$/i.test(remainder.slice(0, separator))) {
      hasSeasonFolder = true;
    }
    if (hasDirectVideo || hasSeasonFolder) return true;
  }
  return false;
}

function selectExplorerSeries(folderPath, title) {
  const prefix = `${folderPath}/`;
  const videos = explorerEntries.filter((entry) =>
    entry.path.startsWith(prefix) && isVideoFile(entry.file)
  );
  if (videos.length === 0) {
    setMessage(uploadMessage, 'Ce dossier ne contient aucune vidéo compatible.', true);
    return;
  }
  selectedVideos = videos;
  selectedPaths = new Set(videos.map((entry) => entry.path));
  selectedFromFolder = true;
  uploadTitle.value = title;
  updateSelectedFiles();
  setMessage(uploadMessage, `Dossier « ${title} » sélectionné comme série.`);
  renderFileExplorer();
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function collectionEpisodeCount(collection) {
  return collection.videos.length;
}

function renderCollection(container, collection, source) {
  const card = makeElement('article', 'video-card');
  const top = makeElement('div', 'video-card-top');
  const title = makeElement('h3', '', collection.title);
  const badge = makeElement('span', 'video-type-badge', collection.type === 'series' ? 'Série' : 'Film');
  top.append(title, badge);
  const count = collectionEpisodeCount(collection);
  const meta = makeElement(
    'p',
    'video-card-meta',
    collection.type === 'series'
      ? `${new Set(collection.videos.map((video) => video.seasonName)).size} saison(s) · ${count} épisode(s)`
      : `${count} film${count === 1 ? '' : 's'}`
  );
  const actions = makeElement('div', 'video-card-actions');
  const playButton = makeElement('button', 'vl-button', collection.type === 'series' ? 'Ouvrir la série' : 'Regarder');
  playButton.type = 'button';
  playButton.dataset.action = 'play';
  playButton.dataset.source = source;
  playButton.dataset.collectionId = collection.id;
  actions.append(playButton);
  if (source === 'local' || isSuperadmin) {
    const deleteButton = makeElement('button', 'vl-button vl-button-secondary', 'Supprimer');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.source = source;
    deleteButton.dataset.collectionId = collection.id;
    actions.append(deleteButton);
  }
  card.append(top, meta, actions);
  container.append(card);
}

async function renderLocalLibrary() {
  const collections = await getLocalCollections();
  collections.sort((left, right) => right.createdAt - left.createdAt);
  localLibrary.replaceChildren();
  for (const collection of collections) renderCollection(localLibrary, collection, 'local');
  localEmpty.hidden = collections.length > 0;
  await updateLocalStorage(collections);
}

async function loadSharedLibrary() {
  try {
    const response = await fetch('/vital/api/videos/shared');
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`La bibliothèque publique a renvoyé une réponse invalide (${response.status}).`);
    }
    if (!response.ok) throw new Error(data.error || 'Impossible de charger la bibliothèque publique.');
    sharedLibraryMessage.hidden = true;
    setMessage(sharedLibraryMessage, '');
    sharedLibrary.replaceChildren();
    for (const collection of data.collections) {
      renderCollection(sharedLibrary, collection, 'shared');
    }
    sharedEmpty.hidden = data.collections.length > 0;
    sharedUsage.textContent =
      `${formatBytes(data.usedBytes)} utilisés sur ${formatBytes(data.quotaBytes)}`;
    updateSharedStorage(data);
  } catch (error) {
    setMessage(sharedLibraryMessage, error.message, true);
    sharedLibraryMessage.hidden = false;
    sharedUsage.textContent = 'Bibliothèque indisponible';
    sharedStorageUsed.textContent = 'Indisponible';
    sharedStorageAvailable.textContent = 'Indisponible';
    sharedStorageQuota.textContent = 'Indisponible';
    sharedStorageProgress.value = 0;
    sharedStorageNote.textContent = `Impossible de charger le détail du stockage : ${error.message}`;
    sharedStorageDetails.replaceChildren();
    sharedStorageEmpty.hidden = true;
  }
}

async function detectSuperadmin() {
  const sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) return;
  try {
    const response = await fetch('/vital/api/panel/auth/session', {
      headers: { 'X-Panel-Session': sessionId }
    });
    if (!response.ok) return;
    const session = await response.json();
    isSuperadmin = session.role === 'superadmin';
    if (isSuperadmin) {
      uploadDestinationField.hidden = false;
      updateUploadDestinationCopy();
    }
  } catch (error) {
    console.error('Impossible de vérifier le rôle pour la bibliothèque vidéo :', error);
  }
}

function postSharedVideos(entries, type, title) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', title);
    formData.append('entries', JSON.stringify(entries.map(({ details }) => details)));
    for (const entry of entries) formData.append('files', entry.file, entry.file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/vital/api/videos/upload');
    xhr.setRequestHeader('X-Panel-Session', localStorage.getItem(sessionKey));
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      uploadProgress.value = Math.round(event.loaded / event.total * 100);
    });
    xhr.addEventListener('load', () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        reject(new Error('Le serveur a renvoyé une réponse invalide.'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data.error || `Import refusé (${xhr.status}).`));
        return;
      }
      resolve(data);
    });
    xhr.addEventListener('error', () => reject(new Error('La connexion a échoué pendant le dépôt vidéo.')));
    xhr.addEventListener('abort', () => reject(new Error('Le dépôt vidéo a été interrompu.')));
    xhr.send(formData);
  });
}

async function saveLocally(entries, type, title) {
  if (type === 'movie') {
    for (const entry of entries) {
      const id = localVideoId();
      const collectionId = localVideoId();
      const movieTitle = entries.length === 1 ? title : entry.details.title;
      await saveLocalCollection({
        id: collectionId,
        type,
        title: movieTitle,
        createdAt: Date.now(),
        videos: [{
          id,
          fileName: entry.file.name,
          title: movieTitle,
          seasonName: null,
          seasonOrder: null,
          episodeOrder: 1
        }]
      }, [{
        id,
        collectionId,
        file: entry.file,
        fileName: entry.file.name,
        title: movieTitle,
        mimeType: entry.file.type || 'application/octet-stream',
        sizeBytes: entry.file.size,
        seasonName: null,
        seasonOrder: null,
        episodeOrder: 1
      }]);
    }
    return;
  }

  const collectionId = localVideoId();
  const videos = entries.map((entry) => {
    const id = localVideoId();
    return {
      id,
      collectionId,
      file: entry.file,
      fileName: entry.file.name,
      title: entry.details.title,
      mimeType: entry.file.type || 'application/octet-stream',
      sizeBytes: entry.file.size,
      seasonName: entry.details.seasonName,
      seasonOrder: entry.details.seasonOrder,
      episodeOrder: entry.details.episodeOrder
    };
  });
  await saveLocalCollection({
    id: collectionId,
    type,
    title,
    createdAt: Date.now(),
    videos: videos.map(({ file, collectionId: ignoredCollectionId, ...video }) => video)
  }, videos);
}

function clearUploadSelection() {
  uploadForm.reset();
  selectedVideos = [];
  selectedPaths.clear();
  selectedFromFolder = false;
  folderInput.value = '';
  updateSelectedFiles();
  updateUploadCopy();
  updateUploadDestinationCopy();
  if (!fileExplorer.hidden) renderFileExplorer();
}

async function handleUpload(event) {
  event.preventDefault();
  setMessage(uploadMessage, '');
  let entries;
  try {
    entries = getSelectedEntries();
    const title = uploadType.value === 'series'
      ? uploadTitle.value.trim()
      : displayName(entries[0].file.name);
    uploadSubmit.disabled = true;
    uploadProgress.hidden = false;
    uploadProgress.value = 0;
    const shareWithEveryone = isSuperadmin && uploadDestination.value === 'shared';
    if (shareWithEveryone) {
      const data = await postSharedVideos(entries, uploadType.value, title);
      sharedLibrary.replaceChildren();
      for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
      sharedEmpty.hidden = data.collections.length > 0;
      sharedUsage.textContent =
        `${formatBytes(data.usedBytes)} utilisés sur ${formatBytes(data.quotaBytes)}`;
      updateSharedStorage(data);
      setMessage(uploadMessage, 'Dépôt terminé. Les vidéos sont maintenant visibles par tous.');
    } else {
      await saveLocally(entries, uploadType.value, title);
      await renderLocalLibrary();
      setMessage(
        uploadMessage,
        isSuperadmin
          ? 'Enregistré uniquement dans ta bibliothèque locale. Les autres utilisateurs ne le verront pas.'
          : 'Enregistré dans la bibliothèque de ce navigateur.'
      );
    }
    clearUploadSelection();
  } catch (error) {
    const quotaMessage = error && error.name === 'QuotaExceededError'
      ? 'Le navigateur n’a plus assez d’espace. Libère de la place ou choisis un stockage géré par le serveur.'
      : error.message;
    setMessage(uploadMessage, quotaMessage, true);
  } finally {
    uploadSubmit.disabled = false;
    uploadProgress.hidden = true;
  }
}

function sortedEpisodes(collection) {
  return [...collection.videos].sort((left, right) =>
    (left.seasonOrder || 0) - (right.seasonOrder || 0) ||
    (left.episodeOrder || 0) - (right.episodeOrder || 0) ||
    naturalCompare(left.fileName, right.fileName)
  );
}

function fillEpisodeOptions() {
  const episodes = sortedEpisodes(currentCollection);
  const isSeries = currentCollection.type === 'series';
  seasonOption.hidden = !isSeries;
  episodeOption.hidden = !isSeries;
  if (!isSeries) return;

  const seasons = [...new Map(episodes.map((episode) => [
    episode.seasonOrder,
    { order: episode.seasonOrder, name: episode.seasonName }
  ])).values()].sort((left, right) => left.order - right.order);
  seasonSelect.replaceChildren();
  for (const season of seasons) {
    const option = document.createElement('option');
    option.value = String(season.order);
    option.textContent = season.name;
    seasonSelect.append(option);
  }
  seasonSelect.value = String(episodes[currentEpisodeIndex].seasonOrder);
  updateEpisodeOptions(episodes);
}

function updateEpisodeOptions(episodes = sortedEpisodes(currentCollection)) {
  const selectedSeason = Number(seasonSelect.value);
  episodeSelect.replaceChildren();
  const seasonEpisodes = episodes.filter((episode) => episode.seasonOrder === selectedSeason);
  for (const episode of seasonEpisodes) {
    const option = document.createElement('option');
    option.value = episode.id;
    option.textContent = `${episode.episodeOrder}. ${episode.title}`;
    episodeSelect.append(option);
  }
  const selected = episodes[currentEpisodeIndex];
  if (selected && seasonEpisodes.some((episode) => episode.id === selected.id)) {
    episodeSelect.value = selected.id;
  } else if (seasonEpisodes.length) {
    episodeSelect.value = seasonEpisodes[0].id;
    currentEpisodeIndex = episodes.findIndex((episode) => episode.id === episodeSelect.value);
  }
}

function clearPlayerUrls() {
  videoPlayer.pause();
  videoPlayer.removeAttribute('src');
  videoPlayer.replaceChildren();
  videoPlayer.load();
  if (currentVideoUrl.startsWith('blob:')) URL.revokeObjectURL(currentVideoUrl);
  if (currentSubtitleUrl.startsWith('blob:')) URL.revokeObjectURL(currentSubtitleUrl);
  currentVideoUrl = '';
  currentSubtitleUrl = '';
}

async function showEpisode(index, shouldPlay = false) {
  const episodes = sortedEpisodes(currentCollection);
  if (index < 0 || index >= episodes.length) return;
  currentEpisodeIndex = index;
  const episode = episodes[index];
  playerTitle.textContent = currentCollection.title;
  playerSubtitle.textContent = currentCollection.type === 'series'
    ? `${episode.seasonName} · Épisode ${episode.episodeOrder} · ${episode.title}`
    : episode.fileName;
  if (currentCollection.type === 'series') {
    seasonSelect.value = String(episode.seasonOrder);
    updateEpisodeOptions(episodes);
    episodeSelect.value = episode.id;
  }
  setMessage(playerMessage, '');
  clearPlayerUrls();

  if (currentSource === 'shared') {
    currentVideoUrl = `/vital/api/videos/shared/${encodeURIComponent(episode.id)}`;
  } else {
    const storedVideo = await getLocalVideo(episode.id);
    if (!storedVideo) {
      setMessage(playerMessage, 'Cette vidéo locale est introuvable dans IndexedDB.', true);
      return;
    }
    currentVideoUrl = URL.createObjectURL(storedVideo.blob);
  }
  videoPlayer.src = currentVideoUrl;
  videoPlayer.playbackRate = Number(playbackSpeed.value);
  videoPlayer.load();
  if (shouldPlay) {
    try {
      await videoPlayer.play();
    } catch (error) {
      setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
    }
  }
}

async function openPlayer(collection, source) {
  currentCollection = collection;
  currentSource = source;
  currentEpisodeIndex = 0;
  playerKind.textContent = collection.type === 'series' ? 'Série' : 'Film';
  fillEpisodeOptions();
  playerDialog.showModal();
  await showEpisode(0, true);
}

async function handleCollectionAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const collectionId = button.dataset.collectionId;
  const source = button.dataset.source;
  const action = button.dataset.action;
  try {
    if (action === 'play') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await (await fetch('/vital/api/videos/shared')).json()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection) throw new Error('Film ou série introuvable.');
      await openPlayer(collection, source);
      return;
    }
    if (action !== 'delete' || !window.confirm('Supprimer ce film ou cette série ?')) return;
    if (source === 'local') {
      const collections = await getLocalCollections();
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection) throw new Error('Film ou série introuvable.');
      await removeLocalCollection(collection);
      await renderLocalLibrary();
      return;
    }
    const sessionId = localStorage.getItem(sessionKey);
    const response = await fetch(`/vital/api/videos/${encodeURIComponent(collectionId)}`, {
      method: 'DELETE',
      headers: { 'X-Panel-Session': sessionId }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Suppression impossible.');
    sharedLibrary.replaceChildren();
    for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
    sharedEmpty.hidden = data.collections.length > 0;
    sharedUsage.textContent =
      `${formatBytes(data.usedBytes)} utilisés sur ${formatBytes(data.quotaBytes)}`;
    updateSharedStorage(data);
  } catch (error) {
    window.alert(error.message);
  }
}

chooseFolderButton.addEventListener('click', () => folderInput.click());
folderInput.addEventListener('change', () => useFiles(folderInput.files));
explorerCurrentFolder.addEventListener('click', () => {
  const folderName = explorerPath.split('/').filter(Boolean).pop();
  if (folderName) selectExplorerSeries(explorerPath, folderName);
});
uploadType.addEventListener('change', () => {
  updateUploadCopy();
  if (!fileExplorer.hidden) renderFileExplorer();
});
uploadDestination.addEventListener('change', updateUploadDestinationCopy);
uploadForm.addEventListener('submit', handleUpload);
sharedLibrary.addEventListener('click', handleCollectionAction);
localLibrary.addEventListener('click', handleCollectionAction);
updateUploadCopy();

document.getElementById('close-player').addEventListener('click', () => playerDialog.close());
playerDialog.addEventListener('close', clearPlayerUrls);
seasonSelect.addEventListener('change', async () => {
  updateEpisodeOptions();
  const index = sortedEpisodes(currentCollection).findIndex(
    (episode) => episode.id === episodeSelect.value
  );
  await showEpisode(index, true);
});
episodeSelect.addEventListener('change', async () => {
  const index = sortedEpisodes(currentCollection).findIndex((episode) => episode.id === episodeSelect.value);
  await showEpisode(index, true);
});
playbackSpeed.addEventListener('change', () => {
  videoPlayer.playbackRate = Number(playbackSpeed.value);
});
subtitleInput.addEventListener('change', () => {
  const subtitle = subtitleInput.files[0];
  if (!subtitle) return;
  if (currentSubtitleUrl.startsWith('blob:')) URL.revokeObjectURL(currentSubtitleUrl);
  currentSubtitleUrl = URL.createObjectURL(subtitle);
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = subtitle.name;
  track.srclang = 'fr';
  track.src = currentSubtitleUrl;
  track.default = true;
  videoPlayer.append(track);
  setMessage(playerMessage, 'Sous-titres chargés.');
});
document.getElementById('pip-button').addEventListener('click', async () => {
  try {
    if (!document.pictureInPictureEnabled) throw new Error('L’image dans l’image n’est pas prise en charge.');
    await videoPlayer.requestPictureInPicture();
  } catch (error) {
    setMessage(playerMessage, error.message, true);
  }
});
document.getElementById('fullscreen-button').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await videoPlayer.requestFullscreen();
  } catch (error) {
    setMessage(playerMessage, `Plein écran impossible : ${error.message}`, true);
  }
});
videoPlayer.addEventListener('ended', async () => {
  if (autoplayNext.checked && currentEpisodeIndex + 1 < sortedEpisodes(currentCollection).length) {
    await showEpisode(currentEpisodeIndex + 1, true);
  }
});
videoPlayer.addEventListener('error', () => {
  if (videoPlayer.error) {
    setMessage(playerMessage, 'Ce format vidéo ne peut pas être lu par le navigateur.', true);
  }
});

(async () => {
  await detectSuperadmin();
  try {
    await renderLocalLibrary();
  } catch (error) {
    localEmpty.textContent = `Le stockage local est indisponible : ${error.message}`;
    localEmpty.hidden = false;
  }
  await loadSharedLibrary();
})();
