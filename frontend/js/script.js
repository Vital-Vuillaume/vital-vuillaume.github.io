const titleNav = document.querySelector(".titleNav");

let titleSite = window.location.hostname;

if (titleSite.includes('.')) {
  titleSite = titleSite.substring(0, titleSite.lastIndexOf('.'));
}

titleNav.textContent = titleSite;


const infoPage = document.querySelector(".infoPage");

const titlePage = window.location.pathname.replace(/^\/|\/$/g, '');

infoPage.textContent = titlePage;
document.title = `${titleSite} ${titlePage}`;


const production = document.querySelector(".production");

production.textContent = `ⓒ ${new Date().getFullYear()} - Vital production`;