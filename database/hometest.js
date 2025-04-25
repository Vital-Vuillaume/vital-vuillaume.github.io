function fetchUser() {
    fetch(`https://${window.config.ipServer}/getUser`, {
        method: 'GET',
        credentials: 'include', // Important pour envoyer les cookies de session au serveur
    })
    .then(response => {
        if (response.ok) {
            return response.json(); // Récupère les données si connecté
        } else {
            throw new Error("Non connecté"); // Provoque une erreur
        }
    })
    .then(data => {
        document.getElementById('welcome-message').innerText = `Bienvenue, ${data.username} !`;
    })
}


    fetchUser();