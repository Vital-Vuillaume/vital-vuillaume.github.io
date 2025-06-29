const info = document.querySelector(".info");
const logout = document.querySelector(".logout");

let userId = localStorage.getItem('user_id');

if (!userId) {
    SignInText();
} else {
    fetch(`https://${window.config.ipServer}/profile/${userId}`)
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            logout.textContent = "Log Out";
            const username = data.user.username;
            info.textContent = username;
            info.href = `${window.location.origin}/profile/#${username}`;
        } else {
            console.error("Erreur :", data);
            SignInText();
        }
    })
    .catch(error => {
        console.error("Fetch error:", error);
        SignInText();
    });
}

function SignInText() {
    logout.style.display = "none";
    info.textContent = "Login"; 
    info.href = `${window.location.origin}/login`;
}

logout.addEventListener('click', () => {
    localStorage.removeItem('user_id');
    location.reload();
});