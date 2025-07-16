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




const props = ["background", "color"];

let size = false;

let resizeTextarea;


const savedText = JSON.parse(localStorage.getItem("txt"));

if (savedText) {
  writeTxt.value = savedText.text;
  fileTxt.value = savedText.fileName;
}

function saveText() {
  localStorage.setItem("txt", JSON.stringify({
    text: writeTxt.value,
    fileName: fileTxt.value,
  }));
}


const saved = JSON.parse(localStorage.getItem("modify"));

if (saved) {
  writeTxt.style.background = saved.background || "";
  writeTxt.style.color = saved.color || "";
  writeTxt.style.fontSize = saved.fontSize || "";
  size = saved.resize || false;
}

function saveStyles() {
  localStorage.setItem("modify", JSON.stringify({
    background: writeTxt.style.background,
    color: writeTxt.style.color,
    fontSize: writeTxt.style.fontSize,
    resize: size,
  }));
}


Param()
SizeMode();

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
  localStorage.removeItem("modify");
  location.reload();
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