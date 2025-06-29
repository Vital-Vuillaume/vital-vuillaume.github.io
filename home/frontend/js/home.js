let userId = localStorage.getItem('user_id');

if (!userId) {
}

const infos = document.querySelectorAll(".info");

fetch(`https://${window.config.ipServer}/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    if (data.success) {
        for (let i = 0; i < data.user.length; i++) {
            infos[i].textContent += data.user[i];
        }
    } else {
      console.error("Erreur :", data);
    }
  })
  .catch(error => {
    console.error("Fetch error:", error);
});