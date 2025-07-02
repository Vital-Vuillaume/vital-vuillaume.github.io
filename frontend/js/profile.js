let hash = window.location.hash;
let texte = hash.substring(1);

  fetch(`https://${window.config.ipServer}/username/${texte}`)
    .then(res => {
      if (!res.ok) throw new Error("Utilisateur introuvable");
      return res.json();
    })
    .then(data => {
      console.log("ID de l'utilisateur :", data.user.username);

      // Par exemple, afficher son ID ou le rediriger vers une autre page
      document.querySelector(".username").textContent = data.user.username;
    })
    .catch(err => {
      console.error("Erreur récupération profil :", err);
    });

function NoUser() {
    
}

let linkAll = "Voici un exemple de texte beaucoup trop long";
linkTxt = linkAll.slice(0, 25);