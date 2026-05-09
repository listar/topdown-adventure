#!/usr/bin/env bash
# 触发 GitHub Actions 将当前仓库部署到 GitHub Pages（不打包、不上传源码，仅排队云端构建）。
# 依赖：已安装并登录 https://cli.github.com/ 的 `gh`，且默认 remote 指向本仓库。

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "请先安装 GitHub CLI: https://cli.github.com/  并执行 gh auth login"
  exit 1
fi

REF="${1:-main}"
echo "触发工作流: Deploy static site to GitHub Pages (pages.yml)，ref=$REF ..."
gh workflow run pages.yml --ref "$REF"

echo "已提交运行请求。查看进度:"
echo "  gh run list --workflow=pages.yml -L 5"
echo "或在浏览器打开: 仓库 Actions 页面"
