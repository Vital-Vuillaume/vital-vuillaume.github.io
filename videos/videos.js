const databaseName = 'vitaload-video-library';
const databaseVersion = 3;
const allowedExtensions = new Set([
  '3gp', 'avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'ts', 'webm'
]);
const sessionKey = 'panel_session_id';
const sharedLibrary = document.getElementById('shared-library');
const sharedLibraryCounts = document.getElementById('shared-library-counts');
const sharedStorageCard = document.getElementById('shared-storage-card');
const sharedLibraryPanel = document.getElementById('shared-library-panel');
const sharedLibraryMessage = document.getElementById('shared-library-message');
const sharedLibrarySearch = document.getElementById('shared-library-search');
const sharedLibraryNoResults = document.getElementById('shared-library-no-results');
const sharedLibraryFilters = document.querySelector('#shared-library-panel .library-filters');
const localLibrary = document.getElementById('local-library');
const localLibrarySearch = document.getElementById('local-library-search');
const localLibraryNoResults = document.getElementById('local-library-no-results');
const localLibraryFilters = document.querySelector('#local-library-panel .library-filters');
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
const storageOverviewGrid = document.querySelector('.storage-overview-grid');
const uploadForm = document.getElementById('upload-form');
const uploadDestinationField = document.getElementById('upload-destination-field');
const uploadDestination = document.getElementById('upload-destination');
const uploadType = document.getElementById('upload-type');
const uploadTitle = document.getElementById('upload-title');
const seriesTitleField = document.getElementById('series-title-field');
const coverFileInput = document.getElementById('cover-file');
const chooseCoverButton = document.getElementById('choose-cover');
const removeCoverButton = document.getElementById('remove-cover');
const coverPreview = document.getElementById('cover-preview');
const coverHelp = document.getElementById('cover-help');
const movieCoversList = document.getElementById('movie-covers-list');
const dropHelp = document.getElementById('drop-help');
const dropInstruction = document.getElementById('drop-instruction');
const uploadEyebrow = document.getElementById('upload-eyebrow');
const uploadStorageLabel = document.getElementById('upload-storage-label');
const dropZone = document.getElementById('drop-zone');
const videoFilesInput = document.getElementById('video-files');
const videoFolderInput = document.getElementById('video-folder');
const chooseFilesButton = document.getElementById('choose-files');
const chooseFolderButton = document.getElementById('choose-folder');
const folderFilePicker = document.getElementById('folder-file-picker');
const folderName = document.getElementById('folder-name');
const folderFileList = document.getElementById('folder-file-list');
const addFolderFilesButton = document.getElementById('add-folder-files');
const seriesSeasons = document.getElementById('series-seasons');
const seriesSeasonRows = document.getElementById('series-season-rows');
const addSeasonButton = document.getElementById('add-season');
const selectedFilesLabel = document.getElementById('selected-files');
const uploadSubmit = document.getElementById('upload-submit');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressLabel = document.getElementById('upload-progress-label');
const uploadMessage = document.getElementById('upload-message');
const appDialog = document.getElementById('app-dialog');
const appDialogForm = document.getElementById('app-dialog-form');
const appDialogTitle = document.getElementById('app-dialog-title');
const appDialogMessage = document.getElementById('app-dialog-message');
const appDialogInputWrap = document.getElementById('app-dialog-input-wrap');
const appDialogInputLabel = document.getElementById('app-dialog-input-label');
const appDialogInput = document.getElementById('app-dialog-input');
const appDialogConfirm = document.getElementById('app-dialog-confirm');
const appDialogCancel = document.getElementById('app-dialog-cancel');
const seriesEditorDialog = document.getElementById('series-editor-dialog');
const seriesEditorTitle = document.getElementById('series-editor-title');
const seriesEditorSubtitle = document.getElementById('series-editor-subtitle');
const seriesEditorEyebrow = document.getElementById('series-editor-eyebrow');
const seriesEditorHost = document.getElementById('series-editor-host');
const videoToast = document.getElementById('video-toast');
const playerDialog = document.getElementById('video-player-dialog');
const videoPlayer = document.getElementById('video-player');
const playerTitle = document.getElementById('player-title');
const playerSubtitle = document.getElementById('player-subtitle');
const playerKind = document.getElementById('player-kind');
const playerShareNote = document.getElementById('player-share-note');
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
const collectionSelect = document.getElementById('collection-select');
const playbackSpeed = document.getElementById('playback-speed');
const autoplayNext = document.getElementById('autoplay-next');
const playerRecommendations = document.getElementById('player-recommendations');
const playerRecommendationsList = document.getElementById('player-recommendations-list');
const playerEpisodeNavigation = document.getElementById('player-episode-navigation');
let selectedVideos = [];
let folderVideoFiles = [];
let isSuperadmin = false;
let canManageSharedVideos = false;
let canViewSharedVideos = false;
let currentCollection = null;
let currentCatalog = [];
let currentSource = 'local';
let currentEpisodeIndex = 0;
let currentVideoUrl = '';
let databasePromise;
let fullscreenControlsTimer;
let playbackGeneration = 0;
let playbackResumeReady = false;
let pendingPlaybackResume = null;
let lastPlaybackProgressWrite = 0;
let playbackProgressStorageErrorReported = false;
let playbackProgressSyncErrorReported = false;
let playbackProgressSaveQueue = Promise.resolve();
const accountPlaybackProgress = new Map();
let playbackProgressReady = Promise.resolve();
let appDialogResolver;
let toastTimer;
const libraryTypeFilters = new WeakMap();
let coverPreviewUrl = '';
let editorCoverUrl = '';
const movieCovers = new Map();
const movieCoverPreviewUrls = new Map();
const coverObjectUrls = new Map();
const panelAuth = window.VitaLoadPanelAuth;

function isPlaybackInterrupted(error) {
  return error?.name === 'AbortError';
}

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
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (!database.objectStoreNames.contains('collections')) {
        database.createObjectStore('collections', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('videos')) {
        const store = database.createObjectStore('videos', { keyPath: 'id' });
        store.createIndex('collectionId', 'collectionId', { unique: false });
      }
      if (!database.objectStoreNames.contains('sharedVideos')) {
        database.createObjectStore('sharedVideos', { keyPath: 'id' });
      } else if (event.oldVersion < 3) {
        request.transaction.objectStore('sharedVideos').clear();
      }
    };
    let blocked = false;
    request.onblocked = () => {
      blocked = true;
      databasePromise = null;
      reject(new Error(
        'La base vidéo est bloquée par un autre onglet. Ferme les autres onglets VitaLoad puis actualise cette page.'
      ));
    };
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        return;
      }
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
      const transaction = database.transaction('sharedVideos', 'readwrite');
      transaction.objectStore('sharedVideos').clear();
      transaction.onerror = () => {
        console.error('Impossible de vider les anciennes vidéos mises en cache localement.', transaction.error);
      };
    };
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

async function addLocalEpisodes(collection, entries, seasonOrder) {
  const updatedCollection = {
    ...collection,
    videos: [...collection.videos]
  };
  const currentSeasonEpisodes = updatedCollection.videos
    .filter((video) => Number(video.seasonOrder) === seasonOrder);
  let episodeOrder = Math.max(0, ...currentSeasonEpisodes.map((video) => Number(video.episodeOrder) || 0));
  const newVideos = entries.map((entry) => {
    episodeOrder += 1;
    const id = localVideoId();
    const video = {
      id,
      fileName: entry.file.name,
      title: entry.details.title,
      seasonName: `Saison ${seasonOrder}`,
      seasonOrder,
      episodeOrder
    };
    updatedCollection.videos.push(video);
    return {
      ...video,
      collectionId: collection.id,
      mimeType: entry.file.type || 'application/octet-stream',
      sizeBytes: entry.file.size,
      blob: entry.file
    };
  });
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  transaction.objectStore('collections').put(updatedCollection);
  for (const video of newVideos) transaction.objectStore('videos').put(video);
  await completed;
}

async function removeLocalEpisode(collection, episodeId) {
  const updatedCollection = {
    ...collection,
    videos: collection.videos.filter((video) => video.id !== episodeId)
  };
  if (updatedCollection.videos.length === collection.videos.length) {
    throw new Error('Épisode introuvable dans cette série.');
  }
  const removedVideo = collection.videos.find((video) => video.id === episodeId);
  const seasonVideos = updatedCollection.videos
    .filter((video) => Number(video.seasonOrder) === Number(removedVideo.seasonOrder))
    .sort((left, right) => left.episodeOrder - right.episodeOrder);
  seasonVideos.forEach((video, index) => {
    video.episodeOrder = index + 1;
  });
  const storedSeasonVideos = await Promise.all(seasonVideos.map((video) => getLocalVideo(video.id)));
  if (storedSeasonVideos.some((video) => !video)) {
    throw new Error('Un épisode de la saison est introuvable dans IndexedDB.');
  }
  const updatedStoredVideos = storedSeasonVideos.map((video) => ({
    ...video,
    episodeOrder: seasonVideos.find((episode) => episode.id === video.id).episodeOrder
  }));
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  if (updatedCollection.videos.length) {
    transaction.objectStore('collections').put(updatedCollection);
  } else {
    transaction.objectStore('collections').delete(collection.id);
  }
  const videoStore = transaction.objectStore('videos');
  videoStore.delete(episodeId);
  for (const video of updatedStoredVideos) {
    videoStore.put(video);
  }
  await completed;
}

async function removeLocalSeason(collection, seasonOrder) {
  const removedVideos = collection.videos.filter((video) => Number(video.seasonOrder) === seasonOrder);
  if (!removedVideos.length) throw new Error('Saison introuvable.');
  const updatedCollection = {
    ...collection,
    videos: collection.videos.filter((video) => Number(video.seasonOrder) !== seasonOrder)
  };
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  if (updatedCollection.videos.length) {
    transaction.objectStore('collections').put(updatedCollection);
  } else {
    transaction.objectStore('collections').delete(collection.id);
  }
  const videoStore = transaction.objectStore('videos');
  for (const video of removedVideos) videoStore.delete(video.id);
  await completed;
}

async function reorderLocalSeason(collection, seasonOrder, episodeIds) {
  const updatedCollection = {
    ...collection,
    videos: collection.videos.map((video) => ({ ...video }))
  };
  const seasonVideos = updatedCollection.videos
    .filter((video) => Number(video.seasonOrder) === seasonOrder);
  if (seasonVideos.length !== episodeIds.length ||
      new Set(episodeIds).size !== episodeIds.length ||
      seasonVideos.some((video) => !episodeIds.includes(video.id))) {
    throw new Error('La liste ne correspond pas aux épisodes de cette saison.');
  }
  const orderedEpisodes = episodeIds.map((id) => seasonVideos.find((video) => video.id === id));
  orderedEpisodes.forEach((video, index) => {
    video.episodeOrder = index + 1;
  });
  const storedVideos = await Promise.all(orderedEpisodes.map((video) => getLocalVideo(video.id)));
  if (storedVideos.some((video) => !video)) {
    throw new Error('Un épisode est introuvable dans IndexedDB.');
  }
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  transaction.objectStore('collections').put(updatedCollection);
  const videoStore = transaction.objectStore('videos');
  for (const storedVideo of storedVideos) {
    storedVideo.episodeOrder =
      orderedEpisodes.find((video) => video.id === storedVideo.id).episodeOrder;
    videoStore.put(storedVideo);
  }
  await completed;
}

async function renameLocalCollection(collection, title) {
  const database = await openDatabase();
  const transaction = database.transaction(['collections', 'videos'], 'readwrite');
  const completed = transactionPromise(transaction);
  const collectionStore = transaction.objectStore('collections');
  const storedCollection = await requestPromise(collectionStore.get(collection.id));
  if (!storedCollection) throw new Error('Film ou série introuvable.');
  storedCollection.title = title;
  for (const video of storedCollection.videos) {
    if (storedCollection.type === 'movie') video.title = title;
  }
  collectionStore.put(storedCollection);
  const videoStore = transaction.objectStore('videos');
  const videos = await requestPromise(videoStore.index('collectionId').getAll(IDBKeyRange.only(collection.id)));
  if (storedCollection.type === 'movie') {
    for (const video of videos) {
      video.title = title;
      videoStore.put(video);
    }
  }
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
  const videoBytes = collection.videos.reduce((sum, video) => {
    const size = Number(video.sizeBytes);
    return sum + (Number.isFinite(size) && size >= 0 ? size : 0);
  }, 0);
  return videoBytes + (Number(collection.cover?.size) || 0);
}

function createCollectionDetailsContent(collection, source, collections) {
  const content = makeElement('div', 'collection-details-content');
  const groups = new Map();
  const episodes = sortedEpisodes(collection);
  for (const video of episodes) {
    const seasonOrder = Number(video.seasonOrder) || 1;
    const season = groups.get(seasonOrder) || {
      name: video.seasonName || `Saison ${seasonOrder}`,
      videos: []
    };
    season.videos.push(video);
    groups.set(seasonOrder, season);
  }
  const summary = collection.type === 'series'
    ? `${groups.size} saison(s) · ${collection.videos.length} épisode(s) · ${formatBytes(collectionByteSize(collection))}`
    : `${formatMediaFormats(collection.videos)} · ${collection.videos.length} fichier(s) · ${formatBytes(collectionByteSize(collection))}`;
  content.append(makeElement('p', 'collection-info-summary', summary));

  if (collection.type === 'series') {
    const controls = makeElement('div', 'collection-playback-picker');
    const seasonField = makeElement('label', 'player-option');
    seasonField.append(makeElement('span', '', 'Saison'));
    const seasonSelect = makeElement('select', 'vl-input');
    const seasons = [...groups.entries()].sort(([left], [right]) => left - right);
    for (const [seasonOrder, season] of seasons) {
      const option = document.createElement('option');
      option.value = String(seasonOrder);
      option.textContent = season.name;
      seasonSelect.append(option);
    }

    const episodeField = makeElement('label', 'player-option');
    episodeField.append(makeElement('span', '', 'Épisode'));
    const episodeSelect = makeElement('select', 'vl-input');
    const updateEpisodes = () => {
      const seasonEpisodes = episodes.filter(
        (video) => Number(video.seasonOrder) === Number(seasonSelect.value)
      );
      episodeSelect.replaceChildren();
      for (const video of seasonEpisodes) {
        const option = document.createElement('option');
        option.value = video.id;
        option.textContent =
          `${video.episodeOrder || '?'} · ${video.title || video.fileName || 'Épisode sans titre'}`;
        episodeSelect.append(option);
      }
    };
    seasonSelect.addEventListener('change', updateEpisodes);
    updateEpisodes();

    const playSelectedButton = makeElement('button', 'vl-button', 'Regarder cet épisode');
    playSelectedButton.type = 'button';
    setIcon(playSelectedButton, 'play');
    playSelectedButton.addEventListener('click', () => {
      const episodeId = episodeSelect.value;
      seriesEditorDialog.addEventListener('close', () => {
        void openPlayer(collection, source, collections, episodeId);
      }, { once: true });
      seriesEditorDialog.close();
    });
    seasonField.append(seasonSelect);
    episodeField.append(episodeSelect);
    controls.append(seasonField, episodeField, playSelectedButton);
    content.append(controls);
  }

  const sections = collection.type === 'series'
    ? [...groups.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, season]) => ({ title: `${season.name} · ${season.videos.length} épisode(s)`, videos: season.videos }))
    : [{ title: 'Fichier vidéo', videos: sortedEpisodes(collection) }];
  for (const sectionData of sections) {
    const section = makeElement('section', 'collection-info-section');
    section.append(makeElement('h3', '', sectionData.title));
    const list = document.createElement('ul');
    list.className = 'storage-episode-list';
    for (const video of sectionData.videos) {
      const item = document.createElement('li');
      const label = collection.type === 'series'
        ? `Épisode ${video.episodeOrder || '?'} · ${video.title || video.fileName || 'Vidéo sans titre'}`
        : video.title || video.fileName || 'Vidéo sans titre';
      item.append(
        makeElement('span', '', label),
        makeElement('strong', '', formatBytes(Number(video.sizeBytes)))
      );
      list.append(item);
    }
    section.append(list);
    content.append(section);
  }
  return content;
}

function openCollectionDetails(
  collection,
  eyebrow = 'DÉTAILS DE LA BIBLIOTHÈQUE',
  source = 'local',
  collections = [collection]
) {
  seriesEditorEyebrow.textContent = eyebrow;
  seriesEditorTitle.textContent = collection.title;
  seriesEditorSubtitle.textContent = collection.type === 'series'
    ? 'Informations des saisons et des épisodes.'
    : 'Informations du film.';
  seriesEditorHost.replaceChildren(createCollectionDetailsContent(collection, source, collections));
  seriesEditorDialog.showModal();
}

function formatMediaFormats(videos) {
  const formats = [...new Set(videos.map((video) => {
    const mimeSubtype = String(video.mimeType || '').split('/')[1];
    if (mimeSubtype && mimeSubtype !== 'octet-stream') return mimeSubtype.toUpperCase();
    const extension = String(video.fileName || '').match(/\.([a-z0-9]{2,5})$/i)?.[1];
    return extension ? extension.toUpperCase() : '';
  }).filter(Boolean))];
  return formats.length ? formats.join(' · ') : 'Vidéo';
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
    const details = document.createElement('button');
    details.type = 'button';
    details.className = 'storage-collection storage-collection-open';
    const name = makeElement('span', 'storage-collection-title', collection.title);
    const size = makeElement('strong', 'storage-collection-size', formatBytes(collectionByteSize(collection)));
    details.append(name, size);
    details.addEventListener('click', () => openCollectionDetails(collection));
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

async function updateLocalStorageQuota() {
  if (!navigator.storage?.estimate) {
    localStorageUsed.textContent = 'Indisponible';
    localStorageAvailable.textContent = 'Indisponible';
    localStorageQuota.textContent = 'Indisponible';
    localStorageProgress.value = 0;
    localStorageNote.textContent =
      'Estimation du quota non prise en charge par ce navigateur. Calcul de la bibliothèque locale en cours.';
    return 'Estimation du quota non prise en charge par ce navigateur.';
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quotaBytes = Number(estimate.quota);
    const originUsageBytes = Number(estimate.usage);
    if (!Number.isFinite(quotaBytes) || quotaBytes <= 0 || !Number.isFinite(originUsageBytes)) {
      throw new Error('Le navigateur n’a pas fourni d’estimation valide.');
    }
    localStorageUsed.textContent = formatBytes(originUsageBytes);
    localStorageAvailable.textContent = formatBytes(Math.max(0, quotaBytes - originUsageBytes));
    localStorageQuota.textContent = formatBytes(quotaBytes);
    localStorageProgress.value = Math.min(100, (originUsageBytes / quotaBytes) * 100);
    localStorageNote.textContent =
      'Utilisation totale estimée pour ce site ; calcul précis des vidéos en cours de chargement.';
    const persisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : null;
    return persisted === true
      ? 'Stockage persistant accordé.'
      : persisted === false
        ? 'Stockage persistant non accordé par le navigateur.'
        : 'État du stockage persistant indisponible.';
  } catch (error) {
    localStorageUsed.textContent = 'Indisponible';
    localStorageAvailable.textContent = 'Indisponible';
    localStorageQuota.textContent = 'Indisponible';
    localStorageProgress.value = 0;
    localStorageNote.textContent = `Calcul de l’espace utilisé impossible : ${error.message}`;
    return `Estimation du quota impossible : ${error.message}`;
  }
}

async function updateLocalStorage(collections, quotaPromise = updateLocalStorageQuota()) {
  const usedBytes = collections.reduce((sum, collection) => sum + collectionByteSize(collection), 0);
  localStorageUsed.textContent = formatBytes(usedBytes);
  renderStorageDetails(localStorageDetails, collections);
  localStorageEmpty.hidden = collections.length > 0;
  const quotaNote = await quotaPromise;
  localStorageNote.textContent =
    `${collectionCounts(collections)} · Taille exacte des vidéos de la bibliothèque. ${quotaNote} Le quota estimé concerne l’ensemble des données de ce site.`;
}

function renderPlayerRecommendations() {
  clearCoverObjectUrls(playerRecommendationsList);
  playerRecommendationsList.replaceChildren();
  const recommendations = currentCatalog
    .filter((collection) => collection.id !== currentCollection?.id)
    .slice(0, 8);
  playerRecommendations.hidden = recommendations.length === 0;
  for (const collection of recommendations) {
    const card = makeElement('button', 'player-recommendation');
    card.type = 'button';
    card.setAttribute('aria-label', `Regarder ${collection.title}`);
    const poster = makeElement('span', 'video-card-poster is-empty');
    poster.setAttribute('aria-hidden', 'true');
    const placeholder = createIcon('play');
    placeholder.classList.add('poster-placeholder');
    poster.append(placeholder);
    const title = makeElement('strong', 'player-recommendation-title', collection.title);
    const type = collection.type === 'series' ? 'Série' : 'Film';
    const itemCount = collection.type === 'series'
      ? `${new Set(collection.videos.map((video) => Number(video.seasonOrder) || 1)).size} saison(s) · ${collection.videos.length} épisode(s)`
      : `${collection.videos.length} film${collection.videos.length === 1 ? '' : 's'}`;
    card.append(poster, title, makeElement('span', 'player-recommendation-meta', `${type} · ${itemCount}`));
    card.addEventListener('click', () => {
      void openPlayer(collection, currentSource, currentCatalog);
    });
    playerRecommendationsList.append(card);
    void attachCollectionCover(poster, collection, currentSource);
  }
}

async function requestPersistentLocalStorage() {
  if (!navigator.storage?.persist) {
    return 'Ce navigateur ne permet pas de demander le stockage persistant.';
  }
  try {
    const persisted = await navigator.storage.persist();
    return persisted
      ? 'Stockage persistant accordé par le navigateur.'
      : 'Le navigateur n’a pas accordé le stockage persistant ; le quota reste géré par lui.';
  } catch (error) {
    return `Demande de stockage persistant impossible : ${error.message}`;
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

function createSeasonEntries(files) {
  const groups = new Map();
  for (const entry of files) {
    const seasonOrder = entry.seasonOrder;
    const group = groups.get(seasonOrder) || [];
    group.push(entry);
    groups.set(seasonOrder, group);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([seasonOrder, seasonFiles]) => {
      seasonFiles.sort((left, right) => naturalCompare(left.file.name, right.file.name));
      return seasonFiles.map((entry, index) => ({
        ...entry,
        details: {
          title: displayName(entry.file.name),
          seasonName: `Saison ${seasonOrder}`,
          seasonOrder,
          episodeOrder: index + 1
        }
      }));
    });
}

function getSelectedEntries() {
  const files = selectedVideos.filter(({ file }) => isVideoFile(file));
  if (files.length === 0) {
    throw new Error(uploadType.value === 'series'
      ? 'Sélectionne des épisodes dans au moins une saison.'
      : 'Sélectionne au moins une vidéo compatible.');
  }
  if (uploadType.value === 'series') {
    if (files.some((entry) => !Number.isSafeInteger(entry.seasonOrder) || entry.seasonOrder < 1)) {
      throw new Error('Choisis les épisodes dans leur saison correspondante.');
    }
    return createSeasonEntries(files);
  }
  return files.sort((left, right) => naturalCompare(left.path, right.path)).map((entry) => ({
    ...entry,
    details: { title: displayName(entry.file.name), seasonName: null, seasonOrder: null, episodeOrder: 1 }
  }));
}

function renderMovieCoverSelectors(entries) {
  const movieEntries = uploadType.value === 'movie' ? entries : [];
  const selectedPaths = new Set(movieEntries.map((entry) => entry.path));
  for (const [path, url] of movieCoverPreviewUrls) {
    URL.revokeObjectURL(url);
    movieCoverPreviewUrls.delete(path);
  }
  for (const path of movieCovers.keys()) {
    if (!selectedPaths.has(path)) movieCovers.delete(path);
  }

  const showPerMovieCovers = movieEntries.length > 1;
  movieCoversList.hidden = !showPerMovieCovers;
  coverHelp.textContent = showPerMovieCovers
    ? 'JPG, PNG ou WebP · jusqu’à 8 Mio. Choisis une affiche propre à chaque film ci-dessous ; cette image sert de défaut.'
    : 'JPG, PNG ou WebP · jusqu’à 8 Mio.';
  movieCoversList.replaceChildren();
  if (!showPerMovieCovers) return;

  movieCoversList.append(
    makeElement('h3', '', 'Affiche de chaque film'),
    makeElement('p', 'movie-covers-help', 'Une image individuelle remplace l’image par défaut choisie au-dessus.')
  );
  for (const entry of movieEntries) {
    const row = makeElement('div', 'movie-cover-row');
    const preview = makeElement('div', 'movie-cover-thumbnail');
    const selectedCover = movieCovers.get(entry.path);
    if (selectedCover) {
      const url = URL.createObjectURL(selectedCover);
      movieCoverPreviewUrls.set(entry.path, url);
      const image = document.createElement('img');
      image.src = url;
      image.alt = `Affiche de ${displayName(entry.file.name)}`;
      preview.append(image);
    } else {
      preview.append(makeElement('span', '', coverFileInput.files?.length ? 'Défaut' : 'Sans affiche'));
    }

    const name = makeElement('span', 'movie-cover-name', displayName(entry.file.name));
    name.title = entry.file.name;
    const actions = makeElement('div', 'movie-cover-actions');
    const choose = makeElement(
      'button',
      'vl-button vl-button-secondary movie-cover-choose',
      movieCovers.has(entry.path) ? 'Changer l’affiche' : 'Choisir une affiche'
    );
    choose.type = 'button';
    prependIcon(choose, 'image');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.hidden = true;
    choose.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0] || null;
      try {
        validateCoverFile(file);
        if (file) movieCovers.set(entry.path, file);
        setMessage(uploadMessage, '');
        updateSelectedFiles();
      } catch (error) {
        fileInput.value = '';
        setMessage(uploadMessage, error.message, true);
      }
    });
    actions.append(choose);
    if (movieCovers.has(entry.path)) {
      const remove = makeElement('button', 'vl-button vl-button-secondary movie-cover-remove', 'Retirer');
      remove.type = 'button';
      remove.addEventListener('click', () => {
        movieCovers.delete(entry.path);
        updateSelectedFiles();
      });
      actions.append(remove);
    }
    actions.append(fileInput);
    row.append(preview, name, actions);
    movieCoversList.append(row);
  }
}

function updateSelectedFiles() {
  const valid = selectedVideos.filter(({ file }) => isVideoFile(file));
  renderMovieCoverSelectors(valid);
  if (valid.length === 0) {
    selectedFilesLabel.textContent = 'Aucune vidéo sélectionnée.';
    return;
  }
  const total = valid.reduce((sum, entry) => sum + entry.file.size, 0);
  const seasonOrders = [...new Set(valid.map((entry) => entry.seasonOrder).filter(Boolean))]
    .sort((left, right) => left - right);
  selectedFilesLabel.textContent =
    `${valid.length} vidéo${valid.length === 1 ? '' : 's'} · ${formatBytes(total)} · ` +
    (uploadType.value === 'series' ? `${seasonOrders.length} saison(s) · ` : '') +
    valid.slice(0, 3).map((entry) => entry.file.name).join(', ') +
    (valid.length > 3 ? ` et ${valid.length - 3} autre(s)` : '');
}

function updateUploadCopy() {
  const isSeries = uploadType.value === 'series';
  seriesTitleField.hidden = !isSeries;
  seriesSeasons.hidden = !isSeries;
  dropZone.hidden = isSeries;
  folderFilePicker.hidden = true;
  uploadTitle.required = isSeries;
  dropInstruction.textContent = 'Choisis un ou plusieurs fichiers vidéo';
  dropHelp.textContent = isSeries
    ? 'Ajoute les fichiers séparément pour chaque saison.'
    : 'Dépose ici un ou plusieurs fichiers, ou choisis des fichiers ou un dossier.';
}

function updateSeasonRow(row, files) {
  const status = row.querySelector('.season-file-status');
  const validFiles = Array.from(files).filter(isVideoFile);
  status.textContent = validFiles.length
    ? `${validFiles.length} épisode(s) sélectionné(s) · ${formatBytes(validFiles.reduce((sum, file) => sum + file.size, 0))}`
    : 'Aucun épisode sélectionné.';
}

function renderSeasonFolderFiles(row, files) {
  const seasonOrder = Number(row.dataset.seasonOrder);
  const folderFiles = Array.from(files).filter(isVideoFile);
  const picker = row.querySelector('.season-folder-picker');
  const name = row.querySelector('.season-folder-name');
  const list = row.querySelector('.season-folder-list');
  const addButton = row.querySelector('.season-folder-add');
  name.textContent = folderFiles[0]?.webkitRelativePath?.split('/')[0] || 'Vidéos du dossier';
  list.replaceChildren();
  picker.hidden = false;
  if (folderFiles.length === 0) {
    list.append(makeElement('p', 'folder-file-empty', 'Aucun fichier vidéo compatible dans ce dossier.'));
    updateSeasonRow(row, []);
    addButton.disabled = true;
    return;
  }
  addButton.disabled = false;
  const syncFolderSelection = () => {
    const folderPaths = new Set(folderFiles.map((file) => file.webkitRelativePath || file.name));
    selectedVideos = selectedVideos.filter((entry) =>
      entry.seasonOrder !== seasonOrder || !folderPaths.has(entry.path)
    );
    const selectedFiles = [...list.querySelectorAll('input[type="checkbox"]:checked')]
      .map((checkbox) => folderFiles[Number(checkbox.dataset.fileIndex)])
      .filter(Boolean);
    useFiles(selectedFiles, seasonOrder);
    updateSelectedFiles();
    updateSeasonRow(row, selectedVideos
      .filter((entry) => entry.seasonOrder === seasonOrder)
      .map((entry) => entry.file));
  };
  folderFiles.forEach((file, index) => {
    const label = makeElement('label', 'folder-file-option');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.fileIndex = String(index);
    checkbox.addEventListener('change', syncFolderSelection);
    label.append(
      checkbox,
      makeElement('span', 'folder-file-name', file.webkitRelativePath || file.name),
      makeElement('small', 'folder-file-size', formatBytes(file.size))
    );
    list.append(label);
  });
  syncFolderSelection();
  addButton.onclick = () => {
    picker.hidden = true;
  };
}

function createSeasonRow(seasonOrder) {
  const row = makeElement('div', 'season-upload-row');
  row.dataset.seasonOrder = String(seasonOrder);
  const heading = makeElement('div', 'season-upload-heading');
  heading.append(makeElement('strong', '', `Saison ${seasonOrder}`));
  if (seasonOrder > 1) {
    const removeButton = makeElement('button', 'vl-button vl-button-secondary', 'Retirer');
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => {
      selectedVideos = selectedVideos.filter((entry) => entry.seasonOrder !== seasonOrder);
      row.remove();
      updateSelectedFiles();
    });
    heading.append(removeButton);
  }
  const inputLabel = makeElement('label', 'season-file-field');
  inputLabel.append(makeElement('span', '', `Fichiers vidéo de la saison ${seasonOrder}`));
  const input = document.createElement('input');
  input.className = 'vl-input';
  input.type = 'file';
  input.accept = 'video/*,.3gp,.m4v,.mkv,.mpg,.ts';
  input.multiple = true;
  input.addEventListener('change', () => {
    useFiles(input.files || [], seasonOrder, true);
    updateSeasonRow(row, selectedVideos
      .filter((entry) => entry.seasonOrder === seasonOrder)
      .map((entry) => entry.file));
    input.value = '';
  });
  inputLabel.append(input);
  const actions = makeElement('div', 'season-upload-actions');
  const chooseFolderButton = makeElement('button', 'vl-button vl-button-secondary', 'Choisir un dossier');
  chooseFolderButton.type = 'button';
  prependIcon(chooseFolderButton, 'folder');
  const folderInput = document.createElement('input');
  folderInput.type = 'file';
  folderInput.accept = 'video/*,.3gp,.m4v,.mkv,.mpg,.ts';
  folderInput.multiple = true;
  folderInput.webkitdirectory = true;
  folderInput.hidden = true;
  chooseFolderButton.addEventListener('click', () => folderInput.click());
  folderInput.addEventListener('change', () => {
    renderSeasonFolderFiles(row, folderInput.files || []);
    folderInput.value = '';
  });
  actions.append(inputLabel, chooseFolderButton, folderInput);
  const folderPicker = makeElement('div', 'folder-file-picker season-folder-picker');
  folderPicker.hidden = true;
  const folderPickerHeading = makeElement('div', 'folder-file-picker-heading');
  folderPickerHeading.append(makeElement('strong', 'season-folder-name', 'Choisis les épisodes à ajouter'));
  const addFolderButton = makeElement('button', 'vl-button vl-button-secondary season-folder-add', 'Fermer');
  addFolderButton.type = 'button';
  folderPickerHeading.append(addFolderButton);
  folderPicker.append(folderPickerHeading, makeElement('div', 'folder-file-list season-folder-list'));
  row.append(
    heading,
    actions,
    folderPicker,
    makeElement('span', 'season-file-status', 'Aucun épisode sélectionné.')
  );
  return row;
}

function resetSeasonRows() {
  seriesSeasonRows.replaceChildren(createSeasonRow(1));
}

function addSeasonRow() {
  const orders = [...seriesSeasonRows.querySelectorAll('.season-upload-row')]
    .map((row) => Number(row.dataset.seasonOrder));
  const nextOrder = Math.max(0, ...orders) + 1;
  seriesSeasonRows.append(createSeasonRow(nextOrder));
}

function renderFolderFiles(files) {
  folderVideoFiles = Array.from(files).filter(isVideoFile);
  folderFileList.replaceChildren();
  folderFilePicker.hidden = false;
  const firstPath = folderVideoFiles[0]?.webkitRelativePath || '';
  folderName.textContent = firstPath.split('/')[0] || 'Vidéos du dossier';
  if (folderVideoFiles.length === 0) {
    folderFileList.append(makeElement('p', 'folder-file-empty', 'Aucun fichier vidéo compatible dans ce dossier.'));
    return;
  }
  folderVideoFiles.forEach((file, index) => {
    const label = makeElement('label', 'folder-file-option');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.fileIndex = String(index);
    const fileName = makeElement('span', 'folder-file-name', file.webkitRelativePath || file.name);
    const fileSize = makeElement('small', 'folder-file-size', formatBytes(file.size));
    label.append(checkbox, fileName, fileSize);
    folderFileList.append(label);
  });
}

function updateUploadDestinationCopy() {
  const isSharedDestination = canManageSharedVideos && uploadDestination.value === 'shared';
  uploadEyebrow.textContent = isSharedDestination ? 'Bibliothèque publique' : 'Bibliothèque personnelle';
  uploadStorageLabel.textContent = isSharedDestination
    ? 'Comptes autorisés · quota serveur 20 Gio'
    : 'Enregistré uniquement dans ce navigateur';
  uploadSubmit.textContent = isSharedDestination
    ? 'Importer et partager'
    : 'Enregistrer dans ma bibliothèque';
}

function useFiles(fileList, seasonOrder = null, replaceSeason = false) {
  const files = Array.from(fileList);
  if (files.length === 0) return;
  const validFiles = files.filter(isVideoFile);
  if (replaceSeason && seasonOrder !== null) {
    selectedVideos = selectedVideos.filter((entry) => entry.seasonOrder !== seasonOrder);
  }
  const selectionKey = (entry) => `${entry.seasonOrder || 0}:${entry.path}`;
  const existingPaths = new Set(selectedVideos.map(selectionKey));
  const additions = validFiles
    .map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
      seasonOrder
    }))
    .filter((entry) => {
      const key = selectionKey(entry);
      if (existingPaths.has(key)) return false;
      existingPaths.add(key);
      return true;
    });
  selectedVideos.push(...additions);
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

const iconPaths = {
  play: 'M8 5v14l11-7z',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z',
  trash: 'M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  plus: 'M12 5v14m-7-7h14',
  close: 'M18 6 6 18M6 6l12 12',
  folder: 'M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01',
  pause: 'M8 5h3v14H8zM15 5h3v14h-3z',
  volume: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13',
  mute: 'M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  upload: 'M12 16V4m0 0L7 9m5-5 5 5M4 16v4h16v-4',
  addFiles: 'M12 5v14m-7-7h14M5 3h8l6 6v12H5z'
};

function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', iconPaths[name]);
  svg.append(path);
  return svg;
}

function setIcon(button, name) {
  const label = button.getAttribute('aria-label') || button.title || button.textContent.trim();
  const svg = createIcon(name);
  button.replaceChildren(svg);
  button.classList.add('icon-button');
  button.setAttribute('aria-label', label);
}

function prependIcon(button, name) {
  button.prepend(createIcon(name));
  button.classList.add('button-with-icon');
}

function clearCoverObjectUrls(container) {
  for (const [url, owner] of coverObjectUrls) {
    if (container && !container.contains(owner)) continue;
    URL.revokeObjectURL(url);
    coverObjectUrls.delete(url);
  }
}

function setCoverPreview(file) {
  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  coverPreviewUrl = '';
  coverPreview.replaceChildren();
  removeCoverButton.hidden = !file;
  if (!file) {
    coverPreview.textContent = 'Aucune image choisie';
    return;
  }
  coverPreviewUrl = URL.createObjectURL(file);
  const image = document.createElement('img');
  image.src = coverPreviewUrl;
  image.alt = 'Aperçu de l’image choisie';
  coverPreview.append(image);
}

function validateCoverFile(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choisis une image JPG, PNG ou WebP.');
  }
  if (file.size > 8 * 1024 ** 2) {
    throw new Error('L’image ne doit pas dépasser 8 Mio.');
  }
}

prependIcon(chooseFilesButton, 'addFiles');
prependIcon(chooseFolderButton, 'folder');
prependIcon(addFolderFilesButton, 'plus');
prependIcon(addSeasonButton, 'plus');
prependIcon(uploadSubmit, 'upload');
prependIcon(chooseCoverButton, 'image');
prependIcon(removeCoverButton, 'close');
setIcon(playPauseButton, 'play');
setIcon(muteButton, 'volume');
setIcon(document.getElementById('fullscreen-button'), 'fullscreen');

function showVideoToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  videoToast.textContent = message;
  videoToast.classList.toggle('is-error', isError);
  videoToast.hidden = false;
  toastTimer = window.setTimeout(() => {
    videoToast.hidden = true;
  }, 5000);
}

function showAppDialog({ title, message = '', inputLabel = '', initialValue = '', confirmLabel = 'Confirmer', destructive = false }) {
  appDialogTitle.textContent = title;
  appDialogMessage.textContent = message;
  appDialogInputWrap.hidden = !inputLabel;
  appDialogInputLabel.textContent = inputLabel;
  appDialogInput.value = initialValue;
  appDialogConfirm.textContent = confirmLabel;
  appDialogConfirm.classList.toggle('is-danger', destructive);
  appDialogCancel.hidden = !confirmLabel;
  appDialog.showModal();
  if (inputLabel) {
    appDialogInput.focus();
    appDialogInput.select();
  } else {
    appDialogConfirm.focus();
  }
  return new Promise((resolve) => {
    appDialogResolver = resolve;
  });
}

function closeAppDialog(result) {
  if (!appDialog.open) return;
  appDialog.close();
  const resolve = appDialogResolver;
  appDialogResolver = undefined;
  resolve?.(result);
}

appDialogForm.addEventListener('submit', (event) => {
  event.preventDefault();
  closeAppDialog({ confirmed: true, value: appDialogInput.value });
});
appDialogCancel.addEventListener('click', () => closeAppDialog({ confirmed: false }));
document.getElementById('app-dialog-close').addEventListener('click', () =>
  closeAppDialog({ confirmed: false })
);
appDialog.addEventListener('click', (event) => {
  if (event.target === appDialog) closeAppDialog({ confirmed: false });
});
appDialog.addEventListener('close', () => {
  const resolve = appDialogResolver;
  appDialogResolver = undefined;
  resolve?.({ confirmed: false });
});

function closeSeriesEditor() {
  if (seriesEditorDialog.open) seriesEditorDialog.close();
}

document.getElementById('close-series-editor').addEventListener('click', closeSeriesEditor);
seriesEditorDialog.addEventListener('click', (event) => {
  if (event.target === seriesEditorDialog) closeSeriesEditor();
});
seriesEditorDialog.addEventListener('close', () => {
  if (editorCoverUrl) URL.revokeObjectURL(editorCoverUrl);
  editorCoverUrl = '';
  seriesEditorHost.replaceChildren();
});

function collectionEpisodeCount(collection) {
  return collection.videos.length;
}

function updateSharedLibraryView(data) {
  clearCoverObjectUrls(sharedLibrary);
  sharedLibrary.replaceChildren();
  for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
  applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults);
  sharedEmpty.hidden = data.collections.length > 0;
  updateSharedLibrarySummary(data);
  updateSharedStorage(data);
}

function updateSharedLibrarySummary(data) {
  const collections = data.collections;
  const movies = collections.filter((collection) => collection.type === 'movie').length;
  const series = collections.filter((collection) => collection.type === 'series').length;
  sharedLibraryCounts.textContent =
    `${movies} film${movies === 1 ? '' : 's'} · ${series} série${series === 1 ? '' : 's'}`;
  sharedUsage.textContent =
    `${formatBytes(data.usedBytes)} utilisés sur ${formatBytes(data.quotaBytes)}`;
}

async function refreshLibrary(source) {
  if (source === 'local') {
    await renderLocalLibrary();
    return;
  }
  updateSharedLibraryView(await loadSharedCollections());
}

async function saveEpisodeOrder(collection, seasonOrder, episodeIds, source) {
  if (source === 'local') {
    await reorderLocalSeason(collection, seasonOrder, episodeIds);
    await renderLocalLibrary();
    return;
  }
  const data = await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collection.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ seasonOrder, episodeIds })
  });
  updateSharedLibraryView(data);
}

async function saveLocalCover(collection, cover) {
  const database = await openDatabase();
  const transaction = database.transaction('collections', 'readwrite');
  const completed = transactionPromise(transaction);
  const store = transaction.objectStore('collections');
  const current = await requestPromise(store.get(collection.id));
  if (!current) throw new Error('Film ou série introuvable.');
  current.cover = cover;
  store.put(current);
  await completed;
}

function createCollectionMetadataEditor(collection, source) {
  const section = makeElement('section', 'collection-metadata-editor');
  const heading = makeElement('h3', '', 'Informations et affiche');
  const titleField = makeElement('label', 'video-field');
  titleField.append(makeElement('span', '', collection.type === 'series' ? 'Titre de la série' : 'Titre du film'));
  const titleInput = document.createElement('input');
  titleInput.className = 'vl-input';
  titleInput.type = 'text';
  titleInput.maxLength = 200;
  titleInput.value = collection.title;
  titleInput.autocomplete = 'off';
  titleField.append(titleInput);

  const coverField = makeElement('div', 'editor-cover-field');
  const preview = makeElement('div', 'cover-preview');
  preview.setAttribute('aria-live', 'polite');
  preview.textContent = 'Aucune affiche';
  const actions = makeElement('div', 'editor-cover-actions');
  const chooseButton = makeElement('button', 'vl-button vl-button-secondary', 'Choisir une affiche');
  chooseButton.type = 'button';
  chooseButton.title = 'Ajouter ou remplacer l’affiche';
  prependIcon(chooseButton, 'image');
  const removeButton = makeElement('button', 'vl-button vl-button-secondary', 'Retirer l’affiche');
  removeButton.type = 'button';
  removeButton.hidden = true;
  removeButton.title = 'Retirer l’affiche de cette collection';
  prependIcon(removeButton, 'close');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp';
  fileInput.hidden = true;
  const status = makeElement('p', 'video-message', 'JPG, PNG ou WebP · jusqu’à 8 Mio.');
  const saveButton = makeElement('button', 'vl-button', 'Enregistrer les modifications');
  saveButton.type = 'button';
  prependIcon(saveButton, 'upload');
  actions.append(chooseButton, removeButton, saveButton);
  coverField.append(preview, actions, fileInput, status);
  section.append(heading, titleField, coverField);

  let removeCover = false;
  let coverChosen = false;
  const setEditorPreview = (blob) => {
    if (editorCoverUrl) URL.revokeObjectURL(editorCoverUrl);
    editorCoverUrl = '';
    preview.replaceChildren();
    if (!blob) {
      preview.textContent = 'Aucune affiche';
      removeButton.hidden = true;
      return;
    }
    editorCoverUrl = URL.createObjectURL(blob);
    const image = document.createElement('img');
    image.src = editorCoverUrl;
    image.alt = `Affiche de ${collection.title}`;
    preview.append(image);
    removeButton.hidden = false;
  };
  const existingCover = source === 'local'
    ? Promise.resolve(collection.cover || null)
    : collection.coverMimeType
      ? loadSharedCover(collection.id)
      : Promise.resolve(null);
  existingCover.then((cover) => {
    if (!coverChosen && seriesEditorDialog.open && preview.isConnected) setEditorPreview(cover);
  }).catch((error) => {
    status.textContent = `Affiche impossible à charger : ${error.message}`;
    status.classList.add('is-error');
  });

  chooseButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] || null;
    try {
      validateCoverFile(file);
      coverChosen = true;
      removeCover = false;
      setEditorPreview(file);
      status.textContent = 'Nouvelle affiche sélectionnée. Enregistre pour appliquer la modification.';
      status.classList.remove('is-error');
    } catch (error) {
      fileInput.value = '';
      status.textContent = error.message;
      status.classList.add('is-error');
    }
  });
  removeButton.addEventListener('click', () => {
    fileInput.value = '';
    coverChosen = true;
    removeCover = true;
    setEditorPreview(null);
    status.textContent = 'L’affiche sera retirée après l’enregistrement.';
  });
  saveButton.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title || title.length > 200 || /[\u0000-\u001f\u007f]/.test(title)) {
      status.textContent = 'Le titre doit contenir entre 1 et 200 caractères.';
      status.classList.add('is-error');
      titleInput.focus();
      return;
    }
    const cover = fileInput.files?.[0] || null;
    try {
      validateCoverFile(cover);
      saveButton.disabled = true;
      status.textContent = 'Enregistrement des modifications…';
      if (source === 'local') {
        let current = collection;
        if (title !== collection.title) {
          await renameLocalCollection(collection, title);
          current = (await getLocalCollections()).find((item) => item.id === collection.id);
        }
        if (cover || removeCover) await saveLocalCover(current, removeCover ? null : cover);
        await renderLocalLibrary();
      } else {
        if (title !== collection.title) {
          await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collection.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ title })
          });
        }
        if (cover) {
          await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collection.id)}/cover`, {
            method: 'POST',
            headers: { 'Content-Type': cover.type },
            body: cover
          });
        } else if (removeCover) {
          await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collection.id)}/cover`, {
            method: 'DELETE'
          });
        }
        await refreshLibrary(source);
      }
      closeSeriesEditor();
      showVideoToast('Les informations de la collection ont été mises à jour.');
    } catch (error) {
      status.textContent = `Enregistrement impossible : ${error.message}`;
      status.classList.add('is-error');
    } finally {
      saveButton.disabled = false;
    }
  });
  return section;
}

function createSeriesEditor(collection, source) {
  const content = makeElement('div', 'series-editor-content');
  content.append(createCollectionMetadataEditor(collection, source));
  const seasonField = makeElement('label', 'video-field');
  seasonField.append(makeElement('span', '', 'Saison'));
  const seasonSelect = document.createElement('select');
  seasonSelect.className = 'vl-input';
  const seasonMap = new Map();
  for (const video of collection.videos) {
    const order = Number(video.seasonOrder) || 1;
    seasonMap.set(order, video.seasonName || `Saison ${order}`);
  }
  for (const [order, name] of [...seasonMap.entries()].sort(([a], [b]) => a - b)) {
    const option = document.createElement('option');
    option.value = String(order);
    option.textContent = name;
    seasonSelect.append(option);
  }
  seasonField.append(seasonSelect);
  const controls = makeElement('div', 'series-editor-controls');
  const addSeasonButton = makeElement('button', 'vl-button vl-button-secondary', 'Ajouter une saison');
  addSeasonButton.type = 'button';
  addSeasonButton.title = 'Ajouter une saison';
  prependIcon(addSeasonButton, 'plus');
  addSeasonButton.addEventListener('click', () => {
    const nextOrder = Math.max(0, ...[...seasonSelect.options].map((option) => Number(option.value))) + 1;
    const option = document.createElement('option');
    option.value = String(nextOrder);
    option.textContent = `Saison ${nextOrder} (à enregistrer après ajout d’épisodes)`;
    seasonSelect.append(option);
    seasonSelect.value = String(nextOrder);
    status.textContent = `Saison ${nextOrder} prête. Ajoute au moins un épisode pour l’enregistrer.`;
  });
  const filesInput = document.createElement('input');
  filesInput.className = 'vl-input';
  filesInput.type = 'file';
  filesInput.accept = 'video/*,.3gp,.m4v,.mkv,.mpg,.ts';
  filesInput.multiple = true;
  filesInput.hidden = true;
  const chooseEpisodeFilesButton = makeElement('button', 'vl-button vl-button-secondary', 'Choisir les épisodes');
  chooseEpisodeFilesButton.type = 'button';
  chooseEpisodeFilesButton.title = 'Choisir les fichiers vidéo à ajouter';
  prependIcon(chooseEpisodeFilesButton, 'folder');
  chooseEpisodeFilesButton.addEventListener('click', () => filesInput.click());
  filesInput.addEventListener('change', () => {
    const count = Array.from(filesInput.files || []).filter(isVideoFile).length;
    chooseEpisodeFilesButton.textContent = count
      ? `${count} épisode(s) choisi(s)`
      : 'Choisir les épisodes';
    prependIcon(chooseEpisodeFilesButton, 'folder');
  });
  const addEpisodesButton = makeElement('button', 'vl-button', 'Ajouter les épisodes');
  addEpisodesButton.type = 'button';
  addEpisodesButton.title = 'Ajouter les épisodes choisis à cette série';
  prependIcon(addEpisodesButton, 'addFiles');
  const status = makeElement('p', 'video-message', '');
  addEpisodesButton.addEventListener('click', async () => {
    const files = Array.from(filesInput.files || []).filter(isVideoFile);
    if (!files.length) {
      status.textContent = 'Choisis au moins un fichier vidéo.';
      status.classList.add('is-error');
      return;
    }
    const seasonOrder = Number(seasonSelect.value);
    if (!Number.isSafeInteger(seasonOrder) || seasonOrder < 1) {
      status.textContent = 'Choisis une saison valide.';
      status.classList.add('is-error');
      return;
    }
    let episodeOrder = Math.max(
      0,
      ...collection.videos
        .filter((video) => Number(video.seasonOrder) === seasonOrder)
        .map((video) => Number(video.episodeOrder) || 0)
    );
    const entries = files.sort((left, right) => naturalCompare(left.name, right.name)).map((file) => {
      episodeOrder += 1;
      return {
        file,
        path: file.webkitRelativePath || file.name,
        seasonOrder,
        details: {
          title: displayName(file.name),
          seasonName: seasonMap.get(seasonOrder) || `Saison ${seasonOrder}`,
          seasonOrder,
          episodeOrder
        }
      };
    });
    addEpisodesButton.disabled = true;
    status.classList.remove('is-error');
    status.textContent = 'Ajout des épisodes…';
    try {
      if (source === 'local') {
        await addLocalEpisodes(collection, entries, seasonOrder);
        await refreshLibrary(source);
      } else {
        const data = await postSharedVideos(entries, 'series', collection.title, collection.id);
        updateSharedLibraryView(data);
      }
      closeSeriesEditor();
      showVideoToast(`${entries.length} épisode(s) ajouté(s) à ${collection.title}.`);
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = `Ajout impossible : ${error.message}`;
    } finally {
      addEpisodesButton.disabled = false;
    }
  });
  controls.append(seasonField, addSeasonButton, chooseEpisodeFilesButton, filesInput, addEpisodesButton);
  const seasonList = makeElement('div', 'series-editor-seasons');
  for (const [seasonOrder, seasonName] of [...seasonMap.entries()].sort(([a], [b]) => a - b)) {
    const seasonVideos = sortedEpisodes(collection)
      .filter((video) => Number(video.seasonOrder) === seasonOrder);
    const seasonSection = makeElement('section', 'series-editor-season');
    const heading = makeElement('div', 'series-editor-season-heading');
    heading.append(makeElement('strong', '', `${seasonName} · ${seasonVideos.length} épisode(s)`));
    const removeSeasonButton = makeElement('button', 'vl-button vl-button-secondary', 'Supprimer la saison');
    removeSeasonButton.type = 'button';
    removeSeasonButton.title = `Supprimer ${seasonName}`;
    setIcon(removeSeasonButton, 'trash');
    removeSeasonButton.addEventListener('click', async () => {
      const confirmation = await showAppDialog({
        title: `Supprimer ${seasonName} ?`,
        message: `${seasonVideos.length} épisode(s) seront aussi supprimés définitivement.`,
        confirmLabel: 'Supprimer',
        destructive: true
      });
      if (!confirmation.confirmed) return;
      try {
        if (source === 'local') {
          await removeLocalSeason(collection, seasonOrder);
        } else {
          await panelAuth.request(
            `/vital/api/videos/${encodeURIComponent(collection.id)}/seasons/${seasonOrder}`,
            { method: 'DELETE' }
          );
        }
        closeSeriesEditor();
        await refreshLibrary(source);
      } catch (error) {
        showVideoToast(error.message, true);
      }
    });
    heading.append(removeSeasonButton);
    const episodeList = document.createElement('ul');
    for (const [episodeIndex, video] of seasonVideos.entries()) {
      const item = document.createElement('li');
      item.append(makeElement('span', '', `Épisode ${video.episodeOrder} · ${video.title || video.fileName}`));
      const episodeActions = makeElement('div', 'episode-row-actions');
      for (const [iconName, direction, label] of [
        ['up', -1, 'Monter'],
        ['down', 1, 'Descendre']
      ]) {
        const orderButton = makeElement('button', 'vl-button vl-button-secondary');
        orderButton.type = 'button';
        orderButton.title = `${label} l’épisode ${video.episodeOrder}`;
        orderButton.setAttribute('aria-label', orderButton.title);
        orderButton.disabled = direction < 0
          ? episodeIndex === 0
          : episodeIndex === seasonVideos.length - 1;
        setIcon(orderButton, iconName);
        orderButton.addEventListener('click', async () => {
          const reorderedEpisodes = [...seasonVideos];
          const targetIndex = episodeIndex + direction;
          [reorderedEpisodes[episodeIndex], reorderedEpisodes[targetIndex]] =
            [reorderedEpisodes[targetIndex], reorderedEpisodes[episodeIndex]];
          try {
            await saveEpisodeOrder(
              collection,
              seasonOrder,
              reorderedEpisodes.map((episode) => episode.id),
              source
            );
            closeSeriesEditor();
            showVideoToast(`${seasonName} réordonnée.`);
          } catch (error) {
            showVideoToast(`Réorganisation impossible : ${error.message}`, true);
          }
        });
        episodeActions.append(orderButton);
      }
      const removeButton = makeElement('button', 'vl-button vl-button-secondary', 'Supprimer');
      removeButton.type = 'button';
      removeButton.title = `Supprimer l’épisode ${video.episodeOrder}`;
      setIcon(removeButton, 'trash');
      removeButton.addEventListener('click', async () => {
        const confirmation = await showAppDialog({
          title: `Supprimer l’épisode ${video.episodeOrder} ?`,
          message: video.title || video.fileName,
          confirmLabel: 'Supprimer',
          destructive: true
        });
        if (!confirmation.confirmed) return;
        try {
          if (source === 'local') {
            await removeLocalEpisode(collection, video.id);
          } else {
            await panelAuth.request(
              `/vital/api/videos/${encodeURIComponent(collection.id)}/episodes/${encodeURIComponent(video.id)}`,
              { method: 'DELETE' }
            );
          }
          closeSeriesEditor();
          await refreshLibrary(source);
        } catch (error) {
          showVideoToast(error.message, true);
        }
      });
      episodeActions.append(removeButton);
      item.append(episodeActions);
      episodeList.append(item);
    }
    seasonSection.append(heading, episodeList);
    seasonList.append(seasonSection);
  }
  content.append(controls, status, seasonList);
  return content;
}

function renderCollection(container, collection, source) {
  const card = makeElement('article', 'video-card');
  card.dataset.searchTitle = normalizeSearchText(collection.title);
  card.dataset.collectionType = collection.type;
  const poster = makeElement('div', 'video-card-poster is-empty');
  poster.setAttribute('aria-hidden', 'true');
  const placeholder = createIcon('play');
  placeholder.classList.add('poster-placeholder');
  poster.append(placeholder);
  const top = makeElement('div', 'video-card-top');
  const title = makeElement('h3', '', collection.title);
  const badge = makeElement('span', 'video-type-badge', collection.type === 'series' ? 'Série' : 'Film');
  top.append(title, badge);
  const count = collectionEpisodeCount(collection);
  const seasonGroups = new Map();
  for (const video of sortedEpisodes(collection)) {
    if (collection.type !== 'series') continue;
    const seasonKey = Number(video.seasonOrder) || 1;
    const season = seasonGroups.get(seasonKey) || {
      name: video.seasonName || `Saison ${seasonKey}`,
      videos: []
    };
    season.videos.push(video);
    seasonGroups.set(seasonKey, season);
  }
  const metaText = collection.type === 'series'
    ? `${seasonGroups.size} saison(s) · ${count} épisode(s) · ${formatBytes(collectionByteSize(collection))}`
    : `${formatMediaFormats(collection.videos)} · ${count} film${count === 1 ? '' : 's'} · ${formatBytes(collectionByteSize(collection))}`;
  const meta = makeElement('p', 'video-card-meta', metaText);
  const actions = makeElement('div', 'video-card-actions');
  const playButton = makeElement('button', 'vl-button', collection.type === 'series' ? 'Ouvrir la série' : 'Regarder');
  playButton.type = 'button';
  playButton.title = collection.type === 'series' ? 'Ouvrir la série' : 'Lire le film';
  setIcon(playButton, 'play');
  playButton.dataset.action = 'play';
  playButton.dataset.source = source;
  playButton.dataset.collectionId = collection.id;
  actions.append(playButton);
  if (collection.type === 'series') {
    const episodesButton = makeElement(
      'button',
      'video-card-details-trigger',
      `Voir les saisons et épisodes (${count})`
    );
    episodesButton.type = 'button';
    episodesButton.dataset.action = 'episodes';
    episodesButton.dataset.source = source;
    episodesButton.dataset.collectionId = collection.id;
    card.append(poster, top, meta, episodesButton);
    if (source === 'local' || canManageSharedVideos) {
      const editSeriesButton = makeElement('button', 'vl-button vl-button-secondary', 'Modifier');
      editSeriesButton.type = 'button';
      editSeriesButton.title = `Gérer ${collection.title}`;
      prependIcon(editSeriesButton, 'pencil');
      editSeriesButton.dataset.action = 'edit-series';
      editSeriesButton.dataset.source = source;
      editSeriesButton.dataset.collectionId = collection.id;
      actions.append(editSeriesButton);
    }
    card.append(actions);
  } else {
    card.append(poster, top, meta, actions);
  }
  if (collection.type !== 'series' && (source === 'local' || canManageSharedVideos)) {
    const renameButton = makeElement('button', 'vl-button vl-button-secondary', 'Modifier');
    renameButton.type = 'button';
    renameButton.title = `Modifier ${collection.title}`;
    setIcon(renameButton, 'pencil');
    renameButton.dataset.action = 'edit-collection';
    renameButton.dataset.source = source;
    renameButton.dataset.collectionId = collection.id;
    actions.append(renameButton);
  }
  if (source === 'local' || canManageSharedVideos) {
    const deleteButton = makeElement('button', 'vl-button vl-button-secondary', 'Supprimer');
    deleteButton.type = 'button';
    deleteButton.title = `Supprimer ${collection.title}`;
    setIcon(deleteButton, 'trash');
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.source = source;
    deleteButton.dataset.collectionId = collection.id;
    actions.append(deleteButton);
  }
  container.append(card);
  void attachCollectionCover(poster, collection, source);
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}

function applyLibrarySearch(input, container, noResults) {
  const query = normalizeSearchText(input.value);
  const selectedType = libraryTypeFilters.get(container) || 'all';
  const cards = container.querySelectorAll('.video-card');
  let visibleCount = 0;
  for (const card of cards) {
    const matchesText = !query || card.dataset.searchTitle.includes(query);
    const matchesType = selectedType === 'all' || card.dataset.collectionType === selectedType;
    const matches = matchesText && matchesType;
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  }
  noResults.hidden = visibleCount > 0 || cards.length === 0;
}

function handleLibraryFilter(event, container, input, noResults) {
  const button = event.target.closest('button[data-library-filter]');
  if (!button) return;
  libraryTypeFilters.set(container, button.dataset.libraryFilter);
  for (const filter of button.parentElement.querySelectorAll('[data-library-filter]')) {
    filter.classList.toggle('is-active', filter === button);
    filter.setAttribute('aria-pressed', String(filter === button));
  }
  applyLibrarySearch(input, container, noResults);
}

async function renderLocalLibrary(quotaPromise = updateLocalStorageQuota()) {
  const collections = await getLocalCollections();
  collections.sort((left, right) => right.createdAt - left.createdAt);
  clearCoverObjectUrls(localLibrary);
  localLibrary.replaceChildren();
  for (const collection of collections) renderCollection(localLibrary, collection, 'local');
  localEmpty.hidden = collections.length > 0;
  applyLibrarySearch(localLibrarySearch, localLibrary, localLibraryNoResults);
  await updateLocalStorage(collections, quotaPromise);
}

async function loadSharedCollections() {
  if (!canViewSharedVideos || !panelAuth.getSessionId()) {
    throw new Error('Ton compte ne peut pas consulter la bibliothèque partagée.');
  }
  return panelAuth.request('/vital/api/videos/shared');
}

async function loadSharedLibrary() {
  if (!canViewSharedVideos) return;
  try {
    const data = await loadSharedCollections();
    sharedLibraryMessage.hidden = true;
    setMessage(sharedLibraryMessage, '');
    clearCoverObjectUrls(sharedLibrary);
    sharedLibrary.replaceChildren();
    for (const collection of data.collections) {
      renderCollection(sharedLibrary, collection, 'shared');
    }
    applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults);
    sharedEmpty.hidden = data.collections.length > 0;
    updateSharedLibrarySummary(data);
    updateSharedStorage(data);
  } catch (error) {
    setMessage(sharedLibraryMessage, error.message, true);
    sharedLibraryMessage.hidden = false;
    sharedLibraryCounts.textContent = 'Nombre de titres indisponible';
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

async function loadSharedCover(collectionId) {
  const sessionId = panelAuth.getSessionId();
  if (!sessionId) throw new Error('Connexion requise.');
  const url = window.config.getApiUrl(
    `/vital/api/videos/${encodeURIComponent(collectionId)}/cover`
  );
  const response = await fetch(url, { headers: { 'X-Panel-Session': sessionId } });
  if (response.status === 401) {
    panelAuth.clearSession();
    window.location.replace('/connexion/');
    throw new Error('Votre session a expiré.');
  }
  if (!response.ok) throw new Error(`Impossible de charger l’image (${response.status}).`);
  return response.blob();
}

async function attachCollectionCover(poster, collection, source) {
  try {
    const cover = source === 'local' ? collection.cover : collection.coverMimeType
      ? await loadSharedCover(collection.id)
      : null;
    if (!cover || !poster.isConnected) return;
    const url = URL.createObjectURL(cover);
    if (!poster.isConnected) {
      URL.revokeObjectURL(url);
      return;
    }
    coverObjectUrls.set(url, poster.closest('.video-library'));
    poster.classList.remove('is-empty');
    const image = document.createElement('img');
    image.src = url;
    image.alt = '';
    image.loading = 'lazy';
    poster.replaceChildren(image);
  } catch (error) {
    console.error(`Impossible de charger l’image de « ${collection.title} » :`, error);
  }
}

async function detectSuperadmin() {
  if (!panelAuth.getSessionId()) return;
  try {
    const session = await panelAuth.request('/vital/api/panel/auth/session');
    isSuperadmin = session.role === 'superadmin';
    canViewSharedVideos = isSuperadmin || session.allowedSites?.includes('videos') === true;
    canManageSharedVideos = canViewSharedVideos;
    sharedStorageCard.hidden = !canViewSharedVideos;
    storageOverviewGrid.classList.toggle('is-local-only', !canViewSharedVideos);
    sharedLibraryPanel.hidden = !canViewSharedVideos;
    if (canManageSharedVideos) {
      uploadDestinationField.hidden = false;
      updateUploadDestinationCopy();
    }
  } catch (error) {
    console.error('Impossible de vérifier le rôle pour la bibliothèque vidéo :', error);
  }
}

function postSharedVideos(
  entries,
  type,
  title,
  existingCollectionId = null,
  coverFile = null,
  perMovieCovers = new Map()
) {
  return new Promise((resolve, reject) => {
    const sessionId = panelAuth.getSessionId();
    if (!sessionId) {
      panelAuth.clearSession();
      window.location.replace('/connexion/');
      reject(new Error('Connexion requise.'));
      return;
    }

    const totalBytes = entries.reduce((total, entry) => total + entry.file.size, 0);
    const collectionId = type === 'series'
      ? existingCollectionId || crypto.randomUUID()
      : null;
    const collectionIds = type === 'series'
      ? entries.map(() => collectionId)
      : entries.map(() => crypto.randomUUID());
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
              collectionId: collectionIds[index]
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

      if (coverFile) {
        uploadProgressLabel.textContent = 'Envoi des affiches par défaut…';
        for (const id of new Set(collectionIds)) {
          await panelAuth.request(`/vital/api/videos/${encodeURIComponent(id)}/cover`, {
            method: 'POST',
            headers: { 'Content-Type': coverFile.type },
            body: coverFile
          });
        }
      }
      if (type === 'movie') {
        const individualCovers = entries
          .map((entry, index) => ({ entry, collectionId: collectionIds[index] }))
          .filter(({ entry }) => perMovieCovers.has(entry.path));
        for (const [index, { entry, collectionId: id }] of individualCovers.entries()) {
          const cover = perMovieCovers.get(entry.path);
          uploadProgressLabel.textContent =
            `Envoi des affiches individuelles : ${index + 1}/${individualCovers.length}…`;
          await panelAuth.request(`/vital/api/videos/${encodeURIComponent(id)}/cover`, {
            method: 'POST',
            headers: { 'Content-Type': cover.type },
            body: cover
          });
        }
      }

      uploadProgress.value = 100;
      uploadProgressLabel.textContent =
        'Envoi terminé. Actualisation de la bibliothèque partagée…';
      resolve(await loadSharedCollections());
    })().catch(reject);
  });
}

async function saveLocally(entries, type, title, coverFile, perMovieCovers = movieCovers) {
  if (type === 'movie') {
    for (const entry of entries) {
      const id = localVideoId();
      const collectionId = localVideoId();
      const movieTitle = entries.length === 1 ? title : entry.details.title;
      await saveLocalCollection({
        id: collectionId,
        type,
        title: movieTitle,
        cover: perMovieCovers.get(entry.path) || coverFile || null,
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
    cover: coverFile || null,
    createdAt: Date.now(),
    videos: videos.map(({ file, collectionId: ignoredCollectionId, ...video }) => video)
  }, videos);
}

function clearUploadSelection() {
  uploadForm.reset();
  setCoverPreview(null);
  selectedVideos = [];
  movieCovers.clear();
  renderMovieCoverSelectors([]);
  folderVideoFiles = [];
  folderFileList.replaceChildren();
  folderFilePicker.hidden = true;
  resetSeasonRows();
  updateSelectedFiles();
  updateUploadCopy();
  updateUploadDestinationCopy();
}

async function handleUpload(event) {
  event.preventDefault();
  setMessage(uploadMessage, '');
  let entries;
  try {
    const coverFile = coverFileInput.files?.[0] || null;
    validateCoverFile(coverFile);
    const perMovieCovers = new Map(movieCovers);
    entries = getSelectedEntries();
    uploadSubmit.disabled = true;
    uploadProgress.hidden = false;
    uploadProgress.removeAttribute('value');
    uploadProgressLabel.hidden = false;
    const title = uploadType.value === 'series'
      ? uploadTitle.value.trim()
      : displayName(entries[0].file.name);
    const shareWithEveryone = canManageSharedVideos && uploadDestination.value === 'shared';
    if (shareWithEveryone && entries.length > 1000) {
      throw new Error('Un import serveur ne peut pas contenir plus de 1 000 vidéos.');
    }
    uploadProgress.hidden = false;
    uploadProgress.removeAttribute('value');
    uploadProgressLabel.hidden = false;
    if (shareWithEveryone) {
      uploadProgressLabel.textContent = 'Préparation de l’envoi des vidéos…';
      const data = await postSharedVideos(
        entries,
        uploadType.value,
        title,
        null,
        coverFile,
        perMovieCovers
      );
      clearCoverObjectUrls(sharedLibrary);
      sharedLibrary.replaceChildren();
      for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
      applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults);
      sharedEmpty.hidden = data.collections.length > 0;
      updateSharedLibrarySummary(data);
      updateSharedStorage(data);
      setMessage(
        uploadMessage,
        'Dépôt terminé. Les vidéos sont visibles par les comptes autorisés à la bibliothèque Vidéos.'
      );
    } else {
      uploadProgressLabel.textContent = 'Enregistrement des vidéos dans la bibliothèque de ce navigateur…';
      const persistenceStatus = await requestPersistentLocalStorage();
      localStorageNote.textContent = persistenceStatus;
      await saveLocally(entries, uploadType.value, title, coverFile, perMovieCovers);
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
  playerEpisodeNavigation.hidden = !isSeries;
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
    option.textContent = season.name || `Saison ${season.order}`;
    seasonSelect.append(option);
  }
  const activeEpisode = episodes[currentEpisodeIndex];
  seasonSelect.value = String(activeEpisode?.seasonOrder ?? seasons[0]?.order ?? '');
  updateEpisodeOptions(episodes);
}

function updateEpisodeOptions(episodes = sortedEpisodes(currentCollection)) {
  const selectedSeason = Number(seasonSelect.value);
  episodeSelect.replaceChildren();
  const seasonEpisodes = episodes.filter((episode) => Number(episode.seasonOrder) === selectedSeason);
  for (const episode of seasonEpisodes) {
    const option = document.createElement('option');
    option.value = episode.id;
    option.textContent =
      `${episode.episodeOrder || '?'} · ${episode.title || episode.fileName || 'Épisode sans titre'}`;
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
  savePlaybackProgress(true);
  playbackGeneration += 1;
  playbackResumeReady = false;
  pendingPlaybackResume = null;
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

function playbackProgressStorageKey(source, episodeId) {
  return `vitaload-video-progress:${source}:${encodeURIComponent(episodeId)}`;
}

function accountPlaybackProgressKey(source, episodeId) {
  return `videoProgress:${source}:${encodeURIComponent(episodeId)}`;
}

function isValidPlaybackProgress(progress) {
  return progress !== null &&
    typeof progress === 'object' &&
    !Array.isArray(progress) &&
    Number.isFinite(progress.time) &&
    progress.time >= 0 &&
    (progress.duration === null ||
      (Number.isFinite(progress.duration) && progress.duration >= 0)) &&
    Number.isFinite(progress.updatedAt) &&
    progress.updatedAt >= 0;
}

async function initializePlaybackProgress() {
  if (!panelAuth.getSessionId()) return;

  const localEntries = {};
  const localEntryValues = new Map();
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      let localKey;
      try {
        localKey = localStorage.key(index);
        const match = localKey?.match(/^vitaload-video-progress:(local|shared):([A-Za-z0-9._~-]{1,200})$/);
        if (!match) continue;
        const value = JSON.parse(localStorage.getItem(localKey));
        if (!isValidPlaybackProgress(value)) continue;
        const accountKey = `videoProgress:${match[1]}:${match[2]}`;
        localEntries[accountKey] = { value, localStorageKey: localKey };
        localEntryValues.set(accountKey, value);
        accountPlaybackProgress.set(accountKey, value);
      } catch (error) {
        console.error(`Impossible de lire la progression locale ${localKey || ''} :`, error);
      }
    }
  } catch (error) {
    console.error('Impossible de parcourir les progressions locales :', error);
    showVideoToast(`Lecture des progressions locales impossible : ${error.message}`, true);
  }

  try {
    const accountData = await window.VitaLoadPanelData.loadAndMigrate(localEntries);
    for (const [key, value] of Object.entries(accountData || {})) {
      if (key.startsWith('videoProgress:') && isValidPlaybackProgress(value)) {
        const existingProgress = accountPlaybackProgress.get(key);
        if (!existingProgress || value.updatedAt >= existingProgress.updatedAt) {
          accountPlaybackProgress.set(key, value);
        }
      }
    }
  } catch (error) {
    console.error('Impossible de synchroniser les progressions du compte :', error);
    showVideoToast(`Synchronisation des progressions impossible : ${error.message}. Les données locales sont conservées.`, true);
    for (const [key, value] of localEntryValues) {
      if (!accountPlaybackProgress.has(key)) accountPlaybackProgress.set(key, value);
    }
  }
}

function readPlaybackProgress(source, episodeId) {
  if (panelAuth.getSessionId()) {
    const accountProgress = accountPlaybackProgress.get(accountPlaybackProgressKey(source, episodeId));
    if (accountProgress) return accountProgress;
  }
  try {
    const rawProgress = localStorage.getItem(playbackProgressStorageKey(source, episodeId));
    if (!rawProgress) return null;
    const progress = JSON.parse(rawProgress);
    return isValidPlaybackProgress(progress) ? progress : null;
  } catch (error) {
    if (!playbackProgressStorageErrorReported) {
      playbackProgressStorageErrorReported = true;
      console.error('Impossible de lire la progression vidéo enregistrée :', error);
    }
    return null;
  }
}

function savePlaybackProgress(force = false) {
  if (!playbackResumeReady || !currentCollection || currentEpisodeIndex < 0) return;
  const episode = sortedEpisodes(currentCollection)[currentEpisodeIndex];
  if (!episode || !Number.isFinite(videoPlayer.currentTime)) return;
  const now = Date.now();
  if (!force && now - lastPlaybackProgressWrite < 5000) return;
  const progress = {
    time: videoPlayer.currentTime,
    duration: Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : null,
    updatedAt: now
  };
  const localKey = playbackProgressStorageKey(currentSource, episode.id);
  if (panelAuth.getSessionId()) {
    const accountKey = accountPlaybackProgressKey(currentSource, episode.id);
    accountPlaybackProgress.set(accountKey, progress);
    playbackProgressSaveQueue = playbackProgressSaveQueue
      .catch(() => {})
      .then(async () => {
        await playbackProgressReady;
        await window.VitaLoadPanelData.save(accountKey, progress);
        localStorage.removeItem(localKey);
      })
      .catch((error) => {
        try {
          localStorage.setItem(localKey, JSON.stringify(progress));
        } catch (storageError) {
          console.error('Impossible de conserver localement la progression vidéo :', storageError);
          showVideoToast('La progression n’a pas pu être synchronisée ni conservée dans ce navigateur.', true);
          return;
        }
        if (!playbackProgressSyncErrorReported) {
          playbackProgressSyncErrorReported = true;
          console.error('Impossible d’enregistrer la progression sur le compte :', error);
          showVideoToast(`Progression non synchronisée : ${error.message}. Elle est conservée dans ce navigateur.`, true);
        }
      });
    lastPlaybackProgressWrite = now;
    return;
  }
  try {
    localStorage.setItem(localKey, JSON.stringify(progress));
    lastPlaybackProgressWrite = now;
  } catch (error) {
    if (!playbackProgressStorageErrorReported) {
      playbackProgressStorageErrorReported = true;
      console.error('Impossible d’enregistrer la progression vidéo :', error);
      showVideoToast('La progression de lecture ne peut pas être enregistrée dans ce navigateur.', true);
    }
  }
}

function restorePlaybackProgress() {
  const resume = pendingPlaybackResume;
  pendingPlaybackResume = null;
  if (!resume || resume.generation !== playbackGeneration) return;
  playbackResumeReady = true;
  const savedTime = resume.time;
  const duration = videoPlayer.duration;
  const shouldResume = savedTime > 0 &&
    (!Number.isFinite(duration) || savedTime < duration - 5);
  if (shouldResume) {
    videoPlayer.currentTime = savedTime;
    setMessage(playerMessage, `Reprise de la lecture à ${formatPlaybackTime(savedTime)}.`);
  }
  updatePlayerProgress();
  savePlaybackProgress(true);
}

function updatePlayPauseButton() {
  const isPlaying = !videoPlayer.paused && !videoPlayer.ended;
  playPauseButton.setAttribute('aria-label', isPlaying ? 'Mettre en pause' : 'Lire');
  playPauseButton.title = isPlaying ? 'Mettre en pause' : 'Lire';
  setIcon(playPauseButton, isPlaying ? 'pause' : 'play');
  playPauseButton.setAttribute('aria-label', isPlaying ? 'Mettre en pause' : 'Lire');
  playPauseButton.title = isPlaying ? 'Mettre en pause' : 'Lire';
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
  setIcon(muteButton, isMuted ? 'mute' : 'volume');
  muteButton.setAttribute('aria-label', isMuted ? 'Activer le son' : 'Couper le son');
  muteButton.title = isMuted ? 'Activer le son' : 'Couper le son';
}

function updatePlaybackUrl() {
  if (!currentCollection || currentEpisodeIndex < 0) return;
  const episode = sortedEpisodes(currentCollection)[currentEpisodeIndex];
  if (!episode) return;
  const url = new URL(window.location.href);
  url.searchParams.set('vl-source', currentSource);
  url.searchParams.set('vl-collection', currentCollection.id);
  url.searchParams.set('vl-episode', episode.id);
  window.history.replaceState(null, '', url);
}

function clearPlaybackUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('vl-source') &&
      !url.searchParams.has('vl-collection') &&
      !url.searchParams.has('vl-episode')) return;
  url.searchParams.delete('vl-source');
  url.searchParams.delete('vl-collection');
  url.searchParams.delete('vl-episode');
  window.history.replaceState(null, '', url);
}

async function copyPlaybackUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('vl-collection')) updatePlaybackUrl();
  const shareUrl = window.location.href;
  try {
    await navigator.clipboard.writeText(shareUrl);
    showVideoToast(currentSource === 'local'
      ? 'Lien copié. Il fonctionne uniquement dans ce navigateur, où la vidéo est enregistrée.'
      : 'Lien copié. Les personnes qui l’ouvrent doivent être connectées et autorisées à voir la bibliothèque.');
  } catch (error) {
    showVideoToast(`Copie impossible : ${error.message}. L’adresse de partage est dans la barre d’adresse.`, true);
  }
}

async function requestSharedPlaybackUrl(videoId) {
  const sessionId = panelAuth.getSessionId();
  if (!sessionId) {
    panelAuth.clearSession();
    window.location.replace('/connexion/');
    throw new Error('Connexion requise.');
  }
  const endpoint = window.config.getApiUrl(
    `/vital/api/videos/shared/${encodeURIComponent(videoId)}/playback-ticket`
  );
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'X-Panel-Session': sessionId }
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (response.status === 401) {
    panelAuth.clearSession();
    window.location.replace('/connexion/');
    throw new Error(data.error || 'Votre session a expiré.');
  }
  if (!response.ok) {
    throw new Error(data.error || `Impossible d’autoriser la lecture (${response.status}).`);
  }
  if (typeof data.streamPath !== 'string' || !data.streamPath.startsWith('/vital/api/videos/')) {
    throw new Error('Le serveur a renvoyé une adresse de lecture invalide.');
  }
  return `https://${window.config.ipServer}${data.streamPath}`;
}

async function showEpisode(index, shouldPlay = false) {
  const episodes = sortedEpisodes(currentCollection);
  if (index < 0 || index >= episodes.length) return;
  clearPlayerUrls();
  const generation = playbackGeneration;
  currentEpisodeIndex = index;
  const episode = episodes[index];
  if (panelAuth.getSessionId()) await playbackProgressReady;
  if (generation !== playbackGeneration) return;
  const savedProgress = readPlaybackProgress(currentSource, episode.id);
  updatePlaybackUrl();
  playerTitle.textContent = currentCollection.title;
  playerSubtitle.textContent = currentCollection.type === 'series'
    ? `${episode.seasonName} · Épisode ${episode.episodeOrder} · ${episode.title}`
    : episode.fileName;
  if (currentCollection.type === 'series') {
    seasonSelect.value = String(episode.seasonOrder);
    updateEpisodeOptions(episodes);
    episodeSelect.value = episode.id;
  }
  playerShareNote.textContent = currentSource === 'local'
    ? 'Lien valable uniquement dans ce navigateur.'
    : 'Les personnes doivent être connectées et autorisées à consulter la bibliothèque partagée.';
  setMessage(playerMessage, '');

  if (currentSource === 'shared') {
    try {
      currentVideoUrl = await requestSharedPlaybackUrl(episode.id);
      if (generation !== playbackGeneration) return;
      setMessage(playerMessage, 'Lecture en continu depuis le serveur. La vidéo n’est pas enregistrée dans IndexedDB.');
    } catch (error) {
      if (generation === playbackGeneration && !isPlaybackInterrupted(error)) {
        setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
      }
      return;
    }
  } else {
    const storedVideo = await getLocalVideo(episode.id);
    if (generation !== playbackGeneration) return;
    if (!storedVideo) {
      setMessage(playerMessage, 'Cette vidéo locale est introuvable dans IndexedDB.', true);
      return;
    }
    currentVideoUrl = URL.createObjectURL(storedVideo.blob);
  }
  if (generation !== playbackGeneration) return;
  pendingPlaybackResume = {
    generation,
    time: savedProgress?.time || 0
  };
  videoPlayer.crossOrigin = 'anonymous';
  videoPlayer.referrerPolicy = 'no-referrer';
  videoPlayer.src = currentVideoUrl;
  videoPlayer.playbackRate = Number(playbackSpeed.value);
  videoPlayer.load();
  updatePlayerProgress();
  updatePlayPauseButton();
  if (shouldPlay) {
    try {
      await videoPlayer.play();
    } catch (error) {
      if (generation === playbackGeneration && !isPlaybackInterrupted(error)) {
        setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
      }
    }
  }
}

async function openPlayer(collection, source, collections, episodeId = null) {
  savePlaybackProgress(true);
  playbackResumeReady = false;
  pendingPlaybackResume = null;
  currentCollection = collection;
  currentSource = source;
  const episodes = sortedEpisodes(collection);
  const selectedIndex = episodeId
    ? episodes.findIndex((episode) => episode.id === episodeId)
    : 0;
  currentEpisodeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  currentCatalog = collections;
  collectionSelect.replaceChildren();
  for (const catalogCollection of currentCatalog) {
    const option = document.createElement('option');
    option.value = catalogCollection.id;
    option.textContent = `${catalogCollection.type === 'series' ? 'Série' : 'Film'} · ${catalogCollection.title}`;
    collectionSelect.append(option);
  }

  collectionSelect.value = collection.id;
  renderPlayerRecommendations();
  playerKind.textContent = collection.type === 'series' ? 'Série' : 'Film';
  fillEpisodeOptions();
  document.body.classList.add('player-open');
  if (!playerDialog.open) {
    try {
      playerDialog.showModal();
    } catch (error) {
      document.body.classList.remove('player-open');
      throw error;
    }
  }
  await showEpisode(currentEpisodeIndex, true);
}

async function openPlaybackFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('vl-source');
  const collectionId = params.get('vl-collection');
  const episodeId = params.get('vl-episode');
  if (!source && !collectionId && !episodeId) return;
  if (!['local', 'shared'].includes(source) || !collectionId || !episodeId) {
    throw new Error('Le lien vidéo est incomplet ou invalide.');
  }

  const collections = source === 'local'
    ? await getLocalCollections()
    : (await loadSharedCollections()).collections;
  const collection = collections.find((item) => item.id === collectionId);
  if (!collection) {
    throw new Error(source === 'local'
      ? 'Cette vidéo locale est introuvable dans ce navigateur.'
      : 'Cette vidéo partagée est introuvable ou tu n’as pas le droit de la consulter.');
  }
  if (!sortedEpisodes(collection).some((episode) => episode.id === episodeId)) {
    throw new Error('Cet épisode n’existe plus dans la bibliothèque.');
  }
  await openPlayer(collection, source, collections, episodeId);
}

async function handleCollectionAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const collectionId = button.dataset.collectionId;
  const source = button.dataset.source;
  const action = button.dataset.action;
  try {
    if (action === 'edit-series') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await loadSharedCollections()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection || collection.type !== 'series') {
        throw new Error('Série introuvable.');
      }
      seriesEditorEyebrow.textContent = 'GESTION DE LA SÉRIE';
      seriesEditorTitle.textContent = collection.title;
      seriesEditorSubtitle.textContent =
        `${new Set(collection.videos.map((video) => Number(video.seasonOrder) || 1)).size} saison(s) · ` +
        `${collection.videos.length} épisode(s)`;
      seriesEditorHost.replaceChildren(createSeriesEditor(collection, source));
      seriesEditorDialog.showModal();
      return;
    }
    if (action === 'episodes') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await loadSharedCollections()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection || collection.type !== 'series') throw new Error('Série introuvable.');
      openCollectionDetails(collection, 'SAISONS ET ÉPISODES', source, collections);
      return;
    }
    if (action === 'edit-collection') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await loadSharedCollections()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection) throw new Error('Film ou série introuvable.');
      seriesEditorEyebrow.textContent = 'MODIFIER LA COLLECTION';
      seriesEditorTitle.textContent = collection.title;
      seriesEditorSubtitle.textContent =
        `${collection.videos.length} film${collection.videos.length === 1 ? '' : 's'} · ` +
        `${formatBytes(collectionByteSize(collection))}`;
      seriesEditorHost.replaceChildren(createCollectionMetadataEditor(collection, source));
      seriesEditorDialog.showModal();
      return;
    }
    if (action === 'rename') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await loadSharedCollections()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection) throw new Error('Film ou série introuvable.');
      const answer = await showAppDialog({
        title: 'Renommer la collection',
        message: 'Choisis le titre affiché dans la bibliothèque.',
        inputLabel: 'Titre',
        initialValue: collection.title,
        confirmLabel: 'Enregistrer'
      });
      if (!answer.confirmed) return;
      const trimmedTitle = answer.value.trim();
      if (!trimmedTitle || trimmedTitle.length > 200 || /[\u0000-\u001f\u007f]/.test(trimmedTitle)) {
        throw new Error('Le titre doit contenir entre 1 et 200 caractères.');
      }
      if (source === 'local') {
        await renameLocalCollection(collection, trimmedTitle);
        await renderLocalLibrary();
        return;
      }
      const data = await panelAuth.request(`/vital/api/videos/${encodeURIComponent(collectionId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: trimmedTitle })
      });
      clearCoverObjectUrls(sharedLibrary);
      sharedLibrary.replaceChildren();
      for (const updatedCollection of data.collections) {
        renderCollection(sharedLibrary, updatedCollection, 'shared');
      }
      applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults);
      sharedEmpty.hidden = data.collections.length > 0;
      updateSharedLibrarySummary(data);
      updateSharedStorage(data);
      return;
    }
    if (action === 'play') {
      const collections = source === 'local'
        ? await getLocalCollections()
        : (await loadSharedCollections()).collections;
      const collection = collections.find((item) => item.id === collectionId);
      if (!collection) throw new Error('Film ou série introuvable.');
      await openPlayer(collection, source, collections);
      return;
    }
    if (action !== 'delete') return;
    const confirmation = await showAppDialog({
      title: 'Supprimer cette collection ?',
      message: 'Cette action supprimera la vidéo ou toute la série de la bibliothèque.',
      confirmLabel: 'Supprimer',
      destructive: true
    });
    if (!confirmation.confirmed) return;
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
    clearCoverObjectUrls(sharedLibrary);
    sharedLibrary.replaceChildren();
    for (const collection of data.collections) renderCollection(sharedLibrary, collection, 'shared');
    applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults);
    sharedEmpty.hidden = data.collections.length > 0;
    updateSharedLibrarySummary(data);
    updateSharedStorage(data);
  } catch (error) {
    showVideoToast(error.message, true);
  }
}

chooseFilesButton.addEventListener('click', () => videoFilesInput.click());
chooseFolderButton.addEventListener('click', () => videoFolderInput.click());
chooseCoverButton.addEventListener('click', () => coverFileInput.click());
coverFileInput.addEventListener('change', () => {
  const file = coverFileInput.files?.[0] || null;
  try {
    validateCoverFile(file);
    setCoverPreview(file);
    updateSelectedFiles();
    setMessage(uploadMessage, '');
  } catch (error) {
    coverFileInput.value = '';
    setCoverPreview(null);
    updateSelectedFiles();
    setMessage(uploadMessage, error.message, true);
  }
});
removeCoverButton.addEventListener('click', () => {
  coverFileInput.value = '';
  setCoverPreview(null);
  updateSelectedFiles();
});
videoFilesInput.addEventListener('change', () => {
  const files = Array.from(videoFilesInput.files || []);
  videoFilesInput.value = '';
  useFiles(files);
});
videoFolderInput.addEventListener('change', () => {
  renderFolderFiles(videoFolderInput.files || []);
  videoFolderInput.value = '';
});
addFolderFilesButton.addEventListener('click', () => {
  const selectedFiles = [...folderFileList.querySelectorAll('input[type="checkbox"]:checked')]
    .map((checkbox) => folderVideoFiles[Number(checkbox.dataset.fileIndex)])
    .filter(Boolean);
  if (selectedFiles.length === 0) {
    setMessage(uploadMessage, 'Sélectionne au moins un fichier vidéo dans le dossier.', true);
    return;
  }
  useFiles(selectedFiles);
  folderFilePicker.hidden = true;
  setMessage(uploadMessage, `${selectedFiles.length} fichier(s) du dossier ajouté(s) à la sélection.`);
});
addSeasonButton.addEventListener('click', addSeasonRow);
sharedLibrarySearch.addEventListener('input', () =>
  applyLibrarySearch(sharedLibrarySearch, sharedLibrary, sharedLibraryNoResults)
);
sharedLibraryFilters.addEventListener('click', (event) =>
  handleLibraryFilter(event, sharedLibrary, sharedLibrarySearch, sharedLibraryNoResults)
);
localLibrarySearch.addEventListener('input', () =>
  applyLibrarySearch(localLibrarySearch, localLibrary, localLibraryNoResults)
);
localLibraryFilters.addEventListener('click', (event) =>
  handleLibraryFilter(event, localLibrary, localLibrarySearch, localLibraryNoResults)
);
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
uploadType.addEventListener('change', () => {
  selectedVideos = [];
  movieCovers.clear();
  resetSeasonRows();
  updateSelectedFiles();
  updateUploadCopy();
});
uploadDestination.addEventListener('change', updateUploadDestinationCopy);
uploadForm.addEventListener('submit', handleUpload);
sharedLibrary.addEventListener('click', handleCollectionAction);
localLibrary.addEventListener('click', handleCollectionAction);
updateUploadCopy();
resetSeasonRows();

document.getElementById('close-player').addEventListener('click', () => playerDialog.close());
document.getElementById('copy-player-link').addEventListener('click', () => {
  void copyPlaybackUrl();
});
playerDialog.addEventListener('close', () => {
  clearPlayerUrls();
  clearCoverObjectUrls(playerRecommendationsList);
  playerRecommendationsList.replaceChildren();
  playerRecommendations.hidden = true;
  clearPlaybackUrl();
  document.body.classList.remove('player-open');
});
playerDialog.addEventListener('click', (event) => {
  if (event.target === playerDialog) playerDialog.close();
});
seasonSelect.addEventListener('change', async () => {
  savePlaybackProgress(true);
  playbackResumeReady = false;
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
collectionSelect.addEventListener('change', async () => {
  const collection = currentCatalog.find((item) => item.id === collectionSelect.value);
  if (!collection) return;
  savePlaybackProgress(true);
  playbackResumeReady = false;
  currentCollection = collection;
  currentEpisodeIndex = 0;
  playerKind.textContent = collection.type === 'series' ? 'Série' : 'Film';
  fillEpisodeOptions();
  await showEpisode(0, true);
});
playbackSpeed.addEventListener('change', () => {
  videoPlayer.playbackRate = Number(playbackSpeed.value);
});
playPauseButton.addEventListener('click', async () => {
  if (videoPlayer.paused) {
    try {
      await videoPlayer.play();
    } catch (error) {
      if (!isPlaybackInterrupted(error)) {
        setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
      }
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
playerShell.addEventListener('keydown', showFullscreenControls);
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
videoPlayer.addEventListener('pause', () => {
  updatePlayPauseButton();
  savePlaybackProgress(true);
});
videoPlayer.addEventListener('timeupdate', updatePlayerProgress);
videoPlayer.addEventListener('timeupdate', () => savePlaybackProgress());
videoPlayer.addEventListener('loadedmetadata', restorePlaybackProgress);
videoPlayer.addEventListener('durationchange', updatePlayerProgress);
window.addEventListener('pagehide', () => savePlaybackProgress(true));
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
      if (!isPlaybackInterrupted(error)) {
        setMessage(playerMessage, `Lecture impossible : ${error.message}`, true);
      }
    }
  } else {
    videoPlayer.pause();
  }
});
videoPlayer.addEventListener('error', () => {
  if (videoPlayer.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    setMessage(playerMessage, 'Ce format vidéo ne peut pas être lu par le navigateur.', true);
  } else if (videoPlayer.error) {
    setMessage(
      playerMessage,
      'La vidéo n’a pas pu être chargée depuis le serveur. Vérifie la connexion et ton accès à la bibliothèque.',
      true
    );
  }
});

(async () => {
  playbackProgressReady = initializePlaybackProgress();
  const localQuotaPromise = updateLocalStorageQuota();
  await detectSuperadmin();
  const sharedLibraryPromise = loadSharedLibrary();
  try {
    await renderLocalLibrary(localQuotaPromise);
  } catch (error) {
    localStorageNote.textContent =
      `Bibliothèque IndexedDB indisponible : ${error.message} L’espace affiché est une estimation globale de ce site.`;
    localEmpty.textContent = `Le stockage local est indisponible : ${error.message}`;
    localEmpty.hidden = false;
  }
  await sharedLibraryPromise;
  try {
    await openPlaybackFromUrl();
  } catch (error) {
    showVideoToast(error.message, true);
  }
})();
