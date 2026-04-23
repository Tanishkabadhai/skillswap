const state = {
  token: localStorage.getItem("skillswapToken") || "",
  user: null,
  categories: [],
  activeDashboardTab: "incoming",
  activeRequestId: null,
  activeView: "overview",
  dashboardData: { incoming: [], outgoing: [], accepted: [] }
};

const resourceLibrary = [
  {
    category: "Programming",
    title: "Python and Web Development",
    summary: "Use these references to learn syntax, frameworks, and project-based development.",
    links: [
      { label: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/" },
      { label: "MDN Web Docs", url: "https://developer.mozilla.org/" },
      { label: "freeCodeCamp", url: "https://www.freecodecamp.org/" }
    ]
  },
  {
    category: "Design",
    title: "UI, UX, and Visual Thinking",
    summary: "Starter material for interface design, layout, and accessibility thinking.",
    links: [
      { label: "Nielsen Norman Group", url: "https://www.nngroup.com/" },
      { label: "Material Design", url: "https://m3.material.io/" },
      { label: "Figma Learn", url: "https://help.figma.com/hc/en-us/categories/360002051613" }
    ]
  },
  {
    category: "Languages",
    title: "Language Learning Resources",
    summary: "Helpful references for vocabulary, grammar, and speaking practice.",
    links: [
      { label: "Duolingo Blog", url: "https://blog.duolingo.com/" },
      { label: "BBC Languages Archive", url: "https://www.bbc.co.uk/languages/" },
      { label: "Cambridge English", url: "https://www.cambridgeenglish.org/learning-english/" }
    ]
  },
  {
    category: "Music",
    title: "Guitar, Singing, and Practice",
    summary: "Resources to support beginner-to-intermediate music learners and peer mentors.",
    links: [
      { label: "JustinGuitar", url: "https://www.justinguitar.com/" },
      { label: "musictheory.net", url: "https://www.musictheory.net/" },
      { label: "Yousician Blog", url: "https://yousician.com/blog" }
    ]
  },
  {
    category: "Academics",
    title: "Study Support and Fundamentals",
    summary: "Useful references for math, science, and self-paced student revision.",
    links: [
      { label: "Khan Academy", url: "https://www.khanacademy.org/" },
      { label: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" },
      { label: "Coursera Catalog", url: "https://www.coursera.org/" }
    ]
  }
];

const ui = {
  authSection: document.getElementById("auth-section"),
  dashboardSection: document.getElementById("dashboard-section"),
  adminPanel: document.getElementById("admin-panel"),
  adminNavLink: document.getElementById("admin-nav-link"),
  logoutBtn: document.getElementById("logout-btn"),
  navDashboard: document.getElementById("nav-dashboard"),
  toast: document.getElementById("toast"),
  searchCategory: document.getElementById("search-category"),
  skillCategory: document.getElementById("skill-category"),
  dashboardLists: document.getElementById("dashboard-lists"),
  skillResults: document.getElementById("skill-results"),
  mySkills: document.getElementById("my-skills"),
  messagesList: document.getElementById("messages-list"),
  adminStats: document.getElementById("admin-stats"),
  adminUsers: document.getElementById("admin-users"),
  adminReports: document.getElementById("admin-reports"),
  overviewStats: document.getElementById("overview-stats"),
  userIdentity: document.getElementById("user-identity"),
  resourcePreview: document.getElementById("resource-preview"),
  resourceLibrary: document.getElementById("resource-library"),
  workspaceLinks: document.querySelectorAll(".workspace-link"),
  workspaceViews: document.querySelectorAll(".workspace-view")
};

const api = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: "The server returned an unexpected response." };

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
};

const showToast = (message, isError = false) => {
  ui.toast.textContent = message;
  ui.toast.style.background = isError ? "#b33a3a" : "#1f2933";
  ui.toast.classList.remove("hidden");
  setTimeout(() => ui.toast.classList.add("hidden"), 2600);
};

const showWorkspaceView = (viewName) => {
  state.activeView = viewName;
  ui.workspaceLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  ui.workspaceViews.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === viewName);
  });
};

const setAuthState = (loggedIn) => {
  ui.authSection.classList.toggle("hidden", loggedIn);
  ui.dashboardSection.classList.toggle("hidden", !loggedIn);
  ui.logoutBtn.classList.toggle("hidden", !loggedIn);
  ui.navDashboard.classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    showWorkspaceView(state.activeView);
  }
};

const optionMarkup = (categories) =>
  [`<option value="">All categories</option>`]
    .concat(categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`))
    .join("");

const renderResources = () => {
  const toCard = (resource) => `
    <article class="card resource-card">
      <span class="resource-tag">${resource.category}</span>
      <strong>${resource.title}</strong>
      <p>${resource.summary}</p>
      <div class="resource-links">
        ${resource.links
          .map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
          .join("")}
      </div>
    </article>
  `;

  ui.resourcePreview.innerHTML = resourceLibrary.slice(0, 3).map(toCard).join("");
  ui.resourceLibrary.innerHTML = resourceLibrary.map(toCard).join("");
};

const renderIdentity = () => {
  if (!state.user) {
    ui.userIdentity.innerHTML = "";
    return;
  }

  ui.userIdentity.innerHTML = `
    <span class="identity-chip">Your user ID: ${state.user.id}</span>
    <span class="identity-chip">${state.user.name}</span>
    <span class="identity-chip">${state.user.email}</span>
  `;
};

const renderSkills = (skills) => {
  ui.skillResults.innerHTML = skills.length
    ? skills
        .map(
          (skill) => `
            <article class="list-card">
              <strong>${skill.title}</strong>
              <div class="list-meta">${skill.category_name} - ${skill.level}</div>
              <p>${skill.description || "No description provided."}</p>
              <div class="list-meta">Teacher: ${skill.teacher_name} - Teacher ID: ${skill.user_id} - Rating: ${skill.teacher_rating}</div>
              <div class="list-actions">
                <button class="primary-btn" onclick="sendRequest(${skill.user_id}, ${skill.id})">Request exchange</button>
              </div>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No skills found yet.</p>`;
};

const renderMySkills = (skills) => {
  ui.mySkills.innerHTML = skills.length
    ? skills
        .map(
          (skill) => `
            <article class="list-card">
              <strong>${skill.title} (#${skill.id})</strong>
              <div class="list-meta">${skill.category_name} - ${skill.level}</div>
              <p>${skill.description || "No description provided."}</p>
              <div class="list-actions">
                <button class="ghost-btn" onclick="deleteSkill(${skill.id})">Delete</button>
              </div>
            </article>`
        )
        .join("")
    : `<p class="list-meta">You have not added any skills yet.</p>`;
};

const renderDashboard = (dashboard) => {
  const entries = dashboard[state.activeDashboardTab] || [];
  ui.dashboardLists.innerHTML = entries.length
    ? entries
        .map((item) => {
          const isIncoming = state.activeDashboardTab === "incoming" && item.status === "pending";
          const isAccepted = state.activeDashboardTab === "accepted" && item.status === "accepted";
          return `
            <article class="list-card">
              <strong>Request #${item.id} - ${item.skill_title}</strong>
              <div class="list-meta">${item.sender_name || item.receiver_name || ""}</div>
              <p>${item.note || "No note added."}</p>
              <span class="status-pill">${item.status}</span>
              <div class="list-actions">
                ${isIncoming ? `<button class="primary-btn" onclick="respondRequest(${item.id}, 'accepted')">Accept</button>
                <button class="ghost-btn" onclick="respondRequest(${item.id}, 'rejected')">Reject</button>` : ""}
                ${isAccepted ? `<button class="ghost-btn" onclick="markComplete(${item.id})">Mark complete</button>` : ""}
                <button class="ghost-btn" onclick="loadMessages(${item.id})">Open messages</button>
              </div>
            </article>`;
        })
        .join("")
    : `<p class="list-meta">No items in this view.</p>`;
};

const renderOverview = () => {
  const stats = [
    { label: "Skills listed", value: ui.mySkills.querySelectorAll(".list-card").length },
    { label: "Incoming requests", value: state.dashboardData.incoming.length },
    { label: "Outgoing requests", value: state.dashboardData.outgoing.length },
    { label: "Accepted exchanges", value: state.dashboardData.accepted.length }
  ];

  ui.overviewStats.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat-card">
          <strong>${stat.value}</strong>
          <div>${stat.label}</div>
        </div>`
    )
    .join("");
};

const renderMessages = (messages) => {
  ui.messagesList.innerHTML = messages.length
    ? messages
        .map(
          (message) => `
            <div class="message-bubble">
              <strong>${message.sender_name}</strong>
              <p>${message.message}</p>
              <div class="list-meta">${new Date(message.created_at).toLocaleString()}</div>
            </div>`
        )
        .join("")
    : `<p class="list-meta">No messages yet for this exchange.</p>`;
};

const renderAdminStats = (stats) => {
  ui.adminStats.innerHTML = `
    <div class="stat-card"><strong>${stats.users}</strong><div>Users</div></div>
    <div class="stat-card"><strong>${stats.skills}</strong><div>Skills</div></div>
    <div class="stat-card"><strong>${stats.requests}</strong><div>Requests</div></div>
    <div class="stat-card"><strong>${stats.openReports}</strong><div>Open reports</div></div>
  `;
};

const renderAdminUsers = (users) => {
  ui.adminUsers.innerHTML = users
    .map(
      (user) => `
        <article class="list-card">
          <strong>${user.name} (#${user.id})</strong>
          <div class="list-meta">${user.email} - ${user.role} - ${user.is_active ? "active" : "disabled"}</div>
          <div class="list-meta">Location: ${user.location || "N/A"} - Rating: ${user.average_rating}</div>
          <div class="list-actions">
            <button class="ghost-btn" onclick="toggleUserStatus(${user.id}, ${user.is_active ? "false" : "true"})">
              ${user.is_active ? "Disable" : "Enable"}
            </button>
          </div>
        </article>`
    )
    .join("");
};

const renderAdminReports = (reports) => {
  ui.adminReports.innerHTML = reports
    .map(
      (report) => `
        <article class="list-card">
          <strong>Report #${report.id}</strong>
          <div class="list-meta">${report.reporter_name} reported ${report.reported_name}</div>
          <p>${report.reason}</p>
          <div class="list-meta">${report.details || "No details."}</div>
          <div class="list-actions">
            <button class="ghost-btn" onclick="updateReport(${report.id}, 'reviewed')">Mark reviewed</button>
            <button class="primary-btn" onclick="updateReport(${report.id}, 'resolved')">Resolve</button>
          </div>
        </article>`
    )
    .join("");
};

const populateCategories = (categories) => {
  ui.searchCategory.innerHTML = optionMarkup(categories);
  ui.skillCategory.innerHTML = categories
    .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");
};

const fetchCategories = async () => {
  const data = await api("/api/categories");
  state.categories = data.categories;
  populateCategories(data.categories);
};

const loadProfile = async () => {
  const data = await api("/api/profile/me");
  const profile = data.profile || {};
  document.getElementById("profile-name").value = profile.name || "";
  document.getElementById("profile-location").value = profile.location || "";
  document.getElementById("profile-availability").value = profile.availability || "";
  document.getElementById("profile-avatar").value = profile.avatar_url || "";
  document.getElementById("profile-bio").value = profile.bio || "";
};

const loadSkills = async () => {
  const searchKeyword = document.getElementById("search-keyword").value.trim();
  const categoryId = ui.searchCategory.value;
  const params = new URLSearchParams();
  if (searchKeyword) params.append("q", searchKeyword);
  if (categoryId) params.append("categoryId", categoryId);
  const data = await api(`/api/skills?${params.toString()}`);
  renderSkills(data.skills);
};

const loadMySkills = async () => {
  const data = await api("/api/skills/mine");
  renderMySkills(data.skills);
  renderOverview();
};

const loadDashboard = async () => {
  const data = await api("/api/requests/dashboard");
  state.dashboardData = data.dashboard;
  renderDashboard(data.dashboard);
  renderOverview();
};

const loadMessages = async (requestId) => {
  if (!requestId) {
    throw new Error("A valid exchange request ID is required.");
  }

  state.activeRequestId = requestId;
  document.getElementById("message-request-id").value = requestId;
  const data = await api(`/api/messages/${requestId}`);
  renderMessages(data.messages);
  showWorkspaceView("messages");
};

const loadAdmin = async () => {
  if (!state.user || state.user.role !== "admin") return;
  const [stats, users, reports] = await Promise.all([
    api("/api/admin/stats"),
    api("/api/admin/users"),
    api("/api/admin/reports")
  ]);
  renderAdminStats(stats.stats);
  renderAdminUsers(users.users);
  renderAdminReports(reports.reports);
};

const bootstrap = async () => {
  try {
    await fetchCategories();
    if (!state.token) {
      setAuthState(false);
      return;
    }

    const me = await api("/api/auth/me");
    state.user = me.user;
    renderIdentity();
    setAuthState(true);
    ui.adminPanel.classList.toggle("hidden", state.user.role !== "admin");
    ui.adminNavLink.classList.toggle("hidden", state.user.role !== "admin");
    await Promise.all([loadProfile(), loadMySkills(), loadSkills(), loadDashboard(), loadAdmin()]);
  } catch (error) {
    console.error("SkillSwap bootstrap failed:", error);
    localStorage.removeItem("skillswapToken");
    state.token = "";
    state.user = null;
    setAuthState(false);
    ui.adminNavLink.classList.add("hidden");
    showToast(error.message || "Login worked, but the dashboard could not load.", true);
  }
};

document.getElementById("register-form").addEventListener("submit", async (event) => {
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
    state.token = data.token;
    showToast("Account created successfully.");
    await bootstrap();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
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
    state.token = data.token;
    showToast("Logged in successfully.");
    await bootstrap();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/profile/me", {
      method: "PUT",
      body: JSON.stringify({
        name: document.getElementById("profile-name").value,
        location: document.getElementById("profile-location").value,
        availability: document.getElementById("profile-availability").value,
        avatarUrl: document.getElementById("profile-avatar").value,
        bio: document.getElementById("profile-bio").value
      })
    });
    showToast("Profile updated.");
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("skill-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/skills", {
      method: "POST",
      body: JSON.stringify({
        title: document.getElementById("skill-title").value,
        categoryId: document.getElementById("skill-category").value,
        level: document.getElementById("skill-level").value,
        description: document.getElementById("skill-description").value
      })
    });
    event.target.reset();
    populateCategories(state.categories);
    showToast("Skill added.");
    await Promise.all([loadMySkills(), loadSkills()]);
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("search-btn").addEventListener("click", async () => {
  try {
    await loadSkills();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.activeDashboardTab = button.dataset.tab;
    renderDashboard(state.dashboardData);
  });
});

ui.workspaceLinks.forEach((button) => {
  button.addEventListener("click", () => {
    showWorkspaceView(button.dataset.view);
  });
});

document.getElementById("message-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const requestId = state.activeRequestId || document.getElementById("message-request-id").value;
    if (!requestId) {
      throw new Error("Select or enter a request ID before sending a message.");
    }
    await api(`/api/messages/${requestId}`, {
      method: "POST",
      body: JSON.stringify({ message: document.getElementById("message-text").value })
    });
    document.getElementById("message-text").value = "";
    await loadMessages(requestId);
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("load-messages-btn").addEventListener("click", async () => {
  const requestId = document.getElementById("message-request-id").value;
  if (!requestId) {
    showToast("Enter a request ID.", true);
    return;
  }
  try {
    await loadMessages(requestId);
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("rating-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/ratings", {
      method: "POST",
      body: JSON.stringify({
        requestId: document.getElementById("rating-request-id").value,
        ratedUserId: document.getElementById("rating-user-id").value,
        score: document.getElementById("rating-score").value,
        feedback: document.getElementById("rating-feedback").value
      })
    });
    showToast("Rating submitted.");
    event.target.reset();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("report-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        reportedUserId: document.getElementById("report-user-id").value,
        reason: document.getElementById("report-reason").value,
        details: document.getElementById("report-details").value
      })
    });
    showToast("Report submitted.");
    event.target.reset();
    await loadAdmin();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("skillswapToken");
  state.token = "";
  state.user = null;
  state.activeView = "overview";
  state.activeRequestId = null;
  state.dashboardData = { incoming: [], outgoing: [], accepted: [] };
  ui.userIdentity.innerHTML = "";
  setAuthState(false);
  ui.adminPanel.classList.add("hidden");
  ui.adminNavLink.classList.add("hidden");
  showToast("Logged out.");
});

document.getElementById("nav-home").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("jump-to-auth").addEventListener("click", () => {
  if (state.token) {
    showWorkspaceView("overview");
    ui.dashboardSection.scrollIntoView({ behavior: "smooth" });
  } else {
    document.getElementById("auth-section").scrollIntoView({ behavior: "smooth" });
  }
});

document.getElementById("nav-dashboard").addEventListener("click", () => {
  showWorkspaceView("overview");
  ui.dashboardSection.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("jump-to-library").addEventListener("click", () => {
  if (state.token) {
    showWorkspaceView("library");
    ui.dashboardSection.scrollIntoView({ behavior: "smooth" });
  } else {
    document.getElementById("auth-section").scrollIntoView({ behavior: "smooth" });
  }
});

document.getElementById("admin-refresh-btn").addEventListener("click", async () => {
  try {
    await loadAdmin();
    showToast("Admin data refreshed.");
  } catch (error) {
    showToast(error.message, true);
  }
});

window.sendRequest = async (receiverId, skillId) => {
  const message = window.prompt("Add a short exchange note:");
  if (message === null) return;
  try {
    await api("/api/requests", {
      method: "POST",
      body: JSON.stringify({ receiverId, skillId, message })
    });
    showToast("Request sent.");
    showWorkspaceView("requests");
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.respondRequest = async (requestId, action) => {
  try {
    await api(`/api/requests/${requestId}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ action })
    });
    showToast(`Request ${action}.`);
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.markComplete = async (requestId) => {
  try {
    await api(`/api/requests/${requestId}/complete`, {
      method: "PATCH"
    });
    showToast("Exchange completed.");
    showWorkspaceView("reviews");
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.deleteSkill = async (skillId) => {
  try {
    await api(`/api/skills/${skillId}`, { method: "DELETE" });
    showToast("Skill deleted.");
    await Promise.all([loadMySkills(), loadSkills()]);
  } catch (error) {
    showToast(error.message, true);
  }
};

window.toggleUserStatus = async (userId, isActive) => {
  try {
    await api(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: isActive === "true" })
    });
    showToast("User updated.");
    await loadAdmin();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.updateReport = async (reportId, status) => {
  try {
    await api(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    showToast("Report updated.");
    await loadAdmin();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.loadMessages = loadMessages;

renderResources();
bootstrap();
