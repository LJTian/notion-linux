# Notion-Linux

用 [Nativefier](https://github.com/nativefier/nativefier) 把 Notion 网页包成 **Linux** 应用（**x64** / **arm64**）。开源供学习与非商业使用。

## 一条命令安装

默认从仓库 **`LJTian/notion-linux`** 的 **GitHub Releases** 拉取与本机架构匹配的 `notion-linux-*.tar.xz`：

```bash
curl -sfL https://raw.githubusercontent.com/LJTian/notion-linux/main/install.sh | bash
```

- Fork 后请把 URL 里的 `LJTian/notion-linux` 改成你的 **`用户/仓库`**，或设置环境变量：`NOTION_LINUX_REPO=用户/仓库`。
- 安装指定版本（Release 标签名，如 `v1.0.0` 或 `v1.0.0-20260325-120000`）：

```bash
curl -sfL https://raw.githubusercontent.com/LJTian/notion-linux/main/install.sh | NOTION_LINUX_VERSION=v1.0.0-20260325-120000 bash
```

## 中国大陆安装方式（推荐）
网络不稳定时，建议先在浏览器打开 Releases 页面下载压缩包：  
<https://github.com/LJTian/notion-linux/releases/latest>

下载后在文件所在目录执行（`x64/arm64` 按实际文件名替换；安装到 `/opt/notion` 需要 sudo 权限）：

Shell 命令（依次执行）：
```shell
$ tmp="$(mktemp -d)" && \
 tar -xJf ./notion-linux-x64.tar.xz -C "$tmp" && \
 sudo rm -rf /opt/notion/share/notion-linux && \
 sudo mkdir -p /opt/notion/share/notion-linux /opt/notion/bin && \
 sudo cp -a "$tmp"/Notion-Linux-linux-x64/. /opt/notion/share/notion-linux/ && \
 sudo ln -sf ../share/notion-linux/Notion-Linux /opt/notion/bin/notion-linux && \
 rm -rf "$tmp"
```
### 运行
```shell
nohup notion-linux >/tmp/notion-linux.log 2>&1 &
```

### 桌面图标（应用菜单）
使用解压并复制后的应用目录图标（`/opt/notion/share/notion-linux/resources/app/icon.png`），执行：

```shell
$ mkdir -p ~/.local/share/applications
$ cat > ~/.local/share/applications/notion-linux.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=Notion Linux
Comment=Notion desktop wrapper
Exec=notion-linux
Icon=/opt/notion/share/notion-linux/resources/app/icon.png
Terminal=false
Categories=Office;Productivity;
StartupNotify=true
EOF
$ update-desktop-database ~/.local/share/applications 2>/dev/null || true
```

安装后可在应用菜单搜索 `Notion Linux` 启动。

## GPU / 显卡相关问题

部分环境（如较旧的 Mesa、虚拟机显卡、或某些 Intel/AMD 驱动与 Chromium/Electron 的 OpenGL/ANGLE 组合）下，启动时终端或日志里可能出现 **Skia shader compilation error**、**link failed but did not provide an info log**，着色器源码里带有 **`GL_NV_shader_noperspective_interpolation`**。这是 **Chromium 内置 Skia** 在 GPU 上编译管线着色器失败，与本仓库网页封装逻辑无关。

**处理方式（任选其一验证）：**

- 关闭 GPU 加速（多数情况下可立即恢复可用，代价是占用更多 CPU、界面可能略卡）：

  ```bash
  notion-linux --disable-gpu
  ```

  若安装路径为 `/opt/notion/bin/notion-linux`，则：

  ```bash
  /opt/notion/bin/notion-linux --disable-gpu
  ```

- 可先试较轻参数：`--disable-gpu-compositing`（若仍报错再改用 `--disable-gpu`）。

- 长期使用：在桌面快捷方式 `Exec=` 中于可执行文件路径后追加上述参数；或升级本机 **Mesa / 显卡驱动** 后，再尝试去掉 `--disable-gpu` 以恢复硬件加速。

## 本地构建

需 **Node.js** 与 `npm i -g nativefier`：

- `make dist-linux` — 默认 x64，产出 `notion-linux-x64.tar.xz`
- `make dist-linux LINUX_ARCH=arm64` — 产出 `notion-linux-arm64.tar.xz`

## 免责声明

- 本仓库**与 Notion 公司或其产品无关联、未获授权背书**；「Notion」及相关标识的商标与版权归权利人所有。
- 软件按「**现状**」提供，**不作任何明示或默示担保**（包括但不限于适销性、特定用途适用性、不侵权）。因使用、无法使用或依赖本仓库内容所造成的**任何直接、间接、偶然或后果性损失**，作者与贡献者**不承担法律责任**。
- 使用者应**自行遵守** Notion [服务条款](https://www.notion.so/terms)、适用法律法规及第三方权利；**因违反上述规定而产生的后果由使用者自行承担**。

## 侵权处理

若您认为本仓库内容**涉嫌侵犯著作权、商标权或其他权利**，请通过 Issue 或您认可的方式联系维护者；核实后**可要求删除或修改相关内容**，维护者将在合理范围内配合处理。您也可以**直接停止使用并删除本仓库副本**。出现权利冲突时，维护者可**删除争议素材**或**调整仓库描述与构建目标**直至争议消除。本说明不构成法律意见。
