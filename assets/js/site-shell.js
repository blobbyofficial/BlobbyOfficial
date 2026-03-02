(() => {
  const STORAGE_KEY = "blobby-theme";
  const THEME_COLORS = {
    dark: "#0b1020",
    light: "#eef4fb"
  };

  const root = document.documentElement;
  const body = document.body;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  const desktopViewport = window.matchMedia("(min-width: 1024px)");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const queryAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function listen(mediaQuery, handler) {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handler);
      return;
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handler);
    }
  }

  function isVisible(element) {
    return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }

  function getSystemTheme() {
    return prefersDark.matches ? "dark" : "light";
  }

  function getCurrentTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }

  function applyTheme(theme, persist = false) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const alternateTheme = nextTheme === "dark" ? "light" : "dark";

    root.dataset.theme = nextTheme;

    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute("content", nextTheme);
    }

    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[nextTheme]);
    }

    queryAll("[data-theme-label]").forEach((label) => {
      label.textContent = nextTheme === "light" ? "Light mode" : "Dark mode";
    });

    queryAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", `Switch to ${alternateTheme} mode`);
      button.setAttribute("title", `Switch to ${alternateTheme} mode`);
      button.setAttribute("aria-pressed", String(nextTheme === "light"));
      button.dataset.themeValue = nextTheme;
    });

    if (persist) {
      saveTheme(nextTheme);
    }
  }

  function setYear() {
    queryAll("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function normalizePath(path) {
    const cleanedPath = path.replace(/\/index\.html$/i, "/");

    if (!cleanedPath || cleanedPath === "/") {
      return "/";
    }

    return cleanedPath.endsWith("/") ? cleanedPath : `${cleanedPath}/`;
  }

  function setupPageLinkHighlight() {
    const currentPath = normalizePath(window.location.pathname);

    queryAll("[data-page-link]").forEach((link) => {
      const targetPath = normalizePath(link.dataset.pageLink || link.getAttribute("href") || "");
      const isCurrent = currentPath === targetPath;

      link.classList.toggle("is-current", isCurrent);

      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setupThemeToggle() {
    const buttons = queryAll("[data-theme-toggle]");

    if (!buttons.length) {
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
      });
    });

    listen(prefersDark, (event) => {
      if (getStoredTheme()) {
        return;
      }

      applyTheme(event.matches ? "dark" : "light", false);
    });
  }

  function setupDrawer() {
    const drawer = document.querySelector("[data-nav-drawer]");
    const panel = drawer?.querySelector(".nav-drawer__panel");
    const toggle = document.querySelector("[data-nav-toggle]");
    const backdrop = drawer?.querySelector("[data-nav-backdrop]");
    const closeButtons = drawer ? queryAll("[data-nav-close]", drawer) : [];
    const drawerLinks = drawer ? queryAll("a[href]", drawer) : [];

    if (!drawer || !panel || !toggle || !body) {
      return;
    }

    let previouslyFocused = null;

    function getFocusableElements() {
      return queryAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        panel
      ).filter(isVisible);
    }

    function closeDrawer(restoreFocus = true) {
      if (drawer.hidden) {
        return;
      }

      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      body.classList.remove("shell-nav-open");

      window.setTimeout(
        () => {
          drawer.hidden = true;
        },
        prefersReducedMotion.matches ? 0 : 220
      );

      if (restoreFocus && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    }

    function openDrawer() {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      drawer.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      body.classList.add("shell-nav-open");

      requestAnimationFrame(() => {
        drawer.classList.add("is-open");
        const [firstFocusable] = getFocusableElements();
        firstFocusable?.focus();
      });
    }

    toggle.addEventListener("click", () => {
      if (drawer.hidden) {
        openDrawer();
      } else {
        closeDrawer();
      }
    });

    backdrop?.addEventListener("click", () => closeDrawer());
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => closeDrawer());
    });

    drawerLinks.forEach((link) => {
      link.addEventListener("click", () => closeDrawer(false));
    });

    drawer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements();

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    listen(desktopViewport, (event) => {
      if (event.matches) {
        closeDrawer(false);
      }
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      },
      { once: true }
    );
  }

  function init() {
    applyTheme(getStoredTheme() || getSystemTheme(), false);
    setYear();
    setupPageLinkHighlight();
    setupThemeToggle();
    setupDrawer();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
