function submitLogin() {
    const password = document.getElementById('password').value;
   
    fetch('/server/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: password }),
    credentials: 'include'
    })
    .then(response => {
    window.location.href = response.url;
    });
}