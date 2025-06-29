let userId = localStorage.getItem('user_id');

if (!userId) {
  console.log("Pas connecté");
}

document.getElementById('sendBtn').addEventListener('click', () => {
  const date = document.getElementById('date').value;
  const hour = document.getElementById('time').value;
  const comment = document.getElementById('comment').value;

  if (!date || !hour) {
    alert('Veuillez remplir la date et l\'heure.');
  } else {
    fetch(`https://${window.config.ipServer}/rdv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, hour, comment })
    })
    .then(res => res.json())
    .then(() => {
      document.getElementById('rdv-form').reset();
      afficherRdv();
    })
    .catch(err => {
      alert('Erreur lors de l\'envoi du rendez-vous.');
      console.error(err);
    });
  }
});

function afficherRdv() {
  fetch(`https://${window.config.ipServer}/rdv/${userId}`)
    .then(res => res.json())
    .then(rdvList => {
      const container = document.getElementById('rdv-list');
      container.innerHTML = '';

      if (rdvList.length === 0) {
        container.textContent = 'Aucun rendez-vous trouvé.';
        return;
      }

      rdvList.forEach(rdv => {
        const div = document.createElement('div');
        div.classList.add('rdv-item');

        div.innerHTML = `
          <label>Date: <input type="date" value="${rdv.date}" data-id="${rdv.id}" data-field="date" /></label>
          <label>Heure: <input type="time" value="${rdv.hour}" data-id="${rdv.id}" data-field="hour" /></label>
          <label>Commentaire: <textarea data-id="${rdv.id}" data-field="comment">${rdv.comment}</textarea></label>
          <label>Etat: <span>${rdv.etat}</span></label>
          <button class="update-btn" data-id="${rdv.id}">Modifier</button>
          <button class="delete-btn" data-id="${rdv.id}">Supprimer</button>
        `;

        container.appendChild(div);
      });

      document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const parent = btn.parentElement;
          const date = parent.querySelector('input[data-field="date"]').value;
          const hour = parent.querySelector('input[data-field="hour"]').value;
          const comment = parent.querySelector('textarea[data-field="comment"]').value;

            if (confirm("Modifiez ce rendez-vous ?")) {
                fetch(`https://${window.config.ipServer}/rdv/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, hour, comment })
                })
                .then(res => res.json())
                .then(() => afficherRdv())
                .catch(err => console.error(err));
            }
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (confirm("Supprimer ce rendez-vous ?")) {
            fetch(`https://${window.config.ipServer}/rdv/${id}`, {
              method: 'DELETE'
            })
            .then(res => res.json())
            .then(() => afficherRdv())
            .catch(err => console.error(err));
          }
        });
      });
    })
    .catch(err => console.error(err));
}

afficherRdv();