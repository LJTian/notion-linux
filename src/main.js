const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, BrowserView, Menu, Tray, nativeImage, ipcMain, shell } = require("electron");
const { START_URL, classifyUrl, selectTabIdByShortcut } = require("./url-policy");

const TAB_BAR_HEIGHT = 44;
const CONTENT_PADDING = 0;
const MIN_TAB_WIDTH = 120;
const MAX_TAB_WIDTH = 220;

const NOTION_USER_AGENT =
  process.env.NOTION_USER_AGENT ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

let mainWindow = null;
let tray = null;
let activeTabId = null;
let tabSeq = 0;
let isQuitting = false;
let injectCss = null;
const tabs = new Map();

function normalizeTabTitle(rawTitle) {
  const title = (rawTitle || "").trim();
  if (!title) return "Notion";
  return title.replace(/\s*[|｜]\s*Notion\s*$/i, "").trim() || "Notion";
}

function tabSummary(tab) {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    loading: tab.loading
  };
}

function currentState() {
  return {
    activeTabId,
    minTabWidth: MIN_TAB_WIDTH,
    maxTabWidth: MAX_TAB_WIDTH,
    tabs: [...tabs.values()].map(tabSummary)
  };
}

function sendState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("tabs:state", currentState());
}

function readInjectCss() {
  if (injectCss !== null) return injectCss;

  const candidates = [
    path.join(__dirname, "..", "inject.css"),
    path.join(process.resourcesPath || "", "app", "inject.css")
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      injectCss = fs.readFileSync(p, "utf8");
      return injectCss;
    }
  }

  injectCss = "";
  return injectCss;
}

async function injectNotionCss(tab) {
  const css = readInjectCss();
  if (!css) return;

  const currentUrl = tab.view.webContents.getURL();
  if (classifyUrl(currentUrl).action !== "notion") return;

  try {
    await tab.view.webContents.insertCSS(css);
  } catch (error) {
    console.warn("Failed to inject Notion CSS:", error.message);
  }
}

async function openExternalUrl(url) {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.warn("Failed to open external URL:", error.message);
  }
}

function getTabBaseUrl(tabId = activeTabId) {
  const tab = tabs.get(tabId);
  return tab?.url || START_URL;
}

function handleNavigationRequest(url = START_URL, options = {}) {
  const { newTab = true, baseUrl = getTabBaseUrl() } = options;
  const target = classifyUrl(url || START_URL, baseUrl);

  if (target.action === "notion") {
    if (newTab || !activeTabId) {
      createTab(target.url);
    } else {
      const tab = tabs.get(activeTabId);
      if (tab) {
        tab.url = target.url;
        tab.loading = true;
        tab.view.webContents.loadURL(target.url);
        sendState();
      }
    }
  } else if (target.action === "external") {
    openExternalUrl(target.url);
  }

  return target;
}

function updateViewBounds() {
  if (!mainWindow || !activeTabId) return;
  const tab = tabs.get(activeTabId);
  if (!tab) return;

  const [width, height] = mainWindow.getContentSize();
  tab.view.setBounds({
    x: CONTENT_PADDING,
    y: TAB_BAR_HEIGHT + CONTENT_PADDING,
    width: Math.max(0, width - CONTENT_PADDING * 2),
    height: Math.max(0, height - TAB_BAR_HEIGHT - CONTENT_PADDING * 2)
  });
  tab.view.setAutoResize({ width: true, height: true });
}

function setActiveTab(tabId) {
  const next = tabs.get(tabId);
  if (!next || !mainWindow || mainWindow.isDestroyed()) return;

  activeTabId = next.id;
  mainWindow.setBrowserView(next.view);
  updateViewBounds();
  sendState();
}

function activateRelativeTab(offset) {
  const tabIds = [...tabs.keys()];
  if (tabIds.length === 0 || !activeTabId) return;

  const currentIndex = tabIds.indexOf(activeTabId);
  if (currentIndex === -1) return;

  const nextIndex = (currentIndex + offset + tabIds.length) % tabIds.length;
  setActiveTab(tabIds[nextIndex]);
}

function handleTabShortcut(input) {
  if (!input.control && !input.meta) return false;
  if (input.alt) return false;

  const key = input.key;
  if (key === "t" || key === "T") {
    createTab(START_URL);
    return true;
  }

  if (key === "w" || key === "W") {
    closeTab(activeTabId);
    return true;
  }

  if (key === "Tab") {
    activateRelativeTab(input.shift ? -1 : 1);
    return true;
  }

  const numericKey = Number.parseInt(key, 10);
  if (Number.isInteger(numericKey)) {
    const tabId = selectTabIdByShortcut([...tabs.values()].map(tabSummary), numericKey);
    if (tabId) setActiveTab(tabId);
    return Boolean(tabId);
  }

  return false;
}

function registerWebContentsShortcuts(webContents) {
  webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    if (handleTabShortcut(input)) event.preventDefault();
  });
}

function attachTabEvents(tab) {
  const wc = tab.view.webContents;
  registerWebContentsShortcuts(wc);
  wc.setWindowOpenHandler(({ url }) => {
    handleNavigationRequest(url, {
      newTab: true,
      baseUrl: tab.url
    });
    return { action: "deny" };
  });
  wc.on("will-navigate", (event, url) => {
    const target = classifyUrl(url, tab.url);
    if (target.action === "notion") return;

    event.preventDefault();
    if (target.action === "external") openExternalUrl(target.url);
  });
  wc.on("did-start-loading", () => {
    tab.loading = true;
    sendState();
  });
  wc.on("did-stop-loading", () => {
    tab.loading = false;
    sendState();
  });
  wc.on("page-title-updated", (event, title) => {
    event.preventDefault();
    tab.title = normalizeTabTitle(title);
    sendState();
  });
  wc.on("did-navigate", (_event, url) => {
    tab.url = url;
    sendState();
  });
  wc.on("did-navigate-in-page", (_event, url) => {
    tab.url = url;
    sendState();
  });
  wc.on("did-finish-load", () => {
    injectNotionCss(tab);
  });
}

function createTab(url = START_URL) {
  const target = classifyUrl(url);
  if (target.action !== "notion") {
    if (target.action === "external") openExternalUrl(target.url);
    return;
  }

  const id = `tab-${++tabSeq}`;
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const tab = {
    id,
    view,
    title: "Notion",
    url: target.url,
    loading: true
  };
  tabs.set(id, tab);
  attachTabEvents(tab);

  view.webContents.setUserAgent(NOTION_USER_AGENT);
  view.webContents.loadURL(target.url);

  setActiveTab(id);
}

function closeTab(tabId) {
  const tab = tabs.get(tabId);
  if (!tab) return;

  const wasActive = activeTabId === tabId;
  tab.view.webContents.destroy();
  tabs.delete(tabId);

  if (tabs.size === 0) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBrowserView(null);
    }
    createTab(START_URL);
    return;
  }

  if (wasActive) {
    const fallback = [...tabs.keys()][tabs.size - 1];
    setActiveTab(fallback);
  } else {
    sendState();
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "Notion Linux",
    backgroundColor: "#eceae5",
    autoHideMenuBar: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  registerWebContentsShortcuts(mainWindow.webContents);
  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on("resize", updateViewBounds);
  mainWindow.on("closed", () => {
    mainWindow = null;
    tabs.clear();
    activeTabId = null;
  });

  createTab(START_URL);
}

function resolveTrayIcon() {
  const candidates = [
    path.join(__dirname, "..", "notion.png"),
    path.join(process.resourcesPath || "", "app", "notion.png")
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function createTray() {
  const iconPath = resolveTrayIcon();
  if (!iconPath || tray) return;

  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip("Notion Linux");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "显示主窗口",
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        label: "新建标签",
        click: () => {
          createTab(START_URL);
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("click", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    mainWindow.focus();
  });
}

ipcMain.handle("tabs:get-state", async () => currentState());
ipcMain.handle("tabs:create", async (_event, url) => {
  handleNavigationRequest(url || START_URL, { newTab: true });
  return currentState();
});
ipcMain.handle("tabs:activate", async (_event, tabId) => {
  setActiveTab(tabId);
  return currentState();
});
ipcMain.handle("tabs:close", async (_event, tabId) => {
  closeTab(tabId);
  return currentState();
});

app.whenReady().then(() => {
  createMainWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (isQuitting && process.platform !== "darwin") app.quit();
});
