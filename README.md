# 仙踪奇缘 · Topdown Adventure

受《梦幻西游》启发的 **2D 竖屏回合制 RPG** 浏览器 Demo：探索场景、对话、任务与回合战斗。设计目标见仓库内 [`design-doc.md`](design-doc.md)。

## 技术栈

- **渲染**：HTML5 Canvas 2D（内部分辨率 384×640，CSS 适配手机竖屏）
- **逻辑**：原生 JavaScript（无构建步骤、无 npm 依赖）
- **资源**：`art/` 下 PNG 精灵与场景图（可由 `art/` 内 Python 脚本再生成）

## 本地运行

仓库根目录即为静态站点根路径，需用 **HTTP 服务** 打开（直接 `file://` 打开可能受浏览器安全策略影响）。

```bash
cd /path/to/topdown-adventure
python3 -m http.server 8080
```

浏览器访问：<http://localhost:8080>

或使用任意静态服务器，例如：`npx --yes serve -p 8080`。

## 目录结构

| 路径 | 说明 |
|------|------|
| `index.html` | 入口页 |
| `style.css` | 全局样式（手机框、画布缩放等） |
| `js/` | 游戏逻辑：`game.js` 主循环与资源；`battle.js` 战斗；`scenes.js` / `npc.js` / `quests.js` 等 |
| `art/assets/` | UI 与过场卡片等图 |
| `art/scenes/` | 场景背景与装饰精灵 |
| `art/tiles/` | 瓦片与道具图 |
| `art/*.py` | 美术资源生成脚本（需 Python 与 Pillow 等，见各文件头部说明） |
| `design-doc.md` | 游戏设计文档（GDD） |

## 在 GitHub 上在线访问（GitHub Pages）

本仓库包含 [GitHub Actions 工作流](.github/workflows/pages.yml)：在推送 `main` 分支后自动把可运行站点部署到 **GitHub Pages**。

### 一次性配置（顺序很重要）

1. 将本仓库推送到 GitHub（例如 `https://github.com/<你的用户名>/topdown-adventure`）。
2. **先**打开仓库 **Settings → Pages**。
3. 在 **Build and deployment** 里，把 **Source** 设为 **GitHub Actions**，并保存（页面里会说明将通过 Actions 发布）。  
   **若仍为 “Deploy from a branch” 或从未打开过 Pages，工作流在部署阶段可能失败。**
4. **再**推送到 `main`（或手动 **Run workflow**），等待 “Deploy static site to GitHub Pages” 变绿。

### 故障排除

| 现象 | 处理 |
|------|------|
| `Get Pages site failed` / `Not Found`（与 `configure-pages` 或 Pages API 相关） | 已在工作流中去掉 `configure-pages`。若仍失败，请确认第 3 步已把 **Source** 设为 **GitHub Actions**，保存后重新运行工作流。 |
| 私有仓库部署异常 | 确认仓库 **Settings → Actions → General** 里 Workflow permissions 允许读写；私有仓库的 Pages 可能受套餐限制，见 [GitHub 文档](https://docs.github.com/pages/getting-started-with-github-pages/about-github-pages)。 |

### 访问地址

项目站点的默认 URL 为：

```text
https://<你的用户名>.github.io/<仓库名>/
```

例如仓库名为 `topdown-adventure` 时，游戏入口为：

```text
https://<你的用户名>.github.io/topdown-adventure/
```

若使用组织或自定义域名，以 GitHub Pages 设置页显示的 URL 为准。

### 手动再次部署

在 Actions 页面选择该工作流，点击 **Run workflow** 即可在不改代码的情况下重新部署当前 `main`。

或在已安装 [GitHub CLI](https://cli.github.com/) 且已 `gh auth login` 的机器上执行：

```bash
./scripts/publish-github-pages.sh
```

默认从分支 `main` 触发；若要部署其他分支：`./scripts/publish-github-pages.sh 你的分支名`。

## 许可与贡献

若你尚未添加许可证，可在仓库根目录补充 `LICENSE` 后再开源。欢迎通过 Issue / PR 讨论玩法与代码改进。
