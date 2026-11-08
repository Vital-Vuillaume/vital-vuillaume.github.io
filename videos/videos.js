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
const dropZone = document.getElementById('drop-zone');
const videoFilesInput = document.getElementById('video-files');
const chooseFilesButton = document.getElementById('choose-files');
const selectedFilesLabel = document.getElementById('selected-files');
const uploadSubmit = document.getElementById('upload-submit');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressLabel = document.getElementById('upload-progress-label');
const uploadMessage = document.getElementById('upload-message');
const playerDialog = document.getElementById('video-player-dialog');
const videoPlayer = document.getElementById('video-player');
const playerTitle = document.getElementById('player-title');
const playerSubtitle = document.getElementById('player-subtitle');
const playerKind = document.getElementById('player-kind');
const playerMessage = document.getElementById('player-message');
const playerShell = document.querySelector('.player-shell');
const playPauseButton = document.getElementById('player-play-pause');
const seekInput = document.getElementById('player-seek');
const currentTimeLabel = document.getElementById('player-current-time');
const durationLabel = document.getElementById('player-duration');
const muteButton = document.getElementById('player-mute');
const volumeInput = document.getElementById('player-volume');
const seasonOption = document.getElementById('season-option');
const episodeOption = document.getElementById('episode-option');
const autoplayNextOption = document.getElementById('autoplay-next-option');
const seasonSelect = document.getElementById('season-select');
const episodeSelect = document.getElementById('episode-select');
const playbackSpeed = document.getElementById('playback-speed');
const autoplayNext = document.getElementById('autoplay-next');
let selectedVideos = [];
let isSuperadmin = false;
let currentCollection = null;
let currentSource = 'local';
let currentEpisodeIndex = 0;
let currentVideoUrl = '';
let databasePromise;
let fullscreenControlsTimer;
const panelAuth = window.VitaLoadPanelAuth;

function clearFullscreenControlsTimer() {
  window.clearTimeout(fullscreenControlsTimer);
  fullscreenControlsTimer = undefined;
}

function showFullscreenControls() {
  clearFullscreenControlsTimer();
  playerShell.classList.remove('fullscreen-controls-hidden');
  if (document.fullscreenElement === playerShell) {
    fullscreenControlsTimer = window.setTimeout(() => {
      playerShell.classList.add('fullscreen-controls-hidden');
    }, 2500);
  }
}

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
    valid.slice(0, 3).map((entry) => entry.file.name).join(', ') +
    (valid.length > 3 ? ` et ${valid.length - 3} autre(s)` : '');
}

function updateUploadCopy() {
  const isSeries = uploadType.value === 'series';
  seriesTitleField.hidden = !isSeries;
  uploadTitle.required = isSeries;
  dropInstruction.textContent = isSeries
    ? 'Choisis un ou plusieurs épisodes vidéo'
    : 'Choisis un ou plusieurs films vidéo';
  dropHelp.textContent = isSeries
    ? 'Dépose ou choisis plusieurs épisodes. Les noms comme S01E01 ou 1x01 aident à reconnaître leur saison et leur numéro.'
    : 'Dépose les vidéos ici, ou clique pour choisir un ou plusieurs fichiers.';
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
  const validFiles = files.filter(isVideoFile);
  selectedVideos = validFiles.map((file) => ({ file, path: file.name }));
  if (validFiles.length === 0) {
    setMessage(uploadMessage, 'Aucun fichier vidéo compatible n’a été sélectionné.', true);
  } else if (validFiles.length < files.length) {
    setMessage(
      uploadMessage,
      `${files.length - validFiles.length} fichier(s) ignoré(s) : seuls les formats vidéo compatibles sont acceptés.`,
      true
    );
  } else {
    setMessage(uploadMessage, '');
  }
  updateSelectedFiles();
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

async function loadSharedCollections() {
  const url = window.config.getApiUrl('/vital/api/videos/shared');
  const response = await fetch(url);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`La bibliothèque publique a renvoyé une réponse invalide (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(data.error || 'Impossible de charger la bibliothèque publique.');
  }
  return data;
}

async function loadSharedLibrary() {
  try {
    const data = await loadSharedCollections();
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
  if (!panelAuth.getSessionId()) return;
  try {
    const session = await panelAuth.request('/vital/api/panel/auth/session');
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
    const sessionId = panelAuth.getSessionId();
    if (!sessionId) {
      panelAuth.clearSession();
      window.location.replace('/connexion/');
      reject(new Error('Connexion requise.'));
      return;
    }

    const totalBytes = entries.reduce((total, entry) => total + entry.file.size, 0);
    const collectionId = type === 'series' ? crypto.randomUUID() : null;
    const chunkSize = 4 * 1024 ** 2;
    let uploadedBytes = 0;

    (async () => {
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        const uploadId = crypto.randomUUID();
        const chunkCount = Math.max(1, Math.ceil(entry.file.size / chunkSize));
        try {
          for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, entry.file.size);
            await new Promise((resolveUpload, rejectUpload) => {
              const query = new URLSearchParams({
                uploadId,
                name: entry.file.name,
                totalSize: String(entry.file.size),
                chunkIndex: String(chunkIndex),
                chunkCount: String(chunkCount)
              });
              const xhr = new XMLHttpRequest();
              xhr.open(
                'POST',
                window.config.getApiUrl(`/vital/api/videos/upload-chunk?${query}`)
              );
              xhr.setRequestHeader('X-Panel-Session', sessionId);
              xhr.setRequestHeader('Content-Type', 'application/octet-stream');
              xhr.responseType = 'text';
              xhr.upload.addEventListener('progress', (event) => {
                const currentBytes = event.lengthComputable ? event.loaded : 0;
                const overallBytes = uploadedBytes + start + currentBytes;
                const percent = totalBytes > 0
                  ? Math.min(100, overallBytes / totalBytes * 100)
                  : (index + (event.lengthComputable ? 1 : 0)) / entries.length * 100;
                uploadProgress.value = percent;
                uploadProgressLabel.textContent =
                  `Importation : ${index + 1}/${entries.length} vidéo(s) · ${Math.round(percent)} % ` +
                  `(${formatBytes(overallBytes)} sur ${formatBytes(totalBytes)}).`;
              });
              xhr.addEventListener('load', () => {
                let response;
                try {
                  response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                } catch {
                  response = null;
                }
                if (xhr.status === 401) {
                  panelAuth.clearSession();
                  window.location.replace('/connexion/');
                  rejectUpload(new Error('Votre session a expiré.'));
                  return;
                }
                if (xhr.status < 200 || xhr.status >= 300) {
                  rejectUpload(new Error(
                    response?.error || xhr.responseText || `Le dépôt a échoué (${xhr.status}).`
                  ));
                  return;
                }
                resolveUpload();
              });
              xhr.addEventListener('error', () =>
                rejectUpload(new Error(`Impossible d’envoyer « ${entry.file.name} » au serveur.`))
              );
              xhr.addEventListener('abort', () =>
                rejectUpload(new Error(`Le dépôt de « ${entry.file.name} » a été interrompu.`))
              );
              xhr.send(entry.file.slice(start, end));
            });

            uploadProgress.value = totalBytes > 0
              ? Math.min(100, (uploadedBytes + end) / totalBytes * 100)
              : (index + 1) / entries.length * 100;
            uploadProgressLabel.textContent =
              `Importation : ${index + 1}/${entries.length} vidéo(s) · ` +
              `${Math.round(uploadProgress.value)} % ` +
              `(${formatBytes(uploadedBytes + end)} sur ${formatBytes(totalBytes)}).`;
          }

          await panelAuth.request('/vital/api/videos/upload-complete', {
            method: 'POST',
            body: JSON.stringify({
              uploadId,
              name: entry.file.name,
              type,
              title,
              entry: entry.details,
              collectionId: collectionId || crypto.randomUUID()
            })
          });
          uploadedBytes += entry.file.size;
        } catch (error) {
          try {
            await panelAuth.request('/vital/api/videos/upload-cancel', {
              method: 'POST',
              body: JSON.stringify({ uploadId })
            });
          } catch (cleanupError) {
            const originalError = error instanceof Error ? error : new Error(String(error));
            const cleanupMessage = cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError);
            originalError.message =
              `${originalError.message} Le nettoyage du dépôt temporaire a aussi échoué : ${cleanupMessage}`;
            error = originalError;
          }
          if (index > 0) {
            throw new Error(
              `Import interrompu après ${index} vidéo${index === 1 ? '' : 's'} : ${error.message}`
            );
          }
          throw error;
        }
      }

      uploadProgress.value = 100;
      uploadProgressLabel.textContent =
        'Envoi terminé. Actualisation de la bibliothèque partagée…';
      resolve(await loadSharedCollections());
    })().catch(reject);
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
  updateSelectedFiles();
  updateUploadCopy();
  updateUploadDestinationCopy();
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
    const shareWithEveryone = isSuperadmin && uploadDestination.value === 'shared';
    if (shareWithEveryone && entries.length > 1000) {
      throw new Error('Un import serveur ne peut pas contenir plus de 1 000 vidéos.');
    }
    uploadSubmit.disabled = true;
    uploadProgress.hidden = false;
    uploadProgress.removeAttribute('value');
    uploadProgressLabel.hidden = false;
    if (shareWithEveryone) {
      uploadProgressLabel.textContent = 'Préparation de l’envoi des vidéos…';
      const data = await postSharedVideos(entries, uploadType.value, title);
      sharedLibrary.replaceChildren();
      for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
      sharedEmpty.hidden = data.collections.length > 0;
      sharedUsage.textContent =
        `${formatBytes(data.usedBytes)} utilisés sur ${formatBytes(data.quotaBytes)}`;
      updateSharedStorage(data);
      setMessage(uploadMessage, 'Dépôt terminé. Les vidéos sont maintenant visibles par tous.');
    } else {
      uploadProgressLabel.textContent = 'Enregistrement des vidéos dans la bibliothèque de ce navigateur…';
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
    uploadProgress.value = 0;
    uploadProgress.hidden = true;
    uploadProgressLabel.hidden = true;
    uploadProgressLabel.textContent = '';
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
  autoplayNextOption.hidden = !isSeries;
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
  currentVideoUrl = '';
  seekInput.value = '0';
  currentTimeLabel.textContent = '0:00';
  durationLabel.textContent = '0:00';
}

function formatPlaybackTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0');
  if (minutes < 60) return `${minutes}:${remainingSeconds}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, '0')}:${remainingSeconds}`;
}

function updatePlayPauseButton() {
  const isPlaying = !videoPlayer.paused && !videoPlayer.ended;
  playPauseButton.setAttribute('aria-label', isPlaying ? 'Mettre en pause' : 'Lire');
  playPauseButton.title = isPlaying ? 'Mettre en pause' : 'Lire';
  playPauseButton.firstElementChild.textContent = isPlaying ? 'Ⅱ' : '▶';
}

function updatePlayerProgress() {
  currentTimeLabel.textContent = formatPlaybackTime(videoPlayer.currentTime);
  durationLabel.textContent = formatPlaybackTime(videoPlayer.duration);
  if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
    seekInput.value = String(Math.round(videoPlayer.currentTime / videoPlayer.duration * 1000));
  } else {
    seekInput.value = '0';
  }
}

function updateMuteButton() {
  const isMuted = videoPlayer.muted || videoPlayer.volume === 0;
  muteButton.setAttribute('aria-label', isMuted ? 'Activer le son' : 'Couper le son');
  muteButton.title = isMuted ? 'Activer le son' : 'Couper le son';
  muteButton.firstElementChild.textContent = isMuted ? '◖×' : '◖))';
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
  updatePlayerProgress();
  updatePlayPauseButton();
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
  document.body.classList.add('player-open');
  try {
    playerDialog.showModal();
  } catch (error) {
    document.body.classList.remove('player-open');
    throw error;
  }
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
        : (await loadSharedCollections()).collections;
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
    const data = await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collectionId)}`, {
      method: 'DELETE'
    });
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

chooseFilesButton.addEventListener('click', () => videoFilesInput.click());
videoFilesInput.addEventListener('change', () => {
  const files = Array.from(videoFilesInput.files || []);
  videoFilesInput.value = '';
  useFiles(files);
});
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('is-dragging');
});
dropZone.addEventListener('dragleave', (event) => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('is-dragging');
});
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dragging');
  useFiles(event.dataTransfer?.files || []);
});
uploadType.addEventListener('change', updateUploadCopy);
uploadDestination.addEventListener('change', updateUploadDestinationCopy);
uploadForm.addEventListener('submit', handleUpload);
sharedLibrary.addEventListener('click', handleCollectionAction);
localLibrary.addEventListener('click', handleCollectionAction);
updateUploadCopy();

document.getElementById('close-player').addEventListener('click', () => playerDialog.close());
playerDialog.addEventListener('close', () => {
  clearPlayerUrls();
  document.body.classList.remove('player-open');
});
playerDialog.addEventListener('click', (event) => {
  if (event.target === playerDialog) playerDialog.close();
});
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
playPauseButton.addEventListener('click', async () => {
  if (videoPlayer.paused) {
    try {
      await videoPlayer.play();
    } catch (error) {
      setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
    }
  } else {
    videoPlayer.pause();
  }
});
seekInput.addEventListener('input', () => {
  if (!Number.isFinite(videoPlayer.duration) || videoPlayer.duration <= 0) return;
  videoPlayer.currentTime = Number(seekInput.value) / 1000 * videoPlayer.duration;
});
muteButton.addEventListener('click', () => {
  videoPlayer.muted = !videoPlayer.muted;
  if (!videoPlayer.muted && videoPlayer.volume === 0) videoPlayer.volume = 0.5;
  volumeInput.value = String(videoPlayer.muted ? 0 : videoPlayer.volume);
  updateMuteButton();
});
volumeInput.addEventListener('input', () => {
  videoPlayer.volume = Number(volumeInput.value);
  videoPlayer.muted = videoPlayer.volume === 0;
  updateMuteButton();
});
document.getElementById('fullscreen-button').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await playerShell.requestFullscreen();
  } catch (error) {
    setMessage(playerMessage, `Plein écran impossible : ${error.message}`, true);
  }
});
playerShell.addEventListener('pointermove', showFullscreenControls);
playerShell.addEventListener('pointerenter', showFullscreenControls);
playerShell.addEventListener('pointerleave', () => {
  clearFullscreenControlsTimer();
  if (document.fullscreenElement === playerShell) {
    playerShell.classList.add('fullscreen-controls-hidden');
  }
});
window.addEventListener('blur', () => {
  clearFullscreenControlsTimer();
  if (document.fullscreenElement === playerShell) {
    playerShell.classList.add('fullscreen-controls-hidden');
  }
});
window.addEventListener('focus', showFullscreenControls);
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === playerShell) {
    showFullscreenControls();
  } else {
    clearFullscreenControlsTimer();
    playerShell.classList.remove('fullscreen-controls-hidden');
  }
});
videoPlayer.addEventListener('play', updatePlayPauseButton);
videoPlayer.addEventListener('pause', updatePlayPauseButton);
videoPlayer.addEventListener('timeupdate', updatePlayerProgress);
videoPlayer.addEventListener('durationchange', updatePlayerProgress);
videoPlayer.addEventListener('volumechange', updateMuteButton);
videoPlayer.addEventListener('ended', async () => {
  if (currentCollection?.type === 'series' && autoplayNext.checked &&
      currentEpisodeIndex + 1 < sortedEpisodes(currentCollection).length) {
    await showEpisode(currentEpisodeIndex + 1, true);
  }
});
videoPlayer.addEventListener('click', async () => {
  if (videoPlayer.paused) {
    try {
      await videoPlayer.play();
    } catch (error) {
      setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
    }
  } else {
    videoPlayer.pause();
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
