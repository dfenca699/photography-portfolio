const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const closeButton = document.querySelector(".lightbox-close");
const photoButtons = document.querySelectorAll(".photo-button");
const workCards = document.querySelectorAll(".work-card");
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector(".menu-toggle");
const menuPanel = document.querySelector("#primary-navigation");
const navItems = document.querySelectorAll(".menu-panel a");
const revealItems = document.querySelectorAll(
  ".section-heading, .series-heading, .text-block, .contact-links, .site-footer"
);
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedElement = null;
let clearLightboxTimer = null;
let menuAnimationTimer = null;
let menuStateChangeId = 0;

function prefersReducedMotion() {
  return motionQuery.matches;
}

function setMenuOpen(isOpen) {
  if (!menu || !menuToggle || !menuPanel) {
    return;
  }

  menuStateChangeId += 1;
  const stateChangeId = menuStateChangeId;
  window.clearTimeout(menuAnimationTimer);
  menu.classList.remove("is-opening", "is-closing");
  menuToggle.setAttribute("aria-expanded", String(isOpen));

  if (prefersReducedMotion()) {
    menu.classList.toggle("is-open", isOpen);
    menuToggle.classList.toggle("is-open", isOpen);
    menuPanel.setAttribute("aria-hidden", String(!isOpen));
    return;
  }

  if (isOpen) {
    menuPanel.setAttribute("aria-hidden", "false");
    menu.classList.add("is-opening");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (stateChangeId !== menuStateChangeId) {
          return;
        }

        menu.classList.add("is-open");
        menuToggle.classList.add("is-open");
        menu.classList.remove("is-opening");
      });
    });
    return;
  }

  menu.classList.add("is-closing");
  menu.classList.remove("is-open");
  menuToggle.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");

  menuAnimationTimer = window.setTimeout(() => {
    if (stateChangeId !== menuStateChangeId) {
      return;
    }

    menu.classList.remove("is-closing");
    menuPanel.setAttribute("aria-hidden", "true");
  }, 260);
}

function closeMenu() {
  setMenuOpen(false);
}

if (menu && menuToggle && menuPanel) {
  menuToggle.addEventListener("click", () => {
    setMenuOpen(!menu.classList.contains("is-open"));
  });

  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      const target = document.querySelector(item.getAttribute("href"));

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      closeMenu();
      history.pushState(null, "", item.getAttribute("href"));
    });
  });

  document.addEventListener("click", (event) => {
    if (menu.classList.contains("is-open") && !menu.contains(event.target)) {
      closeMenu();
    }
  });
}

function openLightbox(button) {
  const image = button.querySelector("img");
  const title = button.dataset.title || image.alt;
  const category =
    button.dataset.categoryLabel || button.closest(".work-card")?.dataset.category || "";

  window.clearTimeout(clearLightboxTimer);
  lastFocusedElement = document.activeElement;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = category ? `${title} \u2014 ${category}` : title;

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  clearLightboxTimer = window.setTimeout(
    () => {
      if (!lightbox.classList.contains("is-open")) {
        lightboxImage.src = "";
      }
    },
    prefersReducedMotion() ? 0 : 520
  );

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

photoButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

closeButton.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-lightbox")) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (lightbox.classList.contains("is-open")) {
    closeLightbox();
    return;
  }

  if (menu && menu.classList.contains("is-open")) {
    closeMenu();
  }
});

function revealElement(element) {
  element.classList.add("is-visible");
}

const scrollRevealItems = [...revealItems, ...workCards];

revealItems.forEach((item, index) => {
  item.classList.add("reveal-item");
  item.style.setProperty("--reveal-delay", `${Math.min(index * 70, 180)}ms`);
});

workCards.forEach((card, index) => {
  card.style.setProperty("--reveal-delay", `${(index % 6) * 45}ms`);
});

if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
  scrollRevealItems.forEach(revealElement);
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  scrollRevealItems.forEach((item) => revealObserver.observe(item));
}

function handleMotionPreferenceChange() {
  if (prefersReducedMotion()) {
    scrollRevealItems.forEach(revealElement);
  }
}

if (motionQuery.addEventListener) {
  motionQuery.addEventListener("change", handleMotionPreferenceChange);
} else if (motionQuery.addListener) {
  motionQuery.addListener(handleMotionPreferenceChange);
}
