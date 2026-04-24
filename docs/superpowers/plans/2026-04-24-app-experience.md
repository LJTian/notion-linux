# App Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Notion Linux tab behavior with safer URL handling, external-link routing, CSS injection, and common keyboard shortcuts.

**Architecture:** Keep Electron lifecycle work in `src/main.js`, and extract URL/tab-selection rules into a small CommonJS helper that can be tested with Node. Renderer changes remain minimal because the current tab bar already receives state from the main process.

**Tech Stack:** Electron 38, CommonJS, Node `assert`, npm scripts.

---

## File Structure

- Create `src/url-policy.js`: pure URL classification and tab index helper functions.
- Create `test/url-policy.test.js`: Node-based tests for `src/url-policy.js`.
- Modify `package.json`: add `check` script for the Node tests.
- Modify `src/main.js`: consume URL policy helpers, route external URLs through `shell.openExternal`, intercept new-window requests, inject `inject.css`, and add keyboard shortcuts.
- Modify `src/renderer/renderer.js`: guard against missing state and keep renderer event handling stable.

## Tasks

### Task 1: URL Policy Helper

**Files:**
- Create: `src/url-policy.js`
- Create: `test/url-policy.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Create `test/url-policy.test.js` with tests for Notion URL detection, external URL detection, unsupported scheme rejection, relative input normalization, and numeric tab shortcut selection.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run check`

Expected: failure because `src/url-policy.js` does not exist or exports are missing.

- [ ] **Step 3: Implement helper**

Create `src/url-policy.js` exporting:

- `START_URL`
- `normalizeUrl(input, baseUrl)`
- `classifyUrl(input, baseUrl)`
- `selectTabIdByShortcut(tabs, keyNumber)`

Expected behavior:

- Notion `https` hosts are classified as `{ action: "notion", url }`.
- Non-Notion `http` and `https` URLs are classified as `{ action: "external", url }`.
- Unsupported schemes and invalid inputs are classified as `{ action: "deny", url: null }`.
- Relative paths are resolved against the current Notion URL when a base URL is provided.
- Shortcut `9` selects the last tab when at least nine tabs exist.

- [ ] **Step 4: Add package script**

Add `"check": "node test/url-policy.test.js"` to `package.json`.

- [ ] **Step 5: Run tests to verify pass**

Run: `npm run check`

Expected: all URL policy tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json src/url-policy.js test/url-policy.test.js
git commit -m "test: add url policy checks"
```

### Task 2: Main Process Integration

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Wire imports**

Import `shell` from Electron and import URL helpers from `src/url-policy.js`.

- [ ] **Step 2: Route URLs**

Add small main-process functions:

- `openExternalUrl(url)` catches and logs `shell.openExternal` failures.
- `handleNavigationRequest(url, options)` classifies URLs and either creates an app tab, loads the active tab, opens externally, or denies the request.

- [ ] **Step 3: Secure IPC tab creation**

Update `ipcMain.handle("tabs:create")` so renderer-provided URLs go through `handleNavigationRequest`; invalid URLs do not load.

- [ ] **Step 4: Intercept new windows**

Use `webContents.setWindowOpenHandler` in `attachTabEvents(tab)`:

- Notion URLs open in a new app tab.
- External URLs open in the system browser.
- Denied URLs return `{ action: "deny" }`.

- [ ] **Step 5: Inject CSS**

Load `inject.css` once from the repo/package root if present. After `did-finish-load`, call `insertCSS` for pages whose current URL is classified as Notion.

- [ ] **Step 6: Run tests**

Run: `npm run check`

Expected: URL helper tests still pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/main.js
git commit -m "feat: route app and external urls"
```

### Task 3: Keyboard Shortcuts and Renderer Guard

**Files:**
- Modify: `src/main.js`
- Modify: `src/renderer/renderer.js`
- Modify: `test/url-policy.test.js`

- [ ] **Step 1: Add shortcut helper coverage**

Extend `test/url-policy.test.js` so `selectTabIdByShortcut` covers:

- key `1` selects the first tab.
- key `3` selects the third tab.
- key `9` selects the last tab.
- out-of-range values return `null`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run check`

Expected: failure if helper behavior is incomplete.

- [ ] **Step 3: Register focused window shortcuts**

In `src/main.js`, add a window-level `before-input-event` handler:

- `CmdOrCtrl+T` calls `createTab(START_URL)`.
- `CmdOrCtrl+W` closes the active tab.
- `CmdOrCtrl+Tab` activates the next tab.
- `CmdOrCtrl+Shift+Tab` activates the previous tab.
- `CmdOrCtrl+1` through `CmdOrCtrl+9` activate indexed tabs using `selectTabIdByShortcut`.

- [ ] **Step 4: Guard renderer state**

Update `renderTabs(state)` in `src/renderer/renderer.js` to return early unless `state.tabs` is an array, so malformed IPC state cannot throw.

- [ ] **Step 5: Run tests**

Run: `npm run check`

Expected: all helper tests pass.

- [ ] **Step 6: Run package metadata check**

Run: `npm run`

Expected: `check` appears in the script list.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/main.js src/renderer/renderer.js test/url-policy.test.js
git commit -m "feat: add tab keyboard shortcuts"
```

### Task 4: Final Verification

**Files:**
- No intended file changes.

- [ ] **Step 1: Run automated checks**

Run: `npm run check`

Expected: all tests pass.

- [ ] **Step 2: Run Electron smoke command if environment allows**

Run: `npm run dev -- --help`

Expected: Electron command starts far enough to print help or exit without a JavaScript syntax error. If the local environment cannot start Electron because of display/sandbox restrictions, record the exact failure.

- [ ] **Step 3: Inspect git state**

Run: `git status --short`

Expected: only intentional committed changes remain, or a clean worktree if all changes were committed.

