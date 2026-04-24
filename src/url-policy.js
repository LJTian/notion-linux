const START_URL = "https://www.notion.com";

const NOTION_HOSTS = new Set(["notion.com", "notion.so", "notion.site"]);

function normalizeUrl(input, baseUrl) {
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  try {
    return new URL(raw, baseUrl || undefined).toString();
  } catch (_error) {
    return null;
  }
}

function isNotionHost(hostname) {
  const host = hostname.toLowerCase();
  for (const root of NOTION_HOSTS) {
    if (host === root || host.endsWith(`.${root}`)) return true;
  }
  return false;
}

function classifyUrl(input, baseUrl) {
  const url = normalizeUrl(input, baseUrl);
  if (!url) return { action: "deny", url: null };

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    return { action: "deny", url: null };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { action: "deny", url: null };
  }

  if (parsed.protocol === "https:" && isNotionHost(parsed.hostname)) {
    return { action: "notion", url };
  }

  return { action: "external", url };
}

function selectTabIdByShortcut(tabs, keyNumber) {
  if (!Array.isArray(tabs)) return null;
  if (!Number.isInteger(keyNumber) || keyNumber < 1 || keyNumber > 9) return null;
  if (tabs.length === 0) return null;

  const index = keyNumber === 9 && tabs.length >= 9 ? tabs.length - 1 : keyNumber - 1;
  return tabs[index]?.id || null;
}

module.exports = {
  START_URL,
  classifyUrl,
  normalizeUrl,
  selectTabIdByShortcut
};
