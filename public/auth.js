const toast = document.getElementById("toast");
const params = new URLSearchParams(window.location.search);
const token = localStorage.getItem("skillswapToken");

if (token) {
  window.location.replace("/app?view=overview");
}

const showToast = (message, isError = false) => {
  toast.textContent = message;
  toast.style.background = isError ? "#b33a3a" : "#1f2933";
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2600);
};

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
};

const nextView = params.get("next") || "overview";
const nextQuery = params.get("q") || "";
const destination = `/app?view=${encodeURIComponent(nextView)}${nextQuery ? `&q=${encodeURIComponent(nextQuery)}` : ""}`;

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("login-email").value,
          password: document.getElementById("login-password").value
        })
      });
      localStorage.setItem("skillswapToken", data.token);
      window.location.href = destination;
    } catch (error) {
      showToast(error.message, true);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("register-name").value,
          email: document.getElementById("register-email").value,
          password: document.getElementById("register-password").value
        })
      });
      localStorage.setItem("skillswapToken", data.token);
      window.location.href = "/app?view=overview";
    } catch (error) {
      showToast(error.message, true);
    }
  });
}
