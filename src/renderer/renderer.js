const tabsEl = document.getElementById("tabs");
const newTabBtn = document.getElementById("newTabBtn");
const quickNewTabBtn = document.getElementById("quickNewTabBtn");

function renderTabs(state) {
  if (!state || !Array.isArray(state.tabs)) return;

  tabsEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const tab of state.tabs) {
    const tabNode = document.createElement("div");
    tabNode.className = `tab ${tab.id === state.activeTabId ? "active" : ""}`;
    tabNode.title = tab.url;

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.loading ? `${tab.title || "Notion"} ·` : tab.title || "Notion";

    const close = document.createElement("button");
    close.className = "tab-close";
    close.type = "button";
    close.title = "关闭标签";
    close.textContent = "×";
    close.addEventListener("click", async (event) => {
      event.stopPropagation();
      await window.tabsApi.close(tab.id);
    });

    tabNode.addEventListener("click", async () => {
      await window.tabsApi.activate(tab.id);
    });

    tabNode.appendChild(title);
    tabNode.appendChild(close);
    fragment.appendChild(tabNode);
  }

  tabsEl.appendChild(fragment);
}

newTabBtn.addEventListener("click", async () => {
  await window.tabsApi.create();
});

quickNewTabBtn.addEventListener("click", async () => {
  await window.tabsApi.create();
});

window.tabsApi.onState((state) => {
  renderTabs(state);
});

window.tabsApi.getState().then(renderTabs);
