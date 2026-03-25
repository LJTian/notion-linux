# CI: make dist-linux LINUX_ARCH=x64|arm64
APP_NAME := Notion-Linux
URL := https://www.notion.com
INTERNAL_URLS := .*([a-zA-Z0-9-]+\.notion\.site|notion\.(so|com|site)|oauth2\.googleapis\.com|googleusercontent\.com|accounts\.google\.|appleid\.apple\.com|idmsa\.apple\.com|login\.microsoftonline\.|login\.live\.|open\.weixin\.qq\.com|work\.weixin\.qq\.com|github\.com/(login|session|auth/oauth)).*
NATIVEFIER ?= nativefier
ICON_FLAG := $(if $(wildcard notion.png),--icon notion.png,)

LINUX_PLATFORM := linux
LINUX_ARCH ?= x64
LINUX_OUT := $(APP_NAME)-$(LINUX_PLATFORM)-$(LINUX_ARCH)
TAR_NAME := notion-linux-$(LINUX_ARCH).tar.xz

COMMON_FLAGS := \
	--name "$(APP_NAME)" \
	$(ICON_FLAG) \
	--inject ./inject.css \
	--internal-urls "$(INTERNAL_URLS)" \
	--single-instance \
	--tray \
	--conceal

.PHONY: linux dist-linux check

check:
	@command -v $(NATIVEFIER) >/dev/null 2>&1 || { echo "未找到 $(NATIVEFIER)" >&2; exit 1; }

linux: check
	$(NATIVEFIER) "$(URL)" --platform $(LINUX_PLATFORM) --arch $(LINUX_ARCH) $(COMMON_FLAGS)

dist-linux: linux
	tar -cJf "$(TAR_NAME)" -C . "$(LINUX_OUT)"
