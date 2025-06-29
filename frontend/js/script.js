const logoBlock = document.querySelector(".logoBlock");

logoBlock.addEventListener('click', () => {
    window.location.href = window.location.origin;
});


const titleNav = document.querySelector(".titleNav");

let titleSite = window.location.hostname;

if (titleSite.includes('.')) {
  titleSite = titleSite.substring(0, titleSite.indexOf('.'));
}

titleNav.textContent = titleSite;


const infoPage = document.querySelector(".infoPage");

const titlePage = window.location.pathname.replace(/^\/|\/$/g, '');

infoPage.textContent = titlePage;
document.title = `${titleSite} ${titlePage}`;


const production = document.querySelector(".production");

production.textContent = `ⓒ ${new Date().getFullYear()} - Vital production`;