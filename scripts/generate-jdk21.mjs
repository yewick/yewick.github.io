import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { features } from "./jdk21-content.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const escapeCode = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const statusClass = (status) => {
  if (status === "PREVIEW") return "preview";
  if (status === "INCUBATOR") return "incubator";
  if (["DEPRECATE", "PREPARE"].includes(status)) return "platform";
  return "";
};

const chapterNav = (activeSlug) => features.map((feature) => `
          <a class="chapter-link${feature.slug === activeSlug ? " active" : ""}" href="../${feature.slug}/"${feature.slug === activeSlug ? ' aria-current="page"' : ""}>
            <span class="number">${String(feature.order).padStart(2, "0")}</span>
            <span class="label">${escapeHtml(feature.title)}</span>
            <span class="status-dot" aria-hidden="true"></span>
          </a>`).join("");

const conceptMarkup = (feature) => feature.concepts.map((concept) => `
            <article class="concept-card">
              <small>${escapeHtml(concept.label)}</small>
              <h3>${escapeHtml(concept.title)}</h3>
              <p>${escapeHtml(concept.body)}</p>
            </article>`).join("");

const changesMarkup = (feature) => feature.changes
  .map((change) => `<li>${escapeHtml(change)}</li>`)
  .join("");

const notesMarkup = (feature) => feature.notes.map((note) => `
          <div class="note ${note.type === "warning" ? "warning" : note.type === "danger" ? "danger" : ""}">
            <p><strong>${escapeHtml(note.title)}：</strong>${escapeHtml(note.text)}</p>
          </div>`).join("");

const pitfallsMarkup = (feature) => feature.pitfalls.map((pitfall, index) => `
          <article class="pitfall-card">
            <div class="pitfall-number">${String(index + 1).padStart(2, "0")}<span>WATCH OUT</span></div>
            <div>
              <h3>${escapeHtml(pitfall.title)}</h3>
              <p>${escapeHtml(pitfall.body)}</p>
            </div>
          </article>`).join("");

const takeawaysMarkup = (feature) => feature.takeaways
  .map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`)
  .join("");

const previousNext = (feature) => {
  const index = features.findIndex((item) => item.slug === feature.slug);
  const previous = features[index - 1];
  const next = features[index + 1];
  return `
          <nav class="chapter-pagination" aria-label="章节翻页">
            ${previous ? `<a class="chapter-page-link" href="../${previous.slug}/"><small>← PREVIOUS · ${String(previous.order).padStart(2, "0")}</small><strong>${escapeHtml(previous.title)}</strong><span>返回上一章</span></a>` : `<a class="chapter-page-link" href="../"><small>← COURSE HUB</small><strong>JDK 21 特性地图</strong><span>返回完整目录</span></a>`}
            ${next ? `<a class="chapter-page-link next" href="../${next.slug}/"><small>NEXT · ${String(next.order).padStart(2, "0")} →</small><strong>${escapeHtml(next.title)}</strong><span>继续下一章</span></a>` : `<a class="chapter-page-link next" href="../"><small>FINISHED →</small><strong>返回 JDK 21 特性地图</strong><span>查看完整目录</span></a>`}
          </nav>`;
};

const pageTemplate = (feature) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(feature.summary)}">
  <title>${escapeHtml(feature.title)} | JDK 21 新特性</title>
  <script>
    (() => {
      const saved = localStorage.getItem("yewick-theme");
      const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = saved || preferred;
    })();
  </script>
  <link rel="stylesheet" href="../../../assets/css/site.css">
  <link rel="stylesheet" href="../../../assets/css/course.css">
  <link rel="stylesheet" href="../../../assets/css/chirpy.css">
  <script src="../../../assets/js/site.js" defer></script>
</head>
<body>
  <div class="reading-progress" aria-hidden="true"></div>
  <div class="course-menu-scrim" aria-hidden="true"></div>

  <div class="course-shell">
    <aside class="course-sidebar" aria-label="JDK 21 课程导航">
      <a class="course-brand" href="../../../">
        <span class="course-brand-mark">21</span>
        <span class="course-brand-copy"><strong>JDK 新特性实战手册</strong><span>YEWICK NOTES · CATALOG</span></span>
      </a>
      <div class="course-branch">
        <small>CATALOG / JAVA</small>
        <strong>JDK 21 · 15 JEPs</strong>
        <a href="../">查看完整特性地图 →</a>
      </div>
      <p class="course-nav-caption">COURSE INDEX</p>
      <nav class="course-nav" aria-label="课程章节">${chapterNav(feature.slug)}
      </nav>
      <div class="course-sidebar-note">
        <div class="course-progress-card">
          <small>JDK 21 · LTS RELEASE</small>
          <strong>从官方文档出发，落到代码与边界。</strong>
          <div class="progress-track"><span></span></div>
          <div class="progress-label"><span>COURSE ATLAS</span><span>15 / 15</span></div>
        </div>
      </div>
    </aside>

    <main class="course-main">
      <div class="course-topbar">
        <div class="course-breadcrumbs">
          <button class="course-menu-toggle" type="button" aria-label="打开课程导航" aria-expanded="false"><span aria-hidden="true"></span></button>
          <a href="../../../">YEWICK NOTES</a><span>/</span>
          <a href="../">JDK 21</a><span>/</span>
          <span class="current">${escapeHtml(feature.title)}</span>
        </div>
        <span class="course-topbar-label">CHAPTER ${String(feature.order).padStart(2, "0")} / 15</span>
      </div>

      <article class="course-article">
        <header class="feature-hero" data-jep="JEP ${feature.jep}">
          <div class="feature-hero-copy">
            <div class="feature-kicker">
              <span class="${statusClass(feature.status)}">${feature.status}</span>
              <span>JEP ${feature.jep}</span>
              <span>${escapeHtml(feature.category)}</span>
            </div>
            <h1>${escapeHtml(feature.title)}<em>${escapeHtml(feature.en)}</em></h1>
            <p class="feature-lead">${escapeHtml(feature.tagline)} <strong>${escapeHtml(feature.summary)}</strong></p>
            <div class="feature-meta">
              <div><strong>JDK 21</strong><span>RELEASE</span></div>
              <div><strong>JEP ${feature.jep}</strong><span>SPECIFICATION</span></div>
              <div><strong>${escapeHtml(feature.category)}</strong><span>CHAPTER</span></div>
            </div>
          </div>
          <div class="feature-hero-visual" aria-label="本章知识路线示意">
            <div class="feature-visual-bar"><span>chapter.spec</span><i></i><span>${feature.status}</span></div>
            <div class="feature-visual-body">
              <dl class="visual-spec">
                <dt>JEP</dt><dd>${feature.jep}</dd>
                <dt>domain</dt><dd>${escapeHtml(feature.category)}</dd>
                <dt>goal</dt><dd>${escapeHtml(feature.tagline)}</dd>
              </dl>
              <div class="visual-rail" aria-hidden="true"><i></i><i></i><i></i></div>
            </div>
          </div>
        </header>

        <div class="feature-source-note">
          <span>本章以 OpenJDK JEP 原文与 JDK 21 Release 为依据。</span>
          <a href="https://openjdk.org/jeps/${feature.jep}" target="_blank" rel="noreferrer">阅读 JEP ${feature.jep} ↗</a>
        </div>

        <div class="course-body">
          <section class="course-objectives" data-reveal aria-labelledby="goals-${feature.slug}">
            <div><small>LEARNING OBJECTIVES</small><strong id="goals-${feature.slug}">本章学习目标</strong></div>
            <ul class="course-goals">${feature.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul>
          </section>

          <section class="course-section" id="overview">
            <div class="course-section-kicker">01 · CONCEPTUAL MODEL</div>
            <h2 class="course-section-title"><span class="number">01</span>先抓住核心模型</h2>
            <p class="lead">${escapeHtml(feature.summary)}</p>
            <div class="concept-grid">${conceptMarkup(feature)}
            </div>
            <ul class="change-list">${changesMarkup(feature)}
            </ul>
          </section>

          <section class="course-section" id="example">
            <div class="course-section-kicker">02 · HANDS-ON</div>
            <h2 class="course-section-title"><span class="number">02</span>${escapeHtml(feature.exampleTitle)}</h2>
            <p>示例保持最小可读，重点是展示这项能力如何使用，以及它与普通 Java 代码的关系。</p>
            <div class="code-shell">
              <div class="code-shell-bar">
                <span class="code-shell-title"><span class="mini-dots" aria-hidden="true"><i></i><i></i><i></i></span>${escapeHtml(feature.filename)}</span>
                <button class="copy-code" type="button" data-copy>复制代码</button>
              </div>
              <pre><code data-lang="${escapeHtml(feature.lang)}">${escapeCode(feature.code)}</code></pre>
            </div>
            ${notesMarkup(feature)}
          </section>

          <section class="course-section" id="pitfalls">
            <div class="course-section-kicker">03 · BOUNDARIES</div>
            <h2 class="course-section-title"><span class="number">03</span>工程中的边界与易错点</h2>
            <p>能写出示例不代表可以安全迁移。下面两个问题最值得在设计和评审阶段确认。</p>
            ${pitfallsMarkup(feature)}
          </section>

          <section class="course-section" id="summary">
            <div class="course-section-kicker">04 · SUMMARY</div>
            <h2 class="course-section-title"><span class="number">04</span>本章小结</h2>
            <div class="summary-panel" data-jep="JEP ${feature.jep}">
              <small>TAKEAWAYS</small>
              <h3>${escapeHtml(feature.tagline)}</h3>
              <ul>${takeawaysMarkup(feature)}
              </ul>
            </div>
            ${previousNext(feature)}
            <footer class="course-footer">
              <span>Yewick Notes · JDK 21 / ${escapeHtml(feature.title)}</span>
              <span><a href="https://openjdk.org/projects/jdk/21/" target="_blank" rel="noreferrer">JDK 21 Project</a> · <a href="../">课程总览</a></span>
            </footer>
          </section>
        </div>
      </article>
    </main>

    <aside class="course-toc" aria-label="本章目录">
      <h2>On this page</h2>
      <nav>
        <a href="#overview">01 · 核心模型</a>
        <a href="#example">02 · 可运行示例</a>
        <a href="#pitfalls">03 · 边界与易错点</a>
        <a href="#summary">04 · 本章小结</a>
      </nav>
      <div class="course-toc-links">官方资料<br><a href="https://openjdk.org/jeps/${feature.jep}" target="_blank" rel="noreferrer">JEP ${feature.jep}</a><br><a href="../">JDK 21 目录</a></div>
    </aside>
  </div>
</body>
</html>
`;

for (const feature of features) {
  if (feature.slug === "virtualthread") continue;
  const destination = join(root, "catalog", "jdk21", feature.slug, "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, pageTemplate(feature), "utf8");
  console.log("generated", destination.replace(root + "/", ""));
}

const virtualPagePath = join(root, "catalog", "jdk21", "virtualthread", "index.html");
let virtualPage = await readFile(virtualPagePath, "utf8");
virtualPage = virtualPage.replace(/<nav class="course-nav">[\s\S]*?<\/nav>/, `<nav class="course-nav">${chapterNav("virtualthread")}
      </nav>`);
virtualPage = virtualPage.replace(
  /<div class="breadcrumbs">[\s\S]*?<\/div>\s*<div class="topbar-actions">/,
  `<div class="breadcrumbs">
          <button class="menu-toggle" id="menuToggle" type="button" aria-label="打开课程导航" aria-controls="sidebar" aria-expanded="false"><span aria-hidden="true"></span></button>
          <a href="../../../">YEWICK NOTES</a>
          <span class="breadcrumb-divider optional">/</span>
          <a href="../">JDK 21</a>
          <span class="breadcrumb-divider">/</span>
          <span>虚拟线程</span>
        </div>
        <div class="topbar-actions">`
);
virtualPage = virtualPage.replace(
  /<a class="course-link active" href="#top" aria-current="page">[\s\S]*?<\/a>/,
  `<a class="course-link active" href="#top" aria-current="page">
          <span class="index">01</span>
          <span class="title">虚拟线程</span>
          <span class="index" aria-hidden="true">⌁</span>
        </a>`
);
await writeFile(virtualPagePath, virtualPage, "utf8");
console.log("updated catalog/jdk21/virtualthread/index.html");
