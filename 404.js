const backButton = document.getElementById('back-button');
const backStatus = document.getElementById('back-status');

backButton.addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  backStatus.textContent = 'Aucune page précédente. Utilise le bouton d’accueil.';
});
