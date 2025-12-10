const input = document.getElementById('ai-input');
const button = document.getElementById('send-btn');

input.focus();

function sendMessage() {
    const message = input.value.trim();
    if (message === "") {
        return;
    }

    fetch(`https://${window.config.ipServer}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Réponse serveur :", data);
        input.value = '';
        input.focus();
    })
    .catch(error => console.error("Erreur serveur :", error));
}

button.addEventListener('click', sendMessage);

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});