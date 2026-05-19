/**
 * Correct Notion page column centering inside the Electron BrowserView shell.
 * Notion sometimes sizes flex columns to the full viewport width instead of the
 * area beside the sidebar, which leaves a large empty gap on the left.
 */
(function initNotionLayoutFix() {
  const FLAG = "__notionLinuxLayoutFix";

  function getSidebarWidth(frame) {
    const sidebar =
      frame.querySelector(".notion-sidebar-container") ||
      frame.querySelector(".notion-sidebar") ||
      frame.querySelector('[class*="sidebar"]');
    if (!sidebar) return 0;
    return sidebar.getBoundingClientRect().width;
  }

  function shouldConstrain(el, expectedMainWidth) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= expectedMainWidth + 8) return false;

    const style = window.getComputedStyle(el);
    if (style.display !== "flex" || style.flexDirection !== "column") return false;
    if (style.alignItems !== "center") return false;

    return true;
  }

  function fixLayout() {
    const frame = document.querySelector(".notion-frame");
    if (!frame) return;

    const expectedMainWidth = document.documentElement.clientWidth - getSidebarWidth(frame);
    if (expectedMainWidth <= 0) return;

    for (const el of frame.querySelectorAll("motion-div, div")) {
      if (!shouldConstrain(el, expectedMainWidth)) continue;
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
    }
  }

  function start() {
    fixLayout();

    if (window[FLAG]) return;
    window[FLAG] = true;

    const observer = new MutationObserver(() => fixLayout());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("resize", fixLayout, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
