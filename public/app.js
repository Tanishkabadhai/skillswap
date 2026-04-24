const state = {
  token: localStorage.getItem("skillswapToken") || "",
  user: null,
  categories: [],
  activeDashboardTab: "incoming",
  activeRequestId: null,
  activeView: new URLSearchParams(window.location.search).get("view") || "overview",
  dashboardData: { incoming: [], outgoing: [], accepted: [] },
  growthSummary: null
};

const resourceLibrary = [
  {
    category: "Programming",
    title: "Python and Web Development",
    summary: "Use these references to learn syntax, frameworks, and project-based development.",
    image: "/assets/creative-workspace.jpg",
    links: [
      { label: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/" },
      { label: "MDN Web Docs", url: "https://developer.mozilla.org/" },
      { label: "freeCodeCamp", url: "https://www.freecodecamp.org/" },
      { label: "W3Schools Python", url: "https://www.w3schools.com/python/" },
      { label: "Full Stack Open", url: "https://fullstackopen.com/en/" }
    ]
  },
  {
    category: "Design",
    title: "UI, UX, and Visual Thinking",
    summary: "Starter material for interface design, layout, and accessibility thinking.",
    image: "/assets/abstract-orb.jpg",
    links: [
      { label: "Nielsen Norman Group", url: "https://www.nngroup.com/" },
      { label: "Material Design", url: "https://m3.material.io/" },
      { label: "Figma Learn", url: "https://help.figma.com/hc/en-us/categories/360002051613" },
      { label: "Laws of UX", url: "https://lawsofux.com/" },
      { label: "A11Y Project", url: "https://www.a11yproject.com/" }
    ]
  },
  {
    category: "Languages",
    title: "Language Learning Resources",
    summary: "Helpful references for vocabulary, grammar, and speaking practice.",
    image: "/assets/online-mentoring.jpg",
    links: [
      { label: "Duolingo Blog", url: "https://blog.duolingo.com/" },
      { label: "BBC Languages Archive", url: "https://www.bbc.co.uk/languages/" },
      { label: "Cambridge English", url: "https://www.cambridgeenglish.org/learning-english/" },
      { label: "Oxford Learner's Dictionaries", url: "https://www.oxfordlearnersdictionaries.com/" },
      { label: "Language Transfer", url: "https://www.languagetransfer.org/" }
    ]
  },
  {
    category: "Music",
    title: "Guitar, Singing, and Practice",
    summary: "Resources to support beginner-to-intermediate music learners and peer mentors.",
    image: "/assets/music-studio.jpg",
    links: [
      { label: "JustinGuitar", url: "https://www.justinguitar.com/" },
      { label: "musictheory.net", url: "https://www.musictheory.net/" },
      { label: "Yousician Blog", url: "https://yousician.com/blog" },
      { label: "Fender Play Blog", url: "https://www.fender.com/articles" },
      { label: "8notes Lessons", url: "https://www.8notes.com/" }
    ]
  },
  {
    category: "Academics",
    title: "Study Support and Fundamentals",
    summary: "Useful references for math, science, and self-paced student revision.",
    image: "/assets/learning-group.jpg",
    links: [
      { label: "Khan Academy", url: "https://www.khanacademy.org/" },
      { label: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" },
      { label: "Coursera Catalog", url: "https://www.coursera.org/" },
      { label: "Brilliant", url: "https://brilliant.org/" },
      { label: "OpenStax", url: "https://openstax.org/" }
    ]
  }
];

if (!state.token) {
  window.location.replace("/login");
}

const ui = {
  adminPanel: document.getElementById("admin-panel"),
  adminNavLink: document.getElementById("admin-nav-link"),
  logoutBtn: document.getElementById("logout-btn"),
  toast: document.getElementById("toast"),
  searchCategory: document.getElementById("search-category"),
  skillCategory: document.getElementById("skill-category"),
  circleCategory: document.getElementById("circle-category"),
  dashboardLists: document.getElementById("dashboard-lists"),
  skillResults: document.getElementById("skill-results"),
  mySkills: document.getElementById("my-skills"),
  messagesList: document.getElementById("messages-list"),
  adminStats: document.getElementById("admin-stats"),
  adminUsers: document.getElementById("admin-users"),
  adminReports: document.getElementById("admin-reports"),
  overviewStats: document.getElementById("overview-stats"),
  badgeStrip: document.getElementById("badge-strip"),
  userIdentity: document.getElementById("user-identity"),
  resourceLibrary: document.getElementById("resource-library"),
  roadmapList: document.getElementById("roadmap-list"),
  notesList: document.getElementById("notes-list"),
  favoritesList: document.getElementById("favorites-list"),
  growthSummary: document.getElementById("growth-summary"),
  aiStatus: document.getElementById("ai-status"),
  aiChatReplies: document.getElementById("ai-chat-replies"),
  verificationList: document.getElementById("verification-list"),
  circlesList: document.getElementById("circles-list"),
  myCircles: document.getElementById("my-circles"),
  workspaceLinks: document.querySelectorAll(".workspace-link"),
  workspaceViews: document.querySelectorAll(".workspace-view")
};

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.token}`,
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() || "The server returned an unexpected response." };

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

const setView = (viewName, replace = true) => {
  state.activeView = viewName;
  ui.workspaceLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === viewName);
  });
  ui.workspaceViews.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === viewName);
  });
  const url = `/app?view=${viewName}`;
  if (replace) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
};

const optionMarkup = (categories, withAll = false) => {
  const options = categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`);
  return withAll ? [`<option value="">All categories</option>`, ...options].join("") : options.join("");
};

const renderResources = () => {
  ui.resourceLibrary.innerHTML = resourceLibrary
    .map(
      (resource) => `
        <article class="card resource-card">
          <img class="resource-art" src="${resource.image}" alt="${resource.title}" />
          <span class="resource-tag">${resource.category}</span>
          <strong>${resource.title}</strong>
          <p>${resource.summary}</p>
          <div class="resource-links">
            ${resource.links.map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`).join("")}
          </div>
        </article>`
    )
    .join("");
};

const renderIdentity = () => {
  ui.userIdentity.innerHTML = `
    <span class="identity-chip">Your user ID: ${state.user.id}</span>
    <span class="identity-chip">${state.user.name}</span>
    <span class="identity-chip">${state.user.email}</span>
  `;
};

const renderBadges = () => {
  const badges = state.growthSummary?.badges || [];
  ui.badgeStrip.innerHTML = badges.length
    ? badges.map((badge) => `<span class="identity-chip">${badge}</span>`).join("")
    : `<span class="helper-text">Earn badges by creating roadmaps, notes, favorites, and completed exchanges.</span>`;
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

  renderBadges();
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
                <button class="ghost-btn" onclick="favoriteTeacher(${skill.user_id})">Favorite teacher</button>
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
                ${isIncoming ? `<button class="primary-btn" onclick="respondRequest(${item.id}, 'accepted')">Accept</button><button class="ghost-btn" onclick="respondRequest(${item.id}, 'rejected')">Reject</button>` : ""}
                ${isAccepted ? `<button class="ghost-btn" onclick="markComplete(${item.id})">Mark complete</button>` : ""}
                <button class="ghost-btn" onclick="loadMessages(${item.id})">Open messages</button>
              </div>
            </article>`;
        })
        .join("")
    : `<p class="list-meta">No items in this view.</p>`;
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
            <button class="ghost-btn" onclick="toggleUserStatus(${user.id}, ${user.is_active ? "false" : "true"})">${user.is_active ? "Disable" : "Enable"}</button>
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

const renderRoadmaps = (roadmaps) => {
  ui.roadmapList.innerHTML = roadmaps.length
    ? roadmaps
        .map(
          (roadmap) => `
            <article class="list-card">
              <strong>${roadmap.skill_topic}</strong>
              <div class="list-meta">${roadmap.current_level}</div>
              <p>${roadmap.goal}</p>
              <pre class="roadmap-text">${roadmap.roadmap_text}</pre>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No roadmaps generated yet.</p>`;
};

const renderNotes = (notes) => {
  ui.notesList.innerHTML = notes.length
    ? notes
        .map(
          (note) => `
            <article class="list-card">
              <strong>${note.note_title}</strong>
              <div class="list-meta">${note.request_id ? `Request #${note.request_id}` : "Independent note"}</div>
              <p>${note.note_body}</p>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No notes saved yet.</p>`;
};

const renderFavorites = (favorites) => {
  ui.favoritesList.innerHTML = favorites.length
    ? favorites
        .map(
          (favorite) => `
            <article class="list-card">
              <strong>${favorite.name} (#${favorite.favorite_user_id})</strong>
              <div class="list-meta">${favorite.email}</div>
              <p>${favorite.bio || "No bio available."}</p>
              <div class="list-actions">
                <button class="ghost-btn" onclick="removeFavorite(${favorite.favorite_user_id})">Remove</button>
              </div>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No favorite teachers yet.</p>`;
};

const renderVerifications = (verifications) => {
  ui.verificationList.innerHTML = verifications.length
    ? verifications
        .map(
          (verification) => `
            <article class="list-card">
              <strong>${verification.title}</strong>
              <div class="list-meta">Status: ${verification.status}</div>
              <p>${verification.proof_text || "Portfolio proof submitted."}</p>
              <div class="resource-links">
                <a href="${verification.portfolio_url}" target="_blank" rel="noreferrer">Open portfolio</a>
              </div>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No verification submissions yet.</p>`;
};

const renderGrowthSummary = () => {
  const summary = state.growthSummary;
  if (!summary) return;
  ui.growthSummary.innerHTML = `
    <div class="stat-card"><strong>${summary.streak}</strong><div>Momentum score</div></div>
    <div class="stat-card"><strong>${summary.favorites}</strong><div>Bookmarks</div></div>
    <div class="stat-card"><strong>${summary.roadmaps}</strong><div>Roadmaps</div></div>
    <div class="stat-card"><strong>${summary.notes}</strong><div>Session notes</div></div>
    <div class="stat-card"><strong>${summary.verifications}</strong><div>Verifications</div></div>
    <div class="stat-card"><strong>${summary.completed}</strong><div>Completed exchanges</div></div>
  `;
};

const renderAiReply = (prompt, reply) => {
  const existing = ui.aiChatReplies.innerHTML;
  ui.aiChatReplies.innerHTML = `
    <article class="list-card">
      <strong>You asked</strong>
      <p>${prompt}</p>
      <div class="top-gap"></div>
      <strong>SkillSwap AI</strong>
      <p>${reply}</p>
    </article>
  ` + existing;
};

const renderCircles = (circles) => {
  ui.circlesList.innerHTML = circles.length
    ? circles
        .map(
          (circle) => `
            <article class="list-card">
              <strong>${circle.name}</strong>
              <div class="list-meta">${circle.category_name} - Created by ${circle.creator_name} - ${circle.member_count} members</div>
              <p>${circle.description || "No description provided."}</p>
              <div class="list-actions">
                <button class="primary-btn" onclick="joinCircle(${circle.id})">Join circle</button>
              </div>
            </article>`
        )
        .join("")
    : `<p class="list-meta">No learning circles yet.</p>`;
};

const renderMyCircles = (circles) => {
  ui.myCircles.innerHTML = circles.length
    ? circles
        .map(
          (circle) => `
            <article class="list-card">
              <strong>${circle.name}</strong>
              <div class="list-meta">${circle.category_name}</div>
              <p>${circle.description || "No description provided."}</p>
            </article>`
        )
        .join("")
    : `<p class="list-meta">You have not joined any circles yet.</p>`;
};

const fetchCategories = async () => {
  const data = await api("/api/categories", {
    headers: {
      Authorization: ""
    }
  });
  state.categories = data.categories || [];
  ui.searchCategory.innerHTML = optionMarkup(state.categories, true);
  ui.skillCategory.innerHTML = optionMarkup(state.categories);
  ui.circleCategory.innerHTML = optionMarkup(state.categories);
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
  setView("messages");
};

const loadGrowth = async () => {
  const [roadmaps, notes, favorites, verifications, summary] = await Promise.all([
    api("/api/growth/roadmaps"),
    api("/api/growth/notes"),
    api("/api/growth/favorites"),
    api("/api/growth/verifications"),
    api("/api/growth/summary")
  ]);
  state.growthSummary = summary.summary;
  renderRoadmaps(roadmaps.roadmaps);
  renderNotes(notes.notes);
  renderFavorites(favorites.favorites);
  renderVerifications(verifications.verifications);
  renderGrowthSummary();
  renderOverview();
};

const loadCircles = async () => {
  const [circles, mine] = await Promise.all([api("/api/circles"), api("/api/circles/mine")]);
  renderCircles(circles.circles);
  renderMyCircles(mine.circles);
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

const loadAiStatus = async () => {
  try {
    const data = await api("/api/ai/status");
    ui.aiStatus.textContent = data.configured
      ? "AI is connected and ready for study help and roadmap generation."
      : "AI is not connected yet. Add OPENAI_API_KEY to .env to enable live AI responses.";
  } catch (error) {
    ui.aiStatus.textContent = "AI status could not be checked.";
  }
};

const safeLoad = async (loader, fallbackMessage) => {
  try {
    await loader();
  } catch (error) {
    console.error(fallbackMessage, error);
    showToast(fallbackMessage, true);
  }
};

const bootstrap = async () => {
  try {
    await fetchCategories();
    const me = await api("/api/auth/me");
    state.user = me.user;
    renderIdentity();
    ui.adminPanel.classList.toggle("hidden", state.user.role !== "admin");
    ui.adminNavLink.classList.toggle("hidden", state.user.role !== "admin");
    renderResources();
    setView(state.activeView);
    await Promise.all([
      loadProfile(),
      loadMySkills(),
      loadSkills(),
      loadDashboard(),
      safeLoad(loadGrowth, "Growth features are unavailable until the new database tables are added."),
      safeLoad(loadCircles, "Learning circles are unavailable until the new database tables are added."),
      safeLoad(loadAdmin, "Admin data could not be loaded."),
      safeLoad(loadAiStatus, "AI status could not be loaded.")
    ]);

    const presetQuery = new URLSearchParams(window.location.search).get("q");
    if (presetQuery) {
      document.getElementById("search-keyword").value = presetQuery;
      state.activeView = "explore";
      setView("explore");
      await loadSkills();
    }
  } catch (error) {
    console.error("SkillSwap bootstrap failed:", error);
    if (error.message && error.message.toLowerCase().includes("invalid")) {
      localStorage.removeItem("skillswapToken");
      window.location.replace("/login");
      return;
    }
    showToast(error.message || "Dashboard could not fully load.", true);
  }
};

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

document.getElementById("roadmap-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/growth/roadmaps", {
      method: "POST",
      body: JSON.stringify({
        skillTopic: document.getElementById("roadmap-skill-topic").value,
        currentLevel: document.getElementById("roadmap-current-level").value,
        goal: document.getElementById("roadmap-goal").value
      })
    });
    event.target.reset();
    showToast("Roadmap generated.");
    await loadGrowth();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("notes-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/growth/notes", {
      method: "POST",
      body: JSON.stringify({
        requestId: document.getElementById("note-request-id").value,
        noteTitle: document.getElementById("note-title").value,
        noteBody: document.getElementById("note-body").value
      })
    });
    event.target.reset();
    showToast("Session note saved.");
    await loadGrowth();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("verification-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/growth/verifications", {
      method: "POST",
      body: JSON.stringify({
        title: document.getElementById("verification-title").value,
        portfolioUrl: document.getElementById("verification-portfolio-url").value,
        proofText: document.getElementById("verification-proof").value
      })
    });
    event.target.reset();
    showToast("Verification submitted.");
    await loadGrowth();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("ai-chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = document.getElementById("ai-message").value.trim();
  if (!prompt) return;
  try {
    const data = await api("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message: prompt })
    });
    renderAiReply(prompt, data.reply);
    document.getElementById("ai-message").value = "";
    showToast("AI reply received.");
  } catch (error) {
    const friendlyMessage = "AI assistant is temporarily unavailable right now. Please try again later.";
    ui.aiStatus.textContent = friendlyMessage;
    ui.aiStatus.classList.add("ai-fallback");
    showToast(friendlyMessage, true);
  }
});

document.getElementById("circle-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/circles", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("circle-name").value,
        categoryId: document.getElementById("circle-category").value,
        description: document.getElementById("circle-description").value
      })
    });
    event.target.reset();
    showToast("Learning circle created.");
    await loadCircles();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("message-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const requestId = state.activeRequestId || document.getElementById("message-request-id").value;
    if (!requestId) throw new Error("Select or enter a request ID before sending a message.");
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
  window.location.href = "/";
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
    setView("requests");
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.favoriteTeacher = async (teacherId) => {
  try {
    await api("/api/growth/favorites", {
      method: "POST",
      body: JSON.stringify({ favoriteUserId: teacherId })
    });
    showToast("Teacher bookmarked.");
    await loadGrowth();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.removeFavorite = async (teacherId) => {
  try {
    await api(`/api/growth/favorites/${teacherId}`, { method: "DELETE" });
    showToast("Bookmark removed.");
    await loadGrowth();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.joinCircle = async (circleId) => {
  try {
    await api(`/api/circles/${circleId}/join`, { method: "POST" });
    showToast("Joined learning circle.");
    await loadCircles();
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
    await api(`/api/requests/${requestId}/complete`, { method: "PATCH" });
    showToast("Exchange completed.");
    setView("reviews");
    await Promise.all([loadDashboard(), loadGrowth()]);
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

ui.workspaceLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setView(link.dataset.view, false);
  });
});

window.addEventListener("popstate", () => {
  const view = new URLSearchParams(window.location.search).get("view") || "overview";
  setView(view);
});

window.loadMessages = loadMessages;

bootstrap();
