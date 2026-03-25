# Notion-Linux

用 [Nativefier](https://github.com/nativefier/nativefier) 把 Notion 网页包成 Linux 应用（x64 / arm64）。开源供学习与非商业试用。

**一条命令安装**（从 GitHub Releases 下载与本机架构匹配的包；默认仓库 `LJTian/notion-linux`，可 fork 后改 `NOTION_LINUX_REPO`）：

```bash
curl -sfL https://raw.githubusercontent.com/LJTian/notion-linux/main/install.sh | bash
```

固定版本：`curl -sfL https://raw.githubusercontent.com/LJTian/notion-linux/main/install.sh | NOTION_LINUX_VERSION=v1.0.0 bash`

**构建**：`npm i -g nativefier` 后执行 `make linux` 或 `make dist-linux`（默认 x64；arm64 加 `LINUX_ARCH=arm64`），产物为 `notion-linux-*.tar.xz`。

**本地已有压缩包**：与 `install.sh` 同目录放 `notion-linux-*.tar.xz`（或 `.tar.gz`）后执行 `./install.sh`，或 `./install.sh /path/to/包`。


## 免责声明

- 本仓库**与 Notion 公司或其产品无关联、未获授权背书**；「Notion」及相关标识的商标与版权归权利人所有。
- 软件按「**现状**」提供，**不作任何明示或默示担保**（包括但不限于适销性、特定用途适用性、不侵权）。因使用、无法使用或依赖本仓库内容所造成的**任何直接、间接、偶然或后果性损失**，作者与贡献者**不承担法律责任**。
- 使用者应**自行遵守** Notion [服务条款](https://www.notion.so/terms)、适用法律法规及第三方权利；**因违反上述规定而产生的后果由使用者自行承担**。

## 侵权处理

若您认为本仓库内容**涉嫌侵犯著作权、商标权或其他权利**，请通过 Issue 或您认可的方式联系维护者；核实后**可要求删除或修改相关内容**，维护者将在合理范围内配合处理。您也可以**直接停止使用并删除本仓库副本**。出现权利冲突时，维护者可**删除争议素材**或**调整仓库描述与构建目标**直至争议消除。本说明不构成法律意见。
