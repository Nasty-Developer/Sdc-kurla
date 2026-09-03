---
name: Imported repository setup
description: Import checks for repositories copied into the Replit workspace.
---

Repository imports should be scanned for unresolved Git conflict markers before starting the preview; imported Git-sync snapshots can contain valid-looking app files that still break Vite or artifact metadata parsing.

**Why:** A public repository import can include unfinished merge state even when the repository clones successfully, causing failures that look like missing dependencies or unrelated syntax errors.

**How to apply:** After copying an imported repository, use a tracked-file grep for conflict markers, resolve only the affected files, install from the lockfile, then restart the app workflow.