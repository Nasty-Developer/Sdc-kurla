---
name: Clinic build inputs
description: Environment requirements for building the Somil Dental Clinic web artifact
---

The Somil Dental Clinic Vite configuration requires `PORT` and `BASE_PATH` to be present even for a production build.

**Why:** The artifact is also served through a Replit workflow, so the same configuration validates its runtime port and routing base during build initialization.

**How to apply:** Run the clinic build with the workflow-equivalent environment, such as `PORT=5173 BASE_PATH=/`, rather than invoking the package build with an empty environment.

In this pnpm workspace, add runtime dependencies to the owning artifact package manifest and run a workspace install; the generic package installer attempts to add at the workspace root and is rejected by pnpm's root-package guard.

**Why:** Artifact-specific dependencies must stay scoped to their service instead of silently being added to the monorepo root.

**How to apply:** Edit the relevant package manifest, then run `pnpm install` from the workspace root before typechecking or building.