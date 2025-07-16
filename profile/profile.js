const error = document.querySelector(".error");
const content = document.querySelector(".content")
const notFound = document.querySelector(".notFound");
const inputSearch = document.querySelector(".inputSearch");
const searchBtn = document.querySelector(".searchBtn");



window.addEventListener('hashchange', () => {
  location.reload();
});

let userLocation = window.location.hash.substring(1);

inputSearch.value = userLocation;

if (window.location.hash == "") {
  NoUser();
  notFound.style.display = "none"; 
} else {
  getUserInfo().then(username => {
      if (username == userLocation) {
        fetch(`https://${window.config.ipServer}/profile/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.querySelector(".username").textContent = `${data.user.username} et ${data.user.id}`;
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            SignInText();
        });
      } else {
        fetch(`https://${window.config.ipServer}/username/${userLocation}`)
      .then(res => {
        if (!res.ok) {
          NoUser()
          throw new Error("Utilisateur introuvable");
        } else {
          return res.json();
        }
      })
      .then(data => {
        document.querySelector(".username").textContent = data.user.username;
      })
      .catch(err => {
        console.error("Erreur récupération profil :", err);
        NoUser()
      });
      }
  });
}
  
function NoUser() {
  error.style.display = "block";
  content.style.display = "none";
  notFound.textContent = `The user "${userLocation}" was not found.`;
}

searchBtn.addEventListener('click', () => {
  Search();
});

inputSearch.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    Search();
  }
});

function Search() {
  const inputValue = inputSearch.value.trim();
  
  if (inputValue) {
    window.location.hash = inputValue;  
  }
}

let linkAll = "Voici un exemple de texte beaucoup trop long";
linkTxt = linkAll.slice(0, 25);