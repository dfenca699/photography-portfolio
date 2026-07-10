const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxContent = document.querySelector(".lightbox-content");
const closeButton = document.querySelector(".lightbox-close");
const previousButton = document.querySelector(".lightbox-prev");
const nextButton = document.querySelector(".lightbox-next");
const photoButtons = Array.from(document.querySelectorAll(".photo-button"));
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector(".menu-toggle");
const menuPanel = document.querySelector("#primary-navigation");
const navItems = Array.from(document.querySelectorAll(".menu-panel a[href^='#']"));
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let activePhotoIndex = -1;
let lastFocusedElement = null;
let lockedScrollY = 0;
let pageScrollLocked = false;
let touchStartX = null;
let touchStartY = null;

function reducedMotion() {
  return motionQuery.matches;
}

function setMenuOpen(isOpen) {
  if (!menu || !menuToggle || !menuPanel) return;
  menu.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuPanel.setAttribute("aria-hidden", String(!isOpen));
}

function closeMenu() {
  setMenuOpen(false);
}

if (window.matchMedia("(max-width: 768px)").matches) {
  setMenuOpen(false);
}

function lockPageScroll() {
  if (pageScrollLocked) return;
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  pageScrollLocked = true;
  document.body.classList.add("is-lightbox-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockPageScroll() {
  if (!pageScrollLocked && !document.body.classList.contains("is-lightbox-open")) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  const restoreY = lockedScrollY;
  pageScrollLocked = false;
  document.body.classList.remove("is-lightbox-open");
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("left");
  document.body.style.removeProperty("right");
  document.body.style.removeProperty("width");
  window.scrollTo(0, restoreY);
  window.requestAnimationFrame(() => window.scrollTo(0, restoreY));
  return restoreY;
}

function recoverScrollablePage() {
  if (!lightbox || !lightbox.classList.contains("is-open")) {
    unlockPageScroll();
  }
  if (window.matchMedia("(min-width: 769px)").matches) {
    closeMenu();
  }
}

function setLightboxPhoto(index) {
  if (!photoButtons.length) return;
  activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
  const button = photoButtons[activePhotoIndex];
  const image = button.querySelector("img");
  const title = button.dataset.title || image.alt;
  const category = button.dataset.categoryLabel || "";
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = category ? `${title} — ${category}` : title;
}

function openLightbox(button) {
  if (!lightbox) return;
  closeMenu();
  lastFocusedElement = document.activeElement;
  setLightboxPhoto(photoButtons.indexOf(button));
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  lockPageScroll();
  closeButton.focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightbox || !lightbox.classList.contains("is-open")) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  const restoreY = unlockPageScroll();
  window.setTimeout(() => {
    if (!lightbox.classList.contains("is-open")) lightboxImage.src = "";
    if (lastFocusedElement) {
      try { lastFocusedElement.focus({ preventScroll: true }); }
      catch { lastFocusedElement.focus(); window.scrollTo(0, restoreY); }
    }
  }, reducedMotion() ? 0 : 180);
}

function changeLightboxPhoto(direction) {
  if (!lightbox?.classList.contains("is-open")) return;
  setLightboxPhoto(activePhotoIndex + direction);
}

if (menu && menuToggle) {
  menuToggle.addEventListener("click", () => setMenuOpen(!menu.classList.contains("is-open")));
}

navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    const target = document.querySelector(item.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    closeMenu();
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", item.getAttribute("href"));
  });
});

photoButtons.forEach((button) => button.addEventListener("click", () => openLightbox(button)));
closeButton?.addEventListener("click", closeLightbox);
previousButton?.addEventListener("click", () => changeLightboxPhoto(-1));
nextButton?.addEventListener("click", () => changeLightboxPhoto(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-lightbox")) closeLightbox();
});

lightboxContent?.addEventListener("touchstart", (event) => {
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}, { passive: true });

lightboxContent?.addEventListener("touchend", (event) => {
  if (touchStartX === null || touchStartY === null || !event.changedTouches.length) return;
  const distanceX = event.changedTouches[0].clientX - touchStartX;
  const distanceY = event.changedTouches[0].clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;
  if (Math.abs(distanceX) > 52 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
    changeLightboxPhoto(distanceX < 0 ? 1 : -1);
  }
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (lightbox?.classList.contains("is-open")) {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") { event.preventDefault(); changeLightboxPhoto(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); changeLightboxPhoto(1); }
    return;
  }
  if (event.key === "Escape") closeMenu();
});

const sectionLinks = navItems.filter((item) => ["#works", "#color", "#monochrome", "#about", "#contact"].includes(item.getAttribute("href")));
const sections = sectionLinks.map((item) => document.querySelector(item.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

window.addEventListener("pageshow", recoverScrollablePage);
window.addEventListener("resize", recoverScrollablePage, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") recoverScrollablePage();
});
