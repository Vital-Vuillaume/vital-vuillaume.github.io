function Connection() {
    fetch(`https://${window.config.ipServer}/server/connect`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    .then(response => {
      if (response.headers.get("content-type").includes("text/html")) {
        return response.text();
      } else {
        return response.json();
      }
    })
    .then(data => {
      if (typeof data === "string") {
        document.documentElement.innerHTML = data;
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          document.body.appendChild(newScript);
        });
      } else if (!data.connected) {
        window.location.href = "/server/login.html";
      }
    });
  }

  Connection();