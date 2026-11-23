const btnColor = document.querySelectorAll(".btnColor");
const btnFontMore = document.querySelector(".btnFontMore");
const btnFontLess = document.querySelector(".btnFontLess");
const btnSize = document.querySelector(".btnSize");
const btnReset = document.querySelector(".btnReset");

const colorInput = document.querySelectorAll(".colorInput");
const openFile = document.getElementById('fileInput');

const writeBlock = document.querySelector(".blockWrite");
const writeTxt = document.querySelector(".write");

const nav = document.querySelector(".nav");
const footer = document.querySelector(".footer");
const description = document.querySelector(".description");

const words = document.querySelector(".words");
const caractere = document.querySelector(".caractere");
const btnRead = document.querySelector(".btnRead");
const btnOpen = document.querySelector(".btnOpen");
const btnSave = document.querySelector(".btnSave");

const fileTxt = document.querySelector(".fileTxt");
const noteSyncStatus = document.getElementById("note-sync-status");
const props = ["background", "color"];

let size = false;
let resizeTextarea;
let noteSaveTimer;
let styleSaveTimer;
let noteSaveQueue = Promise.resolve();

function readLocalData(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Impossible de lire la donnée locale ${key} :`, error);
    return null;
  }
}

let savedText = readLocalData("txt");
let saved = readLocalData("modify");

function showNoteSyncError(error) {
  noteSyncStatus.textContent = `Synchronisation du compte impossible : ${error.message}. Les modifications restent enregistrées localement.`;
  noteSyncStatus.hidden = false;
}

function saveLocalDraft(key, value) {
  const localKey = key === "notes" ? "txt" : "modify";
  try {
    localStorage.setItem(localKey, JSON.stringify(value));
  } catch (error) {
    console.error("Impossible d’enregistrer le brouillon local :", error);
    noteSyncStatus.textContent = "Le brouillon local n’a pas pu être enregistré; la synchronisation du compte va être tentée.";
    noteSyncStatus.hidden = false;
  }
}

function saveAccountData(key, value) {
  noteSaveQueue = noteSaveQueue
    .catch(() => {})
    .then(() => window.VitaLoadPanelData.save(key, value))
    .then(() => {
      const localKey = key === "notes" ? "txt" : "modify";
      if (localStorage.getItem(localKey) === JSON.stringify(value)) {
        localStorage.removeItem(localKey);
      }
    })
    .catch((error) => {
      showNoteSyncError(error);
      if (key === "notes") {
        localStorage.setItem("txt", JSON.stringify(value));
      } else if (key === "noteAppearance") {
        localStorage.setItem("modify", JSON.stringify(value));
      }
      throw error;
    });
  return noteSaveQueue;
}

function saveText() {
  const value = { text: writeTxt.value, fileName: fileTxt.value };
  if (!window.VitaLoadPanelAuth.getSessionId()) {
    localStorage.setItem("txt", JSON.stringify(value));
    return;
  }
  saveLocalDraft("notes", value);
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => {
    void saveAccountData("notes", value).catch(() => {});
  }, 450);
}

function saveStyles() {
  const value = {
    background: writeTxt.style.background,
    color: writeTxt.style.color,
    fontSize: writeTxt.style.fontSize,
    resize: size,
  };
  if (!window.VitaLoadPanelAuth.getSessionId()) {
    localStorage.setItem("modify", JSON.stringify(value));
    return;
  }
  saveLocalDraft("noteAppearance", value);
  clearTimeout(styleSaveTimer);
  styleSaveTimer = setTimeout(() => {
    void saveAccountData("noteAppearance", value).catch(() => {});
  }, 150);
}

async function initializeNoteData() {
  const isSignedIn = Boolean(window.VitaLoadPanelAuth?.getSessionId());
  if (isSignedIn) writeBlock.inert = true;
  try {
    if (isSignedIn) {
      try {
        const localEntries = {};
        if (savedText && typeof savedText.text === "string" && typeof savedText.fileName === "string") {
          localEntries.notes = { value: savedText, localStorageKey: "txt" };
        }
        if (saved && typeof saved === "object") {
          localEntries.noteAppearance = { value: saved, localStorageKey: "modify" };
        }
        const accountData = await window.VitaLoadPanelData.loadAndMigrate(localEntries);
        if (accountData?.notes) savedText = accountData.notes;
        if (accountData?.noteAppearance) saved = accountData.noteAppearance;
      } catch (error) {
        showNoteSyncError(error);
        console.error("Impossible de charger les données de notes du compte :", error);
      }
    }
    if (savedText) {
      writeTxt.value = savedText.text;
      fileTxt.value = savedText.fileName;
    }
    if (saved) {
      writeTxt.style.background = saved.background || "";
      writeTxt.style.color = saved.color || "";
      writeTxt.style.fontSize = saved.fontSize || "";
      size = saved.resize || false;
    }
    Param();
    SizeMode();
  } finally {
    if (isSignedIn) writeBlock.inert = false;
  }
}

void initializeNoteData();

function SizeMode() {
  if (size) {
    writeBlock.classList.add("active");
    writeTxt.style.height = "auto";
    writeTxt.style.overflow = "hidden";

    if (!resizeTextarea) {
      resizeTextarea = () => {
        writeTxt.style.height = "auto";
        writeTxt.style.height = writeTxt.scrollHeight + "px";
      };
    }

    writeTxt.addEventListener("input", resizeTextarea);
    resizeTextarea();

    description.style.visibility = "hidden";
    footer.style.visibility = "hidden";
    nav.style.visibility = "hidden";

    btnSize.src = "./images/screenLess.png";
  } else {
    writeBlock.classList.remove("active");
    writeTxt.style.height = "1100px";
    writeTxt.style.overflow = "";

    if (resizeTextarea) {
      writeTxt.removeEventListener("input", resizeTextarea);
    }

    description.style.visibility = "visible";
    footer.style.visibility = "visible";
    nav.style.visibility = "visible";

    btnSize.src = "./images/screenMore.png";
  }
}

btnColor.forEach((btn, i) => {
  btn.onclick = () => colorInput[i].click();

  colorInput[i].onchange = () => {
    const value = colorInput[i].value;
    writeTxt.style[props[i]] = value;
    saveStyles();
  };
});

btnFontMore.onclick = () => {
  writeTxt.style.fontSize = parseInt(window.getComputedStyle(writeTxt).fontSize) + 10 + "px";
  saveStyles();
};

btnFontLess.onclick = () => {
  writeTxt.style.fontSize = parseInt(window.getComputedStyle(writeTxt).fontSize) - 10 + "px";
  saveStyles();
};

btnSize.onclick = () => {
  size = !size;
  SizeMode();
  saveStyles();
};

btnReset.onclick = () => {
  if (!window.VitaLoadPanelAuth.getSessionId()) {
    localStorage.removeItem("modify");
    location.reload();
    return;
  }
  clearTimeout(styleSaveTimer);
  void noteSaveQueue
    .catch(() => {})
    .then(() => window.VitaLoadPanelData.save("noteAppearance", null))
    .then(() => {
      localStorage.removeItem("modify");
      location.reload();
    })
    .catch(showNoteSyncError);
}

writeTxt.addEventListener("input", () => {
  saveText();
  Param();
});

fileTxt.addEventListener("input", () => {
  saveText();
});

function Param() {
  let txt = writeTxt.value.trim();
  let mots = 0;

  if (txt !== "") {
    mots = txt.split(/\s+/).length;
  } else {
    mots = 0;
  }

  words.textContent = `Words : ${mots}`;
  caractere.textContent = `Characters : ${writeTxt.value.length}`
}

btnRead.onclick = () => {
  let url;

  if (writeTxt.value.length > 0) {
    url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${writeTxt.value}&tl=fr&client=tw-ob`;
  } else {
    url = `https://translate.google.com/translate_tts?ie=UTF-8&q="Pas de Texte"&tl=fr&client=tw-ob`;
  }

  const audio = new Audio(url);

  audio.onerror = () => {
    alert("Ne fonctionne pas, réessayez plus tard.");
  };

  audio.play();
}

btnOpen.onclick = () => {
  openFile.click();

  openFile.addEventListener('change', () => {
    const fichier = openFile.files[0];
    
    if (fichier) {
      fileTxt.value = fichier.name;
      const lecteur = new FileReader();
      lecteur.onload = function(e) {
        writeTxt.value = e.target.result;
        saveText();
        Param();
      };
      lecteur.readAsText(fichier);
    } 
  });
}

btnSave.onclick = () => {
  const blob = new Blob([writeTxt.value]);

  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = fileTxt.value || "file"; 
  lien.click();

  URL.revokeObjectURL(lien.href);
};