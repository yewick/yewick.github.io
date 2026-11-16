(async () => {
  const root = document.documentElement;
  const body = document.body;
  const progress = document.querySelector(".reading-progress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    progress.style.width = value + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const getTheme = () => {
    try {
      return localStorage.getItem("yewick-theme")
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  };

  const themeIcon = `
    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.4A8.2 8.2 0 0 1 8.6 4a8.4 8.4 0 1 0 11.4 11.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;

  const ensureThemeToggle = () => {
    if (document.querySelector("[data-theme-toggle]")) return;
    const host = document.querySelector(".course-topbar, .topbar, .site-header-inner");
    if (!host) return;
    const button = document.createElement("button");
    button.className = "theme-toggle";
    button.type = "button";
    button.dataset.themeToggle = "";
    button.setAttribute("aria-label", "切换深色模式");
    button.innerHTML = themeIcon;
    host.appendChild(button);
  };

  const updateThemeControls = (theme) => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const isDark = theme === "dark";
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
    });
  };

  let mermaidApi = null;
  const renderDiagrams = async () => {
    const nodes = Array.from(document.querySelectorAll(".mermaid"));
    if (!nodes.length) return;
    nodes.forEach((node) => {
      if (!node.dataset.source) node.dataset.source = node.textContent.trim();
      node.textContent = node.dataset.source;
      node.removeAttribute("data-processed");
    });
    try {
      if (!mermaidApi) {
        const module = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
        mermaidApi = module.default;
      }
      mermaidApi.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: root.dataset.theme === "dark" ? "dark" : "default",
        fontFamily: getComputedStyle(body).fontFamily
      });
      await mermaidApi.run({ nodes });
    } catch {
      nodes.forEach((node) => node.setAttribute("data-render-error", "true"));
    }
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("yewick-theme", theme);
    } catch {}
    updateThemeControls(theme);
    renderDiagrams();
  };

  ensureThemeToggle();
  applyTheme(root.dataset.theme || getTheme());
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px" });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("revealed"));
  }

  const tocLinks = Array.from(document.querySelectorAll(".course-toc a[href^='#'], .toc-list a[href^='#']"));
  const sections = tocLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-16% 0px -70% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  const closeNav = () => {
    body.classList.remove("course-nav-open");
    body.classList.remove("chirpy-nav-open");
    document.querySelector(".course-menu-toggle, #chirpyMenu")?.setAttribute("aria-expanded", "false");
  };

  const courseNavToggle = document.querySelector(".course-menu-toggle");
  courseNavToggle?.addEventListener("click", () => {
    const open = body.classList.toggle("course-nav-open");
    courseNavToggle.setAttribute("aria-expanded", String(open));
  });

  const chirpyNavToggle = document.querySelector("#chirpyMenu");
  chirpyNavToggle?.addEventListener("click", () => {
    const open = body.classList.toggle("chirpy-nav-open");
    chirpyNavToggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelector(".course-menu-scrim, #chirpyScrim")?.addEventListener("click", closeNav);
  document.querySelectorAll(".course-nav a, .chirpy-nav a").forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  const searchInput = document.getElementById("articleSearch");
  const searchEmpty = document.getElementById("searchEmpty");
  if (searchInput) {
    const cards = Array.from(document.querySelectorAll("[data-article-card]"));
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLocaleLowerCase("zh-CN");
      let visible = 0;
      cards.forEach((card) => {
        const matches = !query || String(card.dataset.search || card.textContent).toLocaleLowerCase("zh-CN").includes(query);
        card.style.display = matches ? "" : "none";
        if (matches) visible += 1;
      });
      if (searchEmpty) searchEmpty.style.display = visible ? "none" : "block";
    });
  }

  const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const highlight = (code, lang) => {
    if (lang === "bash") {
      return escapeHtml(code).replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>');
    }
    const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*")|(\b(?:public|private|protected|class|interface|record|sealed|permits|non-sealed|static|final|void|return|new|try|catch|finally|throw|throws|import|package|if|else|for|while|var|true|false|null|boolean|int|long|float|double|this|when|case|default|yield)\b)|(\b(?:String|Thread|Duration|Executors|IntStream|List|Map|Set|SequencedCollection|ScopedValue|StructuredTaskScope|KEM|KeyPairGenerator|MemorySegment|Arena|FloatVector|VectorSpecies)\b)|(\b\d[\d_]*\b)/g;
    let last = 0;
    let result = "";
    let match;
    while ((match = pattern.exec(code)) !== null) {
      result += escapeHtml(code.slice(last, match.index));
      const token = escapeHtml(match[0]);
      if (match[1]) result += `<span class="tok-comment">${token}</span>`;
      else if (match[2]) result += `<span class="tok-string">${token}</span>`;
      else if (match[3]) result += `<span class="tok-keyword">${token}</span>`;
      else if (match[4]) result += `<span class="tok-type">${token}</span>`;
      else result += `<span class="tok-number">${token}</span>`;
      last = match.index + match[0].length;
    }
    return result + escapeHtml(code.slice(last));
  };

  document.querySelectorAll("pre code[data-lang]").forEach((block) => {
    block.innerHTML = highlight(block.textContent, block.dataset.lang);
  });

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.closest(".code-shell")?.querySelector("code");
      if (!target) return;
      const original = button.textContent;
      try {
        await copyText(target.textContent);
        button.textContent = "已复制";
        button.classList.add("copied");
      } catch {
        button.textContent = "复制失败";
      }
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copied");
      }, 1500);
    });
  });

  const renderMath = async () => {
    const nodes = Array.from(document.querySelectorAll("[data-math]"));
    if (!nodes.length) return;
    try {
      if (!window.katex) {
        if (!document.querySelector('link[data-katex-css]')) {
          const stylesheet = document.createElement("link");
          stylesheet.rel = "stylesheet";
          stylesheet.href = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css";
          stylesheet.dataset.katexCss = "";
          document.head.appendChild(stylesheet);
        }
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js";
          script.defer = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      nodes.forEach((node) => {
        window.katex.render(node.dataset.math || node.textContent, node, {
          displayMode: true,
          throwOnError: false
        });
      });
    } catch {
      nodes.forEach((node) => node.setAttribute("data-render-error", "true"));
    }
  };

  renderMath();

  const latestCommitSubject = document.getElementById("latestCommitSubject");
  const latestCommitMeta = document.getElementById("latestCommitMeta");
  const latestCommitLink = document.getElementById("latestCommitLink");

  if (latestCommitSubject && latestCommitMeta && latestCommitLink) {
    const cacheKey = "yewick-latest-commit-v1";
    const renderLatestCommit = (commit) => {
      if (!commit?.subject) return;
      latestCommitSubject.textContent = commit.subject;
      latestCommitMeta.textContent = `yewick.github.io · ${commit.dateLabel || "main"}`;
      if (commit.url?.startsWith("https://github.com/yewick/")) {
        latestCommitLink.href = commit.url;
      }
    };

    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.savedAt < 10 * 60 * 1000) {
        renderLatestCommit(cached);
      } else {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 6000);
        const response = await fetch(
          "https://api.github.com/repos/yewick/yewick.github.io/commits/main",
          {
            signal: controller.signal,
            headers: { Accept: "application/vnd.github+json" }
          }
        );
        window.clearTimeout(timeout);
        if (!response.ok) throw new Error("GitHub API unavailable");
        const data = await response.json();
        const commit = {
          subject: String(data.commit?.message || "").split("\n")[0],
          dateLabel: new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          }).format(new Date(data.commit?.author?.date || Date.now())),
          url: data.html_url,
          savedAt: Date.now()
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(commit));
        renderLatestCommit(commit);
      }
    } catch {
      latestCommitMeta.textContent = "yewick.github.io · main";
    }
  }
})();
