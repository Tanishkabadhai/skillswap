const resourceLibrary = [
  {
    category: "Programming",
    title: "Python and Web Development",
    summary: "Use these references to learn syntax, frameworks, and project-based development.",
    image: "/assets/creative-workspace.jpg",
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
    image: "/assets/abstract-orb.jpg",
    links: [
      { label: "Nielsen Norman Group", url: "https://www.nngroup.com/" },
      { label: "Material Design", url: "https://m3.material.io/" },
      { label: "Figma Learn", url: "https://help.figma.com/hc/en-us/categories/360002051613" }
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
      { label: "Yousician Blog", url: "https://yousician.com/blog" }
    ]
  }
];

const preview = document.getElementById("resource-preview");
const searchInput = document.getElementById("hero-search-input");
const searchBtn = document.getElementById("hero-search-btn");
const primaryAction = document.getElementById("landing-primary-action");
const secondaryAction = document.getElementById("landing-secondary-action");
const token = localStorage.getItem("skillswapToken");

preview.innerHTML = resourceLibrary
  .map(
    (resource) => `
      <article class="card resource-card">
        <img class="resource-art" src="${resource.image}" alt="${resource.title}" />
        <span class="resource-tag">${resource.category}</span>
        <strong>${resource.title}</strong>
        <p>${resource.summary}</p>
        <div class="resource-links">
          ${resource.links
            .map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
            .join("")}
        </div>
      </article>`
  )
  .join("");

const routeToSearch = () => {
  const query = encodeURIComponent(searchInput.value.trim());
  if (token) {
    window.location.href = `/app?view=explore${query ? `&q=${query}` : ""}`;
  } else {
    window.location.href = `/login${query ? `?next=explore&q=${query}` : ""}`;
  }
};

if (token) {
  primaryAction.textContent = "Open dashboard";
  primaryAction.href = "/app?view=overview";
  secondaryAction.textContent = "Stay on homepage";
  secondaryAction.href = "/";
}

searchBtn.addEventListener("click", routeToSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    routeToSearch();
  }
});
