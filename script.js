const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const closeButton = document.querySelector(".lightbox-close");
const photoButtons = document.querySelectorAll(".photo-button");
const workCards = document.querySelectorAll(".work-card");
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");

let lastFocusedElement = null;

function setMenuOpen(isOpen) {
  if (!menu || !menuToggle || !navLinks) {
    return;
  }

  menu.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "Close" : "Menu";
  navLinks.setAttribute("aria-hidden", String(!isOpen));
}

function closeMenu() {
  setMenuOpen(false);
}

if (menu && menuToggle && navLinks) {
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
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const place = button.dataset.place || "";

  lastFocusedElement = document.activeElement;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = place ? `${title} / ${place}` : title;

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxImage.src = "";

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

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  workCards.forEach((card) => observer.observe(card));
} else {
  workCards.forEach((card) => card.classList.add("is-visible"));
}
