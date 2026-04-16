#!/usr/bin/env bash
# 本地压缩包，或从 GitHub Releases 拉取 notion-linux-{x64|arm64}.tar.xz 并安装到 PREFIX。
#
#   curl -sfL https://raw.githubusercontent.com/OWNER/notion-linux/main/install.sh | bash
#   NOTION_LINUX_REPO=OWNER/notion-linux NOTION_LINUX_VERSION=v1.0.0 bash -s </dev/null
#   ./install.sh [压缩包路径]

set -euo pipefail

APP_NAME="Notion-Linux"
NOTION_LINUX_REPO="${NOTION_LINUX_REPO:-LJTian/notion-linux}"
PREFIX="${PREFIX:-$HOME/.local}"
BINDIR="${BINDIR:-$PREFIX/bin}"
DATADIR="${DATADIR:-$PREFIX/share/notion-linux}"

detect_arch() {
  case "$(uname -m)" in
    x86_64) echo x64 ;;
    aarch64|arm64) echo arm64 ;;
    *)
      echo "不支持的机器架构: $(uname -m)（仅 x86_64 / aarch64）" >&2
      exit 1
      ;;
  esac
}

# 输出可用的压缩包路径：参数文件 > 当前目录 > 下载到 tmp_dir/download.bin
resolve_tarball() {
  local user_arg="${1:-}" arch="$2" tmp_dir="$3"
  local f ext url target

  if [[ -n "$user_arg" ]]; then
    [[ -f "$user_arg" ]] || { echo "找不到文件: $user_arg" >&2; exit 1; }
    echo "$user_arg"
    return
  fi

  for ext in tar.xz tar.gz; do
    f="notion-linux-${arch}.${ext}"
    if [[ -f "$f" ]]; then
      echo "$f"
      return
    fi
  done

  command -v curl >/dev/null 2>&1 || {
    echo "未找到本地 notion-linux-${arch}.tar.xz/.tar.gz，且未安装 curl，无法下载" >&2
    echo "请从 https://github.com/${NOTION_LINUX_REPO}/releases 下载后执行: $0 /path/to/文件" >&2
    exit 1
  }

  if [[ -n "${NOTION_LINUX_VERSION:-}" ]]; then
    url="https://github.com/${NOTION_LINUX_REPO}/releases/download/${NOTION_LINUX_VERSION}/notion-linux-${arch}.tar.xz"
  else
    url="https://github.com/${NOTION_LINUX_REPO}/releases/latest/download/notion-linux-${arch}.tar.xz"
  fi

  target="${tmp_dir}/download.tar.xz"
  echo "下载: $url" >&2
  curl -fsSL -o "$target" "$url"
  echo "$target"
}

main() {
  local arch tmp tarpath appdir
  arch="$(detect_arch)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  tarpath="$(resolve_tarball "${1:-}" "$arch" "$tmp")"
  echo "安装前缀: $PREFIX" >&2

  case "$tarpath" in
    *.tar.xz|*.txz) tar -xJf "$tarpath" -C "$tmp" ;;
    *.tar.gz|*.tgz) tar -xzf "$tarpath" -C "$tmp" ;;
    *)
      echo "不支持的压缩包: $tarpath" >&2
      exit 1
      ;;
  esac

  appdir="$(find "$tmp" -maxdepth 1 -type d -name "${APP_NAME}-linux-*" | head -1)"
  [[ -n "$appdir" ]] || { echo "压缩包内未找到 ${APP_NAME}-linux-*" >&2; exit 1; }
  [[ -x "$appdir/$APP_NAME" ]] || chmod +x "$appdir/$APP_NAME"

  install -d "$DATADIR"
  cp -a "$appdir"/. "$DATADIR"/
  install -d "$BINDIR"
  ln -sf "../share/notion-linux/$APP_NAME" "$BINDIR/notion-linux"
  if [[ -f "$DATADIR/notion-linux-mux" ]]; then
    chmod +x "$DATADIR/notion-linux-mux"
    ln -sf "../share/notion-linux/notion-linux-mux" "$BINDIR/notion-linux-mux"
  fi

  echo "安装完成: $BINDIR/notion-linux" >&2
  if [[ -f "$DATADIR/notion-linux-mux" ]]; then
    echo "多窗口管理器: $BINDIR/notion-linux-mux" >&2
  fi
  echo "请确认 $BINDIR 在 PATH 中" >&2
}

main "$@"
