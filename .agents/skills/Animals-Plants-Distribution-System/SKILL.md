```markdown
# Animals-Plants-Distribution-System Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns, coding conventions, and common workflows for contributing to the Animals-Plants-Distribution-System, a JavaScript-based application (no framework detected) for managing and visualizing the distribution of animals and plants. You'll learn how to add new features via tabs, update the design system, and follow the repository's established code style and testing patterns.

## Coding Conventions

- **File Naming:**  
  Use camelCase for file names.  
  _Example:_  
  ```
  animalList.jsx
  migrationReport.jsx
  ```

- **Import Style:**  
  Use absolute imports.  
  _Example:_  
  ```js
  import MapTab from 'frontend/src/components/MapTab.jsx';
  ```

- **Export Style:**  
  Use named exports.  
  _Example:_  
  ```js
  // In MapTab.jsx
  export function MapTab(props) { ... }
  ```

- **Commit Messages:**  
  - Use `feat` prefix for new features.
  - Messages are freeform, average 59 characters.
  _Example:_  
  ```
  feat: add migration visualization to MapTab
  ```

## Workflows

### Add New Tab to App Shell
**Trigger:** When you want to introduce a new major feature accessible via a tab in the navbar.  
**Command:** `/add-tab`

1. **Create a new component file** for the tab under `frontend/src/components/`.
   - _Example:_ `frontend/src/components/ReportTab.jsx`
2. **Update `App.jsx`** to include the new tab and manage its state.
   - _Example:_
     ```js
     import { ReportTab } from 'frontend/src/components/ReportTab.jsx';
     // Add <ReportTab /> to the tab switch logic
     ```
3. **Update `App.css`** to style the new tab and any new UI elements.
4. **Update `Navbar.jsx`** to include the new tab in the navigation.
   - _Example:_
     ```js
     <li onClick={() => setActiveTab('report')}>Report</li>
     ```
5. **If needed, update or add data files** relevant to the tab's functionality.

**Files Involved:**
- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/components/<TabName>Tab.jsx`
- `frontend/src/components/Navbar.jsx`

---

### Update Design System and Apply Globally
**Trigger:** When you want to overhaul or enhance the visual design and branding of the application.  
**Command:** `/update-design-system`

1. **Create or update a design token CSS file** (e.g., `colors_and_type.css`).
   - _Example:_
     ```css
     :root {
       --primary-color: #4CAF50;
       --font-family: 'Roboto', sans-serif;
     }
     ```
2. **Add or update font files** under `src/fonts/`.
3. **Wire the design token CSS** as the first import in `index.js`.
   - _Example:_
     ```js
     import 'frontend/src/colors_and_type.css';
     ```
4. **Rewrite `App.css` and other CSS files** to use the new tokens.
   - _Example:_
     ```css
     body {
       font-family: var(--font-family);
       color: var(--primary-color);
     }
     ```
5. **Update `index.html`** to remove or replace font links as needed.
6. **Ensure all components use the new design system** without breaking existing functionality.

**Files Involved:**
- `frontend/src/colors_and_type.css`
- `frontend/src/fonts/`
- `frontend/src/App.css`
- `frontend/public/index.html`
- `frontend/src/index.js`

## Testing Patterns

- **Framework:** Unknown (not detected)
- **File Pattern:** Test files use the `*.test.*` naming convention.
  - _Example:_ `animalList.test.js`
- **Location:** Test files are typically alongside the code they test or in a dedicated test directory.

## Commands

| Command                | Purpose                                                      |
|------------------------|--------------------------------------------------------------|
| /add-tab               | Add a new functional tab to the application shell            |
| /update-design-system  | Overhaul or enhance the app's design system and apply globally|
```
