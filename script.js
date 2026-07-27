const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const menuLabel = document.querySelector(".menu-toggle-label");
const navigation = document.querySelector(".site-nav");
const progress = document.querySelector(".scroll-progress span");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const heroSection = document.querySelector(".hero");
const bookSection = document.querySelector(".book");
const mobileActions = document.querySelector(".mobile-actions");

const updateMobileActions = () => {
  if (!heroSection || !bookSection || !mobileActions) return;

  const viewportHeight = window.innerHeight;
  const heroRect = heroSection.getBoundingClientRect();
  const bookRect = bookSection.getBoundingClientRect();
  const hasLeftHero = heroRect.bottom <= viewportHeight * 0.72;
  const bookIsNear = bookRect.top <= viewportHeight * 0.82
    && bookRect.bottom >= viewportHeight * 0.18;

  mobileActions.classList.toggle("is-visible", hasLeftHero && !bookIsNear);
};

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
  updateMobileActions();

  if (!reduceMotion.matches) {
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallaxSpeed || 0.04);
      const rect = item.getBoundingClientRect();
      const distanceFromCenter = rect.top + (rect.height / 2) - (window.innerHeight / 2);
      const offset = Math.max(-70, Math.min(70, distanceFromCenter * speed));
      item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });
  }

  scrollTicking = false;
};

window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateScrollState);
    scrollTicking = true;
  }
}, { passive: true });

window.addEventListener("resize", updateMobileActions, { passive: true });

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

const storyFragments = document.querySelectorAll(".story-fragment");
const storyPortrait = document.querySelector(".story-portrait");

if ("IntersectionObserver" in window && storyPortrait) {
  const storyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        storyPortrait.classList.add("is-awake");
        storyPortrait.dataset.activeScene = entry.target.dataset.storyScene;
      }
    });
  }, {
    threshold: 0.55,
    rootMargin: "-10% 0px -10% 0px"
  });

  storyFragments.forEach((fragment) => storyObserver.observe(fragment));
}

const storyReader = document.querySelector("[data-story-reader]");
const readerOpen = document.querySelector("[data-reader-open]");
const readerClose = document.querySelector("[data-reader-close]");
let readerReturnFocus = null;

const closeStoryReader = () => {
  if (!storyReader?.open) return;
  storyReader.close();
};

readerOpen?.addEventListener("click", () => {
  readerReturnFocus = document.activeElement;
  document.body.classList.add("reader-open");
  storyReader.scrollTop = 0;
  storyReader.showModal();
  readerClose.focus();
});

readerClose?.addEventListener("click", closeStoryReader);

storyReader?.addEventListener("close", () => {
  document.body.classList.remove("reader-open");
  readerReturnFocus?.focus();
});

storyReader?.addEventListener("click", (event) => {
  if (event.target === storyReader) {
    closeStoryReader();
  }
});

const bookVisual = document.querySelector(".book-visual");

if (bookVisual && !reduceMotion.matches && window.matchMedia("(hover: hover)").matches) {
  bookVisual.addEventListener("pointermove", (event) => {
    const rect = bookVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    bookVisual.style.setProperty("--book-rotate-y", `${(x * 7).toFixed(2)}deg`);
    bookVisual.style.setProperty("--book-rotate-x", `${(y * -5).toFixed(2)}deg`);
  });

  bookVisual.addEventListener("pointerleave", () => {
    bookVisual.style.removeProperty("--book-rotate-y");
    bookVisual.style.removeProperty("--book-rotate-x");
  });
}

const playButtons = document.querySelectorAll(".release-play");
const spotifyEmbedTarget = document.querySelector("[data-spotify-embed]");
const playerTitle = document.querySelector("[data-player-title]");
const playerStatus = document.querySelector(".player-status");
const player = document.querySelector("#music-player");
let spotifyController = null;
let spotifyReady = false;
let queuedRelease = null;
let currentAlbumId = "1i4UJj3WxyFzxOMNahmY0j";

const startRelease = ({ albumId, releaseTitle }) => {
  if (!spotifyController || !spotifyReady) {
    queuedRelease = { albumId, releaseTitle };
    return;
  }

  if (currentAlbumId !== albumId) {
    spotifyController.loadEntity(`spotify:album:${albumId}`);
    currentAlbumId = albumId;
  }

  spotifyController.play();
};

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  if (!spotifyEmbedTarget) return;

  IFrameAPI.createController(spotifyEmbedTarget, {
    width: "100%",
    height: 152,
    uri: `spotify:album:${currentAlbumId}`
  }, (EmbedController) => {
    spotifyController = EmbedController;

    spotifyController.addListener("ready", () => {
      spotifyReady = true;

      if (queuedRelease) {
        const release = queuedRelease;
        queuedRelease = null;
        startRelease(release);
      }
    });

    spotifyController.addListener("playback_started", () => {
      playerStatus.textContent = "Now playing";
    });
  });
};

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
    playerStatus.textContent = "Starting playback";
    startRelease({ albumId, releaseTitle });

    if (window.matchMedia("(max-width: 759px)").matches) {
      player.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "center"
      });
    }
  });
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();
