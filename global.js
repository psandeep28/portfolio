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

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
  );
  
  const select = document.querySelector('.color-scheme select');
  
  // Function to apply the selected scheme
  function setColorScheme(scheme) {
    document.documentElement.style.setProperty('color-scheme', scheme);
  }
  
  // On change: apply + save preference
  select.addEventListener('input', (event) => {
    const scheme = event.target.value;
    setColorScheme(scheme);
    localStorage.colorScheme = scheme;
  });
  
  // On load: restore preference if saved
  if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
    select.value = localStorage.colorScheme;
  }
  
  export async function fetchJSON(url) {
    try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }