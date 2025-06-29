const titleNav = document.querySelector(".titleNav");

const titleSite = window.location.hostname;

titleNav.textContent = titleSite;


const infoPage = document.querySelector(".infoPage");

const titlePage = window.location.pathname.replace(/^\/|\/$/g, '');

infoPage.textContent = titlePage;
document.title = `${titleSite} ${titlePage}`;


const production = document.querySelector(".production");

production.textContent = `ⓒ ${new Date().getFullYear()} - Vital production`;