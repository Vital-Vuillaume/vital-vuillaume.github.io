document.getElementById('insertForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const mdp = document.getElementById('mdp').value;

fetch(`https://${window.config.ipServer}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, mdp})
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('user_id', data.userId);
      alert("Connecté en tant que " + data.username);
    } else {
      alert("Échec de connexion");
    }
  })
  .catch(err => console.error("Erreur :", err));

});
