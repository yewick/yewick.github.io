# yewick.github.io

Yewick Notes 的静态工程博客，使用 GitHub Pages 发布。

## 首页入口

- 受 Chirpy 启发的极简三栏结构：左侧站点导航、中间文章列表、右侧最近更新与标签
- LATEST：实验性读取本站仓库在 GitHub 上的最近一次提交
- 支持明暗主题、文章搜索、Mermaid 流程图与 KaTeX 数学公式

## Catalog

- `catalog/`：技术文档总目录
- `catalog/jdk21/`：JDK 21 的 15 个官方 JEP 教学分支
- `catalog/jdk21/virtualthread/`：虚拟线程深度教程

## 本地预览

在仓库根目录启动静态服务器：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://127.0.0.1:4173/
```

## 内容来源

JDK 21 章节以 OpenJDK 的 [JDK 21 Release](https://openjdk.org/projects/jdk/21/) 和各 JEP 原文为依据。预览与孵化功能会明确标注状态，不应直接视为跨版本稳定 API。
