const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxContent = document.querySelector(".lightbox-content");
const closeButton = document.querySelector(".lightbox-close");
const previousButton = document.querySelector(".lightbox-prev");
const nextButton = document.querySelector(".lightbox-next");
const photoButtons = Array.from(document.querySelectorAll(".photo-button"));
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
let lockedScrollY = 0;
let activePhotoIndex = -1;
let photoChangeTimer = null;
let touchStartX = null;
let touchStartY = null;

function prefersReducedMotion() {
  return motionQuery.matches;
}

function setMenuOpen(isOpen) {
  if (!menu || !menuToggle || !menuPanel) {
    return;
  }

  menuStateChangeId += 1;
  const stateChangeId = menuStateChangeId;

  if (menuAnimationTimer) {
    window.clearTimeout(menuAnimationTimer);
    menuAnimationTimer = null;
  }

  const isMobileMenu = window.matchMedia("(max-width: 768px)").matches;
  const useReducedMotion = prefersReducedMotion();
  const duration = useReducedMotion ? 220 : isOpen ? 380 : 300;
  const easing = "cubic-bezier(0.16, 1, 0.3, 1)";

  function getAnimationName(direction) {
    if (useReducedMotion) {
      return direction === "open" ? "menuPanelFadeIn" : "menuPanelFadeOut";
    }

    if (isMobileMenu) {
      return direction === "open" ? "menuPanelOpenMobile" : "menuPanelCloseMobile";
    }

    return direction === "open" ? "menuPanelOpenDesktop" : "menuPanelCloseDesktop";
  }

  function clearPanelRuntimeStyles() {
    menuPanel.style.removeProperty("visibility");
    menuPanel.style.removeProperty("pointer-events");
    menuPanel.style.removeProperty("animation");
    menuPanel.style.removeProperty("-webkit-animation");
  }

  function playMenuAnimation(animationName, onfinish) {
    const animationValue = `${animationName} ${duration}ms ${easing} both`;

    menuPanel.style.setProperty("animation", "none", "important");
    menuPanel.style.setProperty("-webkit-animation", "none", "important");
    menuPanel.offsetHeight;
    menuPanel.style.setProperty("animation", animationValue, "important");
    menuPanel.style.setProperty("-webkit-animation", animationValue, "important");

    function handleAnimationEnd(event) {
      if (event.target !== menuPanel) {
        return;
      }

      menuPanel.removeEventListener("animationend", handleAnimationEnd);
      menuPanel.removeEventListener("webkitAnimationEnd", handleAnimationEnd);
      if (stateChangeId === menuStateChangeId) {
        onfinish();
      }
    }

    menuPanel.addEventListener("animationend", handleAnimationEnd);
    menuPanel.addEventListener("webkitAnimationEnd", handleAnimationEnd);
    menuAnimationTimer = window.setTimeout(() => {
      menuPanel.removeEventListener("animationend", handleAnimationEnd);
      menuPanel.removeEventListener("webkitAnimationEnd", handleAnimationEnd);
      if (stateChangeId === menuStateChangeId) {
        onfinish();
      }
    }, duration + 120);
  }

  menuPanel.style.pointerEvents = isOpen ? "auto" : "none";
  menuPanel.style.visibility = "visible";

  if (isOpen) {
    menu.classList.remove("is-closing");
    menu.classList.add("is-open");
    menuPanel.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");

    playMenuAnimation(getAnimationName("open"), () => {
      menu.classList.remove("is-closing");
      clearPanelRuntimeStyles();
      menuPanel.setAttribute("aria-hidden", "false");
      menuAnimationTimer = null;
    });
    return;
  }

  menu.classList.add("is-closing");
  menuToggle.setAttribute("aria-expanded", "false");

  playMenuAnimation(getAnimationName("close"), () => {
    menu.classList.remove("is-open", "is-closing");
    clearPanelRuntimeStyles();
    menuPanel.setAttribute("aria-hidden", "true");
    menuAnimationTimer = null;
  });
}

function closeMenu() {
  setMenuOpen(false);
}

function lockPageScroll() {
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.classList.add("is-lightbox-open");
}

function unlockPageScroll() {
  const scrollYToRestore = lockedScrollY;

  document.documentElement.classList.add("is-restoring-scroll");
  document.body.classList.remove("is-lightbox-open");
  document.body.style.top = "";
  window.scrollTo(0, scrollYToRestore);

  // Reapply the position after layout settles. This prevents Safari and
  // smooth-scroll CSS from leaving the page at the top after the lock ends.
  window.requestAnimationFrame(() => {
    window.scrollTo(0, scrollYToRestore);
    window.requestAnimationFrame(() => {
      window.scrollTo(0, scrollYToRestore);
      document.documentElement.classList.remove("is-restoring-scroll");
    });
  });

  return scrollYToRestore;
}

function restoreFocusWithoutScrolling(element, scrollYToRestore) {
  if (!element) {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch (error) {
    element.focus();
    window.scrollTo(0, scrollYToRestore);
  }
}

if (menu && menuToggle && menuPanel) {
  menuToggle.addEventListener("click", () => {
    const isVisiblyOpen =
      menu.classList.contains("is-open") && !menu.classList.contains("is-closing");

    setMenuOpen(!isVisiblyOpen);
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

function setLightboxPhoto(index, animate = false) {
  if (!photoButtons.length) {
    return;
  }

  activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
  const button = photoButtons[activePhotoIndex];
  const image = button.querySelector("img");
  const title = button.dataset.title || image.alt;
  const category =
    button.dataset.categoryLabel || button.closest(".work-card")?.dataset.category || "";

  window.clearTimeout(photoChangeTimer);

  function applyPhoto() {
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = category ? `${title} \u2014 ${category}` : title;

    window.requestAnimationFrame(() => {
      lightboxContent.classList.remove("is-changing");
    });
  }

  if (animate && !prefersReducedMotion()) {
    lightboxContent.classList.add("is-changing");
    photoChangeTimer = window.setTimeout(applyPhoto, 110);
  } else {
    applyPhoto();
  }
}

function changeLightboxPhoto(direction) {
  if (!lightbox.classList.contains("is-open")) {
    return;
  }

  setLightboxPhoto(activePhotoIndex + direction, true);
}

function openLightbox(button) {
  window.clearTimeout(clearLightboxTimer);
  lastFocusedElement = document.activeElement;
  setLightboxPhoto(photoButtons.indexOf(button));

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  lockPageScroll();
  closeButton.focus();
}

function closeLightbox() {
  window.clearTimeout(photoChangeTimer);
  lightboxContent.classList.remove("is-changing");
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  const scrollYToRestore = unlockPageScroll();

  clearLightboxTimer = window.setTimeout(
    () => {
      if (!lightbox.classList.contains("is-open")) {
        lightboxImage.src = "";
      }
    },
    prefersReducedMotion() ? 0 : 520
  );

  restoreFocusWithoutScrolling(lastFocusedElement, scrollYToRestore);
}

photoButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

closeButton.addEventListener("click", closeLightbox);
previousButton.addEventListener("click", () => changeLightboxPhoto(-1));
nextButton.addEventListener("click", () => changeLightboxPhoto(1));

lightbox.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-lightbox")) {
    closeLightbox();
  }
});

lightboxContent.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  },
  { passive: true }
);

lightboxContent.addEventListener(
  "touchend",
  (event) => {
    if (touchStartX === null || touchStartY === null || !event.changedTouches.length) {
      return;
    }

    const distanceX = event.changedTouches[0].clientX - touchStartX;
    const distanceY = event.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(distanceX) < 52 || Math.abs(distanceX) < Math.abs(distanceY) * 1.2) {
      return;
    }

    changeLightboxPhoto(distanceX < 0 ? 1 : -1);
  },
  { passive: true }
);

document.addEventListener("keydown", (event) => {
  if (lightbox.classList.contains("is-open")) {
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeLightboxPhoto(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      changeLightboxPhoto(1);
    }
    return;
  }

  if (event.key !== "Escape") {
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
