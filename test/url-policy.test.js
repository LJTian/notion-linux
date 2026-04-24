const assert = require("assert");

const {
  START_URL,
  classifyUrl,
  normalizeUrl,
  selectTabIdByShortcut
} = require("../src/url-policy");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("exports the Notion start URL", () => {
  assert.strictEqual(START_URL, "https://www.notion.com");
});

test("classifies Notion hosts as in-app URLs", () => {
  assert.deepStrictEqual(classifyUrl("https://www.notion.com"), {
    action: "notion",
    url: "https://www.notion.com/"
  });
  assert.deepStrictEqual(classifyUrl("https://workspace.notion.so/page"), {
    action: "notion",
    url: "https://workspace.notion.so/page"
  });
  assert.deepStrictEqual(classifyUrl("https://example.notion.site/home"), {
    action: "notion",
    url: "https://example.notion.site/home"
  });
});

test("classifies non-Notion http URLs as external", () => {
  assert.deepStrictEqual(classifyUrl("https://example.com/docs"), {
    action: "external",
    url: "https://example.com/docs"
  });
  assert.deepStrictEqual(classifyUrl("http://example.com/docs"), {
    action: "external",
    url: "http://example.com/docs"
  });
});

test("denies invalid or unsupported URLs", () => {
  assert.deepStrictEqual(classifyUrl("not a url"), { action: "deny", url: null });
  assert.deepStrictEqual(classifyUrl("mailto:help@example.com"), { action: "deny", url: null });
  assert.deepStrictEqual(classifyUrl("file:///etc/passwd"), { action: "deny", url: null });
  assert.deepStrictEqual(classifyUrl("https://evilnotion.so/page"), { action: "external", url: "https://evilnotion.so/page" });
});

test("normalizes relative URLs against a Notion base", () => {
  assert.strictEqual(
    normalizeUrl("/settings", "https://workspace.notion.so/page"),
    "https://workspace.notion.so/settings"
  );
  assert.deepStrictEqual(classifyUrl("/settings", "https://workspace.notion.so/page"), {
    action: "notion",
    url: "https://workspace.notion.so/settings"
  });
});

test("selects tabs by numeric shortcut", () => {
  const tabs = [
    { id: "tab-1" },
    { id: "tab-2" },
    { id: "tab-3" },
    { id: "tab-4" },
    { id: "tab-5" },
    { id: "tab-6" },
    { id: "tab-7" },
    { id: "tab-8" },
    { id: "tab-9" },
    { id: "tab-10" }
  ];

  assert.strictEqual(selectTabIdByShortcut(tabs, 1), "tab-1");
  assert.strictEqual(selectTabIdByShortcut(tabs, 3), "tab-3");
  assert.strictEqual(selectTabIdByShortcut(tabs, 9), "tab-10");
  assert.strictEqual(selectTabIdByShortcut(tabs, 0), null);
  assert.strictEqual(selectTabIdByShortcut(tabs.slice(0, 2), 3), null);
});
