---
name: add-new-tab-to-app-shell
description: Workflow command scaffold for add-new-tab-to-app-shell in Animals-Plants-Distribution-System.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-tab-to-app-shell

Use this workflow when working on **add-new-tab-to-app-shell** in `Animals-Plants-Distribution-System`.

## Goal

Adds a new functional tab to the main application shell (e.g., Map, Migration, Report), including UI, state management, and styling.

## Common Files

- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/components/<TabName>Tab.jsx`
- `frontend/src/components/Navbar.jsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create new component file for the tab under frontend/src/components/
- Update App.jsx to include the new tab and manage its state
- Update App.css to style the new tab and any new UI elements
- Update Navbar.jsx to include the new tab in the navigation
- If needed, update or add data files relevant to the tab's functionality

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.