document.getElementById('insertForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const mdp = document.getElementById('mdp').value;

    fetch(`https://${window.config.ipServer}/connectTest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, mdp: mdp })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = "/database/home.html";
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });