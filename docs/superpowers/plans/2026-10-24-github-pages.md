# GitHub Pages playable edition

**Goal:** Publish the existing game as an actual playable HTML site on the user's GitHub Pages, then return the verified URL.
**Architecture:** A separate Vite browser entry reuses LifeApp and all styles. Explicit HTML metadata configures the repository asset base and existing public story service. The existing Worker grants CORS only to the owner's GitHub Pages origin; the browser never sends private full saves automatically.
**Spec:** User explicitly requested the playable HTML publication instead of the source repository URL. Preserve gameplay and source; publish to the existing public repository.
**Tech Stack:** React, Vite, GitHub Pages, existing Sites Worker/D1.

- [x] Add failing tests for subdirectory assets, API URL selection, exact allowed origin and preflight.
- [x] Add browser-only entry/build configuration, path helpers and strict story API CORS.
- [x] Run tests/types/both production builds; browser-test static output under /cisheng/.
- [x] Fresh-context whole-change review; repair demonstrated defects.
- [ ] Publish existing backend update; sync exact source to GitHub; publish static artifact to gh-pages.
- [ ] Enable Pages, wait for deployment, verify real home/birth/play and export, return playable link.

## Ledger
- Existing main/source commit: be4a98a8d766f53d3a452495e78e1dd658ff84be. Working tree clean before this task.
- Ruling: GitHub Pages must serve the game itself, not a redirect, iframe, or source README.
- Ruling: Preserve online community features through the existing public backend with an exact-origin CORS policy, no wildcard and no credentialed cross-origin requests.
- User already authorized publication and repository upload. No new publishing approval is needed.

- Verified: 51 unit tests pass; both API integration scenarios pass individually against production Worker preview on 5176. Consecutive scenarios encounter a local Wrangler proxy restart (503 text), so execute them in separate processes. Vite dev middleware rejects external preflight before Worker; production preview verifies the actual CORS handler.
- TypeScript, static Pages build and full Worker build pass. Static browser QA confirms 217-entry probability data, blank birth, random reveal with image and parents, and playable timeline.
- Fresh-context reviewer found no actionable defect in source/CORS changes.
