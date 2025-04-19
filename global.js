console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3.1: Pages to include in the nav
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume.html", title: "Resume" },
  { url: "https://github.com/psandeep28", title: "GitHub" }
];

// Step 3.1 continued: Handle local vs GitHub Pages base path
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/"; // ← Change this to your actual GitHub repo name

// Create <nav> and insert at top of body
let nav = document.createElement("nav");
document.body.prepend(nav);

// Step 3.2: Create links and apply logic
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix relative URLs with BASE_PATH
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // Create <a> element
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  // Append to nav
  nav.append(a);
}
