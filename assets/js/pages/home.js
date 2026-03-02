/* Home page interactions (modular static entry) */
(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const roomyViewport = window.matchMedia("(min-width: 768px)");
  const wideViewport = window.matchMedia("(min-width: 1024px)");

  const queryAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function revealContent() {
    const items = queryAll("[data-reveal]");

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  function formatCounterValue(value, counter) {
    const suffix = counter.dataset.suffix || "";
    const format = counter.dataset.format || "number";
    const decimals = Number(counter.dataset.decimals || (format === "compact" ? 1 : 0));
    const formatter = new Intl.NumberFormat("en-US", {
      notation: format === "compact" ? "compact" : "standard",
      maximumFractionDigits: decimals
    });

    return `${formatter.format(value)}${suffix}`;
  }

  function animateCounter(counter) {
    const target = Number(counter.dataset.counter || 0);
    const duration = 1400;
    const start = performance.now();

    function step(timestamp) {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = target * eased;

      counter.textContent = formatCounterValue(value, counter);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        counter.textContent = formatCounterValue(target, counter);
      }
    }

    requestAnimationFrame(step);
  }

  function setupCounters() {
    const counters = queryAll("[data-counter]");

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      counters.forEach((counter) => {
        counter.textContent = formatCounterValue(Number(counter.dataset.counter || 0), counter);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.55
      }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function setupMagneticButtons() {
    if (prefersReducedMotion.matches || !finePointer.matches || !roomyViewport.matches) {
      return;
    }

    queryAll(".magnetic").forEach((button) => {
      function resetButton() {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
        button.classList.remove("is-tilting");
      }

      button.addEventListener("pointermove", (event) => {
        const bounds = button.getBoundingClientRect();
        const offsetX = event.clientX - bounds.left - bounds.width / 2;
        const offsetY = event.clientY - bounds.top - bounds.height / 2;

        button.style.setProperty("--magnetic-x", `${offsetX * 0.12}px`);
        button.style.setProperty("--magnetic-y", `${offsetY * 0.12}px`);
        button.classList.add("is-tilting");
      });

      button.addEventListener("pointerleave", resetButton);
      button.addEventListener("blur", resetButton);
    });
  }

  function setupHeroSpotlight() {
    const heroStage = document.querySelector(".hero-stage");

    if (!heroStage || prefersReducedMotion.matches || !finePointer.matches || !wideViewport.matches) {
      return;
    }

    heroStage.addEventListener("pointermove", (event) => {
      const bounds = heroStage.getBoundingClientRect();
      heroStage.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
      heroStage.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
    });

    heroStage.addEventListener("pointerleave", () => {
      heroStage.style.removeProperty("--spotlight-x");
      heroStage.style.removeProperty("--spotlight-y");
    });
  }

  function setActiveSectionLinks(links, activeId) {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setupActiveNavigation() {
    const navLinks = queryAll('[data-section-link][href^="#"]');
    const sections = [];
    const sectionIds = new Set();

    navLinks.forEach((link) => {
      const targetId = (link.getAttribute("href") || "").slice(1);
      const targetSection = targetId ? document.getElementById(targetId) : null;

      if (!targetSection) {
        return;
      }

      if (!sectionIds.has(targetId)) {
        sections.push(targetSection);
        sectionIds.add(targetId);
      }

      link.addEventListener("click", () => {
        setActiveSectionLinks(navLinks, targetId);
      });
    });

    if (!navLinks.length || !sections.length) {
      return;
    }

    const requestedHash = window.location.hash ? window.location.hash.slice(1) : "";
    let activeId = sectionIds.has(requestedHash) ? requestedHash : sections[0].id;
    setActiveSectionLinks(navLinks, activeId);

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const visibility = new Map(sections.map((section) => [section.id, 0]));

    function getFallbackSectionId() {
      const threshold = window.innerHeight * 0.35;
      let fallbackId = sections[0].id;

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= threshold) {
          fallbackId = section.id;
        }
      });

      return fallbackId;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let nextId = getFallbackSectionId();
        let bestRatio = visibility.get(nextId) || 0;

        visibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            nextId = id;
          }
        });

        if (nextId !== activeId) {
          activeId = nextId;
          setActiveSectionLinks(navLinks, activeId);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.12, 0.25, 0.45, 0.65]
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function getProgressState(percent) {
    if (percent >= 100) {
      return "complete";
    }

    if (percent >= 90) {
      return "shake-strong";
    }

    if (percent >= 75) {
      return "shake-soft";
    }

    if (percent >= 50) {
      return "glow";
    }

    if (percent >= 10) {
      return "regular";
    }

    return "simple";
  }

  function getProgressLabel(percent) {
    if (percent >= 100) {
      return "Complete";
    }

    if (percent >= 90) {
      return "Exporting";
    }

    if (percent >= 75) {
      return "Final Pass";
    }

    if (percent >= 50) {
      return "Polishing";
    }

    if (percent >= 10) {
      return "In Progress";
    }

    return "Planning";
  }

  function setupProgressBars() {
    queryAll("[data-progress-card]").forEach((card) => {
      const rawPercent = Number(card.dataset.percent || 0);
      const percent = Number.isFinite(rawPercent)
        ? Math.min(Math.max(Math.round(rawPercent), 0), 100)
        : 0;
      const visualPercent = percent === 0 ? 2 : percent;
      const state = getProgressState(percent);
      const label = getProgressLabel(percent);
      const valueNode = card.querySelector("[data-progress-value]");
      const statusNode = card.querySelector("[data-progress-status]");
      const track = card.querySelector("[data-progress-track]");

      card.dataset.progressState = state;
      card.style.setProperty("--progress-width", `${visualPercent}%`);

      if (valueNode) {
        valueNode.textContent = `${percent}%`;
      }

      if (statusNode) {
        statusNode.textContent = label;
      }

      if (track) {
        track.setAttribute("aria-valuenow", String(percent));
        track.setAttribute("aria-valuetext", `${percent}% ${label}`);
      }
    });
  }

  function setupStoreFilters() {
    const buttons = queryAll("[data-store-filter]");
    const grid = document.querySelector("[data-store-grid]");
    const items = grid ? queryAll("[data-store-item]", grid) : [];
    const results = document.querySelector("[data-store-results]");

    if (!buttons.length || !grid || !items.length) {
      return;
    }

    function getFilterLabel(filter) {
      const match = buttons.find((button) => button.dataset.storeFilter === filter);
      return match?.textContent?.trim() || filter;
    }

    function updateResults(filter, visibleCount) {
      if (!results) {
        return;
      }

      if (filter === "all") {
        results.textContent = `Showing all ${visibleCount} preview ${visibleCount === 1 ? "pack" : "packs"}.`;
        return;
      }

      const label = getFilterLabel(filter).toLowerCase();
      results.textContent = `Showing ${visibleCount} ${label} preview ${visibleCount === 1 ? "pack" : "packs"}.`;
    }

    function applyFilter(filter) {
      let visibleCount = 0;

      buttons.forEach((button) => {
        const isActive = button.dataset.storeFilter === filter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      items.forEach((item) => {
        const matches = filter === "all" || item.dataset.storeCategory === filter;
        item.hidden = !matches;

        if (matches) {
          visibleCount += 1;
        }
      });

      grid.dataset.activeFilter = filter;
      grid.dataset.visibleCount = String(visibleCount);
      updateResults(filter, visibleCount);
    }

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        applyFilter(button.dataset.storeFilter || "all");
      });

      button.addEventListener("keydown", (event) => {
        let nextIndex = index;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % buttons.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = buttons.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        buttons[nextIndex].focus();
      });
    });

    const initialFilter =
      buttons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.storeFilter ||
      "all";

    applyFilter(initialFilter);
  }

  function setupCustomCursor() {
    const root = document.documentElement;
    const body = document.body;
    const ring = document.querySelector(".cursor-ring");
    const dot = document.querySelector(".cursor-dot");

    if (
      prefersReducedMotion.matches ||
      !finePointer.matches ||
      !wideViewport.matches ||
      !body ||
      !ring ||
      !dot
    ) {
      return;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    body.classList.add("has-custom-cursor", "cursor-hidden");

    function renderCursor() {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;

      root.style.setProperty("--cursor-dot-x", `${pointerX}px`);
      root.style.setProperty("--cursor-dot-y", `${pointerY}px`);
      root.style.setProperty("--cursor-ring-x", `${ringX}px`);
      root.style.setProperty("--cursor-ring-y", `${ringY}px`);

      requestAnimationFrame(renderCursor);
    }

    function hideCursor() {
      body.classList.add("cursor-hidden");
      body.classList.remove("cursor-hovering", "cursor-pressing");
    }

    function showCursor(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      body.classList.remove("cursor-hidden");
    }

    window.addEventListener("pointermove", showCursor);
    window.addEventListener("pointerdown", () => body.classList.add("cursor-pressing"));
    window.addEventListener("pointerup", () => body.classList.remove("cursor-pressing"));
    window.addEventListener("blur", hideCursor);
    document.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        hideCursor();
      }
    });

    queryAll("a, button, [role='button']").forEach((node) => {
      node.addEventListener("pointerenter", () => body.classList.add("cursor-hovering"));
      node.addEventListener("pointerleave", () => body.classList.remove("cursor-hovering"));
      node.addEventListener("focus", () => body.classList.add("cursor-hovering"));
      node.addEventListener("blur", () => body.classList.remove("cursor-hovering"));
    });

    renderCursor();
  }

  function init() {
    document.documentElement.dataset.revealReady = "true";
    revealContent();
    setupCounters();
    setupMagneticButtons();
    setupHeroSpotlight();
    setupActiveNavigation();
    setupProgressBars();
    setupStoreFilters();
    setupCustomCursor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
