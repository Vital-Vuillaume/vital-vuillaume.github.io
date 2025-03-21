function Login() {
    const password = document.getElementById('password').value;

    fetch(`https://${window.config.ipServer}/server/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({password: password }),
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = "https://vital-vuillaume.github.io/server/";
      }
  })
};