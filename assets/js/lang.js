(function () {
  const STORAGE_KEY = "felipe-rocha-language";
  const allowed = new Set(["en", "pt"]);

  function getInitialLanguage() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("lang");
    if (allowed.has(requested)) return requested;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (allowed.has(saved)) return saved;

    return "en";
  }

  function readMetaValue(name, lang) {
    const node = document.querySelector(`meta[name="${name}"][data-${lang}]`);
    return node ? node.getAttribute(`data-${lang}`) : null;
  }

  function applyLanguage(lang) {
    const normalized = allowed.has(lang) ? lang : "en";
    document.documentElement.dataset.lang = normalized;
    document.documentElement.lang = normalized === "pt" ? "pt-BR" : "en";

    const title = document.body.getAttribute(`data-title-${normalized}`);
    if (title) document.title = title;

    const description = readMetaValue("description", normalized);
    const descriptionNode = document.querySelector('meta[name="description"]');
    if (description && descriptionNode) descriptionNode.setAttribute("content", description);

    document.querySelectorAll("[data-lang-option]").forEach((button) => {
      const active = button.dataset.langOption === normalized;
      button.setAttribute("aria-pressed", String(active));
    });

    localStorage.setItem(STORAGE_KEY, normalized);
  }

  function visibleText(node) {
    if (!node) return "";
    const clone = node.cloneNode(true);
    clone.querySelectorAll("[class*='lang-']").forEach((child) => {
      if (child.classList.contains("lang-pt")) child.remove();
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function prepareTitles() {
    document.querySelectorAll(".page-title, .territory-title").forEach((title) => {
      const text = visibleText(title);
      if (text.length > 26 || text.split(/\s+/).length > 4) {
        title.classList.add("is-long-title");
      }
    });
  }

  function updateMediaState(media, state) {
    media.classList.remove("is-loading", "is-loaded", "is-empty", "is-missing");
    media.classList.add(`is-${state}`);
  }

  function prepareMedia() {
    document.querySelectorAll(".media").forEach((media) => {
      const asset = media.querySelector("img, video");
      if (!asset) {
        updateMediaState(media, "empty");
        return;
      }

      updateMediaState(media, "loading");

      const markLoaded = () => {
        const width = asset.naturalWidth || asset.videoWidth || 0;
        const height = asset.naturalHeight || asset.videoHeight || 0;
        if (width <= 16 && height <= 16) {
          asset.hidden = true;
          updateMediaState(media, "empty");
        } else {
          updateMediaState(media, "loaded");
        }
      };

      const markMissing = () => {
        asset.hidden = true;
        updateMediaState(media, "missing");
      };

      if (asset.tagName === "IMG") {
        asset.decoding = asset.decoding || "async";
        if (!asset.loading) asset.loading = "lazy";
        if (asset.complete) {
          if (asset.naturalWidth > 0) markLoaded();
          else markMissing();
        } else {
          asset.addEventListener("load", markLoaded, { once: true });
          asset.addEventListener("error", markMissing, { once: true });
        }
      } else {
        asset.addEventListener("loadedmetadata", markLoaded, { once: true });
        asset.addEventListener("error", markMissing, { once: true });
      }
    });
  }

  function prepareAudio() {
    document.querySelectorAll(".audio-slot").forEach((slot) => {
      const audio = slot.querySelector("audio");
      if (!audio) return;

      const markLoaded = () => slot.classList.add("is-loaded");
      const markMissing = () => {
        audio.hidden = true;
        slot.classList.remove("is-loaded");
        slot.classList.add("is-missing");
      };

      audio.addEventListener("canplay", markLoaded, { once: true });
      audio.addEventListener("error", markMissing, { once: true });
      if (audio.readyState > 0) markLoaded();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    prepareTitles();
    prepareMedia();
    prepareAudio();

    document.querySelectorAll("[data-lang-option]").forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.langOption));
    });

    applyLanguage(getInitialLanguage());
  });
})();
