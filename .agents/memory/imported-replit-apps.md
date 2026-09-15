---
name: Imported Replit apps
description: Non-obvious setup notes for importing existing Replit workspaces with artifact manifests and database-backed pages.
---

Imported repositories may include both artifact service manifests and a legacy `.replit` workflow for the same frontend. Once the artifact is registered, keep the artifact-owned workflow and remove the duplicate legacy workflow so preview routing uses the manifest's managed `PORT` and `BASE_PATH`.

**Why:** Running both workflows for the same path can create competing preview services and bypass artifact routing.

**How to apply:** After copying an imported repository, install its workspace dependencies, apply its existing database schema, seed only the repository's documented public defaults when the UI requires them, then restart the API and artifact-owned frontend workflow.