# CLAD Organizer

CLAD Organizer is a spatial planning experience for SPECS, built in Lens Studio with CLAD. It helps someone turn an overwhelming real-world task into a clear, interactive plan.

This Week 1 **Organize** submission demonstrates a dinner-prep workflow: plan biryani for four, identify what is already available, enter a compact spatial market, collect the remaining ingredients, and reach a shared completion state.

## Demo

Watch the submission video: add the hosted demo-video link here before submitting.

The flow shown in the demo is:

1. Create a **Biryani for 4** ingredient plan.
2. Mark ingredients already available at home.
3. Enter **CLAD Market** to see only what is still needed.
4. Select spatial products from Produce, Dairy, and Protein / Pantry zones.
5. Watch the organizer update from the same authoritative state.
6. Finish at **8 / 8 ingredients ready**.

## Why this is a spatial organizer

CLAD Organizer is not a shopping-list mockup. It keeps the plan, physical item discovery, and completion state synchronized in one shared model. The grocery scenario is a proof point for a broader idea: spatial computing can help people organize real-world activities and events, from dinner preparation to collaborative planning.

## Built with CLAD

The project was built in Lens Studio for SPECS using CLAD’s AI-assisted workflow. The complete prompt and implementation history is preserved in [PROMPT_LOG.md](PROMPT_LOG.md). The evidence log and clean Preview captures are in [PROMO_LOG.md](PROMO_LOG.md) and `promo-assets/screenshots/`.

## Project structure

```text
Assets/
  Scripts/                 Shared state, checklist UI, Market UI, and product interaction
  Materials/ Meshes/       Lightweight voxel market presentation
  Scene.scene              Lens Studio scene
Packages/                  SPECS, UIKit, SIK, and test packages
PROMPT_LOG.md              CLAD prompt/workflow record
PROMO_LOG.md               Demo evidence log
```

## Run locally

1. Install Lens Studio 5.22 or later.
2. Open `CLAD-organize.esproj`.
3. Open `Assets/Scene.scene` and start Interactive Preview.
4. Use the organizer to mark owned ingredients, enter CLAD Market, select the missing products, and confirm the completion state.

No Spectacles hardware, backend, account, payments, live shopping data, or computer vision is required for the deterministic demo.

## Submission checklist

- [x] Spatial experience built in Lens Studio for SPECS
- [x] Public repository source
- [x] CLAD prompt log
- [x] Demo video under 60 seconds
- [ ] Hosted, shareable demo-video URL
- [ ] Lenslist registration and final project form submission

## Credits

Created by **Jayasri Guthula**.
