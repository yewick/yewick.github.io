(() => {
  const progress = document.querySelector(".reading-progress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    progress.style.width = value + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

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

  const tocLinks = Array.from(document.querySelectorAll(".course-toc a[href^='#']"));
  const sections = tocLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", active);
        });
      });
    }, { rootMargin: "-16% 0px -70% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  const body = document.body;
  const navToggle = document.querySelector(".course-menu-toggle");
  const navScrim = document.querySelector(".course-menu-scrim");
  const closeNav = () => {
    body.classList.remove("course-nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };
  navToggle?.addEventListener("click", () => {
    const open = body.classList.toggle("course-nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navScrim?.addEventListener("click", closeNav);
  document.querySelectorAll(".course-nav a").forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

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
})();
