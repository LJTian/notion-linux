# Notion Linux App Experience Design

## Goal

Improve the current Electron wrapper so it behaves more like a usable daily Notion desktop client while keeping the existing simple single-window, multi-tab UI.

This change focuses on app behavior, not release packaging or a larger browser shell.

## Scope

Included:

- Validate URLs received by the main process before loading them.
- Keep Notion URLs inside the app.
- Open external non-Notion URLs in the system browser.
- Handle `window.open` and new-window requests consistently.
- Inject `inject.css` into Notion pages so packaged styling customizations are active.
- Add keyboard shortcuts for common tab actions.
- Add basic renderer support for tab actions without changing the app into a full browser.
- Add lightweight automated checks for the new pure helper behavior where practical.

Excluded:

- Address bar, back/forward/reload toolbar, bookmarks, or browser-like navigation UI.
- Session persistence and restoring closed tabs.
- Reworking the packaging and release system.
- Major visual redesign.

## Behavior

### URL Handling

The main process owns URL validation. Renderer IPC may ask to create a tab with a URL, but the main process must normalize and approve it before loading.

Allowed in-app URLs:

- `https://www.notion.com`
- `https://notion.so`
- `https://*.notion.so`
- `https://notion.site`
- `https://*.notion.site`
- `https://notion.com`
- `https://*.notion.com`

If the user action targets an allowed Notion URL, the app opens it in the requested current tab or a new app tab.

If the target is a valid `http` or `https` URL outside Notion, it opens in the system browser via Electron `shell.openExternal`.

Invalid URLs and unsupported schemes are ignored.

### New Windows

New-window requests from Notion are intercepted in the main process.

- Notion destinations open in a new app tab.
- External destinations open in the system browser.
- Unsupported destinations are denied.

### CSS Injection

`inject.css` is injected after Notion page load events. Missing CSS should not crash the app; it should fail silently or log a concise warning.

### Keyboard Shortcuts

The app adds shortcuts while the main window is focused:

- `CmdOrCtrl+T`: create a new Notion tab.
- `CmdOrCtrl+W`: close the active tab.
- `CmdOrCtrl+Tab`: activate the next tab.
- `CmdOrCtrl+Shift+Tab`: activate the previous tab.
- `CmdOrCtrl+1` through `CmdOrCtrl+9`: activate the corresponding tab, with `9` selecting the last tab when there are at least nine.

Closing the last tab keeps the current behavior: a fresh Notion tab is created.

## Implementation Shape

Keep most behavior in `src/main.js` because BrowserView lifecycle, URL permissions, shell integration, and keyboard shortcuts belong in the main process.

Extract small pure helpers for URL classification and tab index selection only if doing so makes automated checks practical without launching Electron.

Renderer changes should stay minimal. The existing tab bar remains the primary UI.

## Error Handling

- Bad IPC tab IDs are ignored.
- Bad URLs are ignored.
- Failed external opens are caught and logged.
- Missing `inject.css` does not block page loading.

## Testing

Add a small Node-based check script for pure helpers if helpers are extracted.

Manual verification:

- Start the app.
- Create, close, and switch tabs with shortcuts.
- Open a Notion link that requests a new window and confirm it becomes an app tab.
- Open an external link and confirm it goes to the system browser.
- Confirm unsupported schemes are denied.

