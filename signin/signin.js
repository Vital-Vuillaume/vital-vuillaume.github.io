document.getElementById('insertForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const mdp = document.getElementById('mdp').value;

  fetch(`https://${window.config.ipServer}/insertData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, mdp })
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(err => { throw new Error(err); });
    }
    return response.json();
  })
  .then(data => {
    localStorage.setItem('user_id', data.userId);
    console.log('Utilisateur créé. ID stocké dans localStorage :', data.userId);
  })
  .catch(error => {
    console.error('Erreur :', error.message);
    alert("Erreur lors de la création de l'utilisateur : " + error.message);
  });
});