---
name: Imported repository sync
description: Environment-specific behavior when a cloned artifact contains unresolved Git merge markers.
---

Unresolved merge markers in imported artifact files can make an otherwise valid web app fail to register or disappear from the deployable artifact list.

**Why:** The imported clinic project briefly lost its web artifact and workflow while conflicted source and metadata files were present.

**How to apply:** Before starting or re-registering an imported artifact, scan the relevant source, metadata, and public files for conflict markers. If nested markers contain alternate themes, resolve toward the approved branch before debugging the app itself.