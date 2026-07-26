const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const menuLabel = document.querySelector(".menu-toggle-label");
const navigation = document.querySelector(".site-nav");
const progress = document.querySelector(".scroll-progress span");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const setMenu = (open) => {
  body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuLabel.textContent = open ? "Close" : "Menu";
};

menuToggle.addEventListener("click", () => {
  setMenu(!body.classList.contains("menu-open"));
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.classList.contains("menu-open")) {
    setMenu(false);
    menuToggle.focus();
  }
});

let scrollTicking = false;

const updateScrollState = () => {
  const scrollTop = window.scrollY;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle("is-scrolled", scrollTop > 24);
  progress.style.transform = `scaleX(${scrollRange > 0 ? scrollTop / scrollRange : 0})`;
  scrollTicking = false;
};

window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateScrollState);
    scrollTicking = true;
  }
}, { passive: true });

updateScrollState();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -7% 0px"
  });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const playButtons = document.querySelectorAll(".release-play");
const playerFrame = document.querySelector("[data-player-frame]");
const playerTitle = document.querySelector("[data-player-title]");
const player = document.querySelector("#music-player");

playButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", () => {
    const card = button.closest(".release-card");
    const albumId = button.dataset.album;
    const releaseTitle = card.dataset.release;

    playButtons.forEach((item) => {
      item.setAttribute("aria-pressed", "false");
      item.querySelector("span").textContent = "▶";
    });

    button.setAttribute("aria-pressed", "true");
    button.querySelector("span").textContent = "♪";
    playerTitle.textContent = releaseTitle;

    const iframe = document.createElement("iframe");
    iframe.src = `https://open.spotify.com/embed/album/${albumId}?utm_source=generator&theme=0`;
    iframe.title = `${releaseTitle} by Sophie Thomasdotter on Spotify`;
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    playerFrame.replaceChildren(iframe);

    if (window.matchMedia("(max-width: 759px)").matches) {
      player.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "center"
      });
    }
  });
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();
