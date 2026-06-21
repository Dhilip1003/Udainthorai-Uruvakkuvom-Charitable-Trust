(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll("[data-tabs]").forEach((tabsRoot) => {
    const buttons = Array.from(tabsRoot.querySelectorAll("[data-tab]"));
    const panels = Array.from(tabsRoot.querySelectorAll("[data-panel]"));

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tab;

        buttons.forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-selected", String(item === button));
        });

        panels.forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.panel === target);
        });
      });
    });
  });

  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animateCounter = (node) => {
      const target = Number(node.dataset.count);
      const suffix = node.dataset.suffix || "";
      const duration = reduceMotion ? 0 : 1400;
      const start = performance.now();

      const step = (now) => {
        const progress = duration ? Math.min((now - start) / duration, 1) : 1;
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        node.textContent = `${value}${suffix}`;

        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    counters.forEach((counter) => observer.observe(counter));
  }

  const modal = document.querySelector("[data-modal]");
  if (modal) {
    const modalTitle = modal.querySelector("[data-modal-title]");
    const modalImg = modal.querySelector("[data-modal-img]");
    const closeButtons = modal.querySelectorAll("[data-modal-close]");

    document.querySelectorAll("[data-doc-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        modalTitle.textContent = trigger.dataset.title;
        modalImg.src = trigger.dataset.image;
        modalImg.alt = trigger.dataset.title;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        closeButtons[0].focus();
      });
    });

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      modalImg.removeAttribute("src");
    };

    closeButtons.forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const formData = new FormData(form);
      const message = [
        "Udainthorai Uruvakkuvom Charitable Trust contact request",
        `Name: ${formData.get("name") || ""}`,
        `Email: ${formData.get("email") || ""}`,
        `Subject: ${formData.get("subject") || ""}`,
        `Message: ${formData.get("message") || ""}`
      ].join("\n");
      const phone = form.dataset.whatsappPhone || "919994289766";
      status.textContent = "Opening WhatsApp with your message...";
      window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    });
  }

  const createTranslationWidget = () => {
    if (document.querySelector("[data-translation-widget]")) return;

    const supportedLanguages = ["en", "ta", "hi", "kn"];
    const storageKey = "udainthorai_uruvakkuvom_charitable_trust_preferred_language";
    let translatorReady = false;
    let pendingLanguage = null;

    const widget = document.createElement("aside");
    widget.className = "translation-widget notranslate";
    widget.setAttribute("data-translation-widget", "");
    widget.setAttribute("aria-label", "Translate page");
    widget.innerHTML = `
      <button class="translation-toggle" type="button" data-translation-toggle aria-expanded="false">
        <span aria-hidden="true">A</span>
        Translate
      </button>
      <div class="translation-panel" data-translation-panel>
        <p>Translate this page</p>
        <div class="translation-options" role="group" aria-label="Website language options">
          <button type="button" data-lang="en">English</button>
          <button type="button" data-lang="ta">Tamil</button>
          <button type="button" data-lang="hi">Hindi</button>
          <button type="button" data-lang="kn">Kannada</button>
        </div>
        <div id="google_translate_element"></div>
        <small data-translation-status>Choose a language to change the website text.</small>
      </div>
    `;

    document.body.appendChild(widget);

    const translateToggle = widget.querySelector("[data-translation-toggle]");
    const panel = widget.querySelector("[data-translation-panel]");
    const languageButtons = Array.from(widget.querySelectorAll("[data-lang]"));
    const status = widget.querySelector("[data-translation-status]");
    const updateStatus = (message) => {
      status.textContent = message;
    };
    const readStoredLanguage = () => {
      try {
        return window.localStorage.getItem(storageKey);
      } catch (error) {
        return null;
      }
    };
    const writeStoredLanguage = (language) => {
      try {
        window.localStorage.setItem(storageKey, language);
      } catch (error) {
        // Ignore storage failures; the translator can still run for the current page.
      }
    };
    const setActiveLanguage = (language) => {
      languageButtons.forEach((button) => {
        const isActive = button.dataset.lang === language;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    };
    const setGoogleCookie = (language) => {
      const value = language === "en" ? "/en/en" : `/en/${language}`;
      const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
      document.cookie = `googtrans=${value}; path=/; ${expires}`;
      const hostname = window.location.hostname;
      const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
      if (hostname.includes(".") && !isIpAddress) {
        document.cookie = `googtrans=${value}; domain=${window.location.hostname}; path=/; ${expires}`;
      }
    };
    const getCurrentLanguage = () => {
      const storedLanguage = readStoredLanguage();
      if (supportedLanguages.includes(storedLanguage)) return storedLanguage;
      const cookie = document.cookie.split("; ").find((item) => item.startsWith("googtrans="));
      if (!cookie) return "en";
      const language = decodeURIComponent(cookie.split("=")[1] || "").split("/").pop();
      return supportedLanguages.includes(language) ? language : "en";
    };
    const waitForTranslateSelect = (attempt = 0) => {
      const select = document.querySelector(".goog-te-combo");
      if (select) return Promise.resolve(select);
      if (attempt >= 60) return Promise.resolve(null);

      return new Promise((resolve) => {
        window.setTimeout(() => {
          resolve(waitForTranslateSelect(attempt + 1));
        }, 100);
      });
    };
    const applyLanguage = async (language, shouldPersist = true) => {
      const normalizedLanguage = supportedLanguages.includes(language) ? language : "en";
      pendingLanguage = normalizedLanguage;
      setActiveLanguage(normalizedLanguage);
      setGoogleCookie(normalizedLanguage);

      if (shouldPersist) {
        writeStoredLanguage(normalizedLanguage);
      }

      if (!translatorReady) {
        updateStatus("Loading translator...");
        return;
      }

      const select = await waitForTranslateSelect();
      if (!select) {
        updateStatus("Translator could not load. Check internet access and try again.");
        return;
      }

      select.value = normalizedLanguage === "en" ? "" : normalizedLanguage;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      updateStatus(normalizedLanguage === "en" ? "Website language set to English." : "Website language changed.");

      if (normalizedLanguage === "en" && shouldPersist) {
        window.setTimeout(() => window.location.reload(), 250);
      }
    };

    const initialLanguage = getCurrentLanguage();
    pendingLanguage = initialLanguage;
    setActiveLanguage(initialLanguage);
    setGoogleCookie(initialLanguage);

    translateToggle.addEventListener("click", () => {
      const isOpen = widget.classList.toggle("open");
      translateToggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        const activeButton = panel.querySelector(".translation-options button.active");
        if (activeButton) activeButton.focus();
      }
    });

    languageButtons.forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.lang));
    });

    window.googleTranslateElementInit = function () {
      if (!window.google || !window.google.translate) return;
      new window.google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "ta,hi,kn",
        autoDisplay: false
      }, "google_translate_element");
      translatorReady = true;
      applyLanguage(pendingLanguage || getCurrentLanguage(), false);
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      panel.insertAdjacentHTML("beforeend", "<small>Translation service could not load.</small>");
    };
    document.head.appendChild(script);
  };

  createTranslationWidget();
})();
