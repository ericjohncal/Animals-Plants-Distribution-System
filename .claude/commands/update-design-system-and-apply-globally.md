---
name: update-design-system-and-apply-globally
description: Workflow command scaffold for update-design-system-and-apply-globally in Animals-Plants-Distribution-System.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-design-system-and-apply-globally

Use this workflow when working on **update-design-system-and-apply-globally** in `Animals-Plants-Distribution-System`.

## Goal

Introduces or updates a design system (colors, typography, spacing) and applies it across the app, ensuring consistent styling.

## Common Files

- `frontend/src/colors_and_type.css`
- `frontend/src/fonts/`
- `frontend/src/App.css`
- `frontend/public/index.html`
- `frontend/src/index.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a design token CSS file (e.g., colors_and_type.css)
- Add or update font files under src/fonts/
- Wire the design token CSS as the first import in index.js
- Rewrite App.css and possibly other CSS files to consume the new tokens
- Update index.html to remove or replace font links as needed

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.