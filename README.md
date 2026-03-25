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

本地已有压缩包时，与 `install.sh` 同目录放置 `notion-linux-*.tar.xz`（或 `.tar.gz`）后执行 `./install.sh`，或 `./install.sh /path/to/包`。

## 本地构建

需 **Node.js** 与 `npm i -g nativefier`：

- `make dist-linux` — 默认 x64，产出 `notion-linux-x64.tar.xz`
- `make dist-linux LINUX_ARCH=arm64` — 产出 `notion-linux-arm64.tar.xz`

存在根目录 **`notion.png`** 时会作为应用图标传入 Nativefier。

## CI

| Workflow | 说明 |
|----------|------|
| **Build Linux** | 推 `main`/`master` 或 PR 时并行构建 x64、arm64，**Artifacts** 可下载。 |
| **Release** | 发布正式附件到 **GitHub Releases**（`install.sh` 的 `latest/download` 依赖此处的包）。 |

### 发布与标签

- **推送已有标签**（需匹配 `v*`，例如带日期时间）：  
  `git tag v1.0.0-20260325-120000 && git push origin v1.0.0-20260325-120000`  
  会触发 **Release**，上传 `notion-linux-x64.tar.xz` / `notion-linux-arm64.tar.xz`。
- **手动发布**：Actions → **Release** → Run workflow，填写 **`base_version`**（默认 `v1.0.0`）。工作流会生成 **`v1.0.0-UTC日期时间`**（格式 `YYYYMMDD-HHMMSS`）的新标签并推送，再创建/更新对应 Release。

## 免责声明

- 本仓库**与 Notion 公司或其产品无关联、未获授权背书**；「Notion」及相关标识的商标与版权归权利人所有。
- 软件按「**现状**」提供，**不作任何明示或默示担保**（包括但不限于适销性、特定用途适用性、不侵权）。因使用、无法使用或依赖本仓库内容所造成的**任何直接、间接、偶然或后果性损失**，作者与贡献者**不承担法律责任**。
- 使用者应**自行遵守** Notion [服务条款](https://www.notion.so/terms)、适用法律法规及第三方权利；**因违反上述规定而产生的后果由使用者自行承担**。

## 侵权处理

若您认为本仓库内容**涉嫌侵犯著作权、商标权或其他权利**，请通过 Issue 或您认可的方式联系维护者；核实后**可要求删除或修改相关内容**，维护者将在合理范围内配合处理。您也可以**直接停止使用并删除本仓库副本**。出现权利冲突时，维护者可**删除争议素材**或**调整仓库描述与构建目标**直至争议消除。本说明不构成法律意见。
