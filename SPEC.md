# SPEC.md — 7C Labs immersive redesign

Motion and rendering specification for a WebGL-driven redesign of the existing
7C Labs site. This document is the single source of truth for Claude Code.
Read it fully before proposing a plan.

---

## 0. Non-negotiable rules

1. **Content is frozen.** Every heading, paragraph, label, button text, nav
   item, route, email address and footer line stays exactly as it is today.
   No rewriting, no additions, no removals, no "improved" copy. If a string
   must change for a technical reason, ask first.
2. **Information architecture is frozen.** Section order stays:
   Hero → Journey (9 steps) → Products (4 tabs) → Trust (L1/L2/L3) →
   Services (Assess, Implement, Operate, Enable) → About → Get started →
   Footer. `/careers` stays a separate route.
3. **Original implementation only.** The reference studio's techniques are
   being recreated from first principles. Do not copy their code, shaders,
   assets, textures, audio, fonts or brand elements. Do not use a commercial
   font without a license — pick a licensable or open alternative.
4. **No custom engine.** Use the stack in section 4. Do not attempt to build
   a bespoke renderer.
5. **Degrade gracefully.** Every WebGL feature needs a non-WebGL fallback
   that still shows the real content.

---

## 1. Design intent

The site should stop reading as a stack of DOM sections and start reading as
a single continuous scene that the viewer travels through. The nine agents
are the product, so the Journey section gets the majority of the scroll
budget — not an equal slice.

The interface itself is the proof of capability. A platform that claims to
orchestrate nine agents should not present them as a bulleted list.

### Scroll budget

```
Hero        ████
Journey     ██████████████████████████████
Products    ████████
Trust       ███
Services    ████
About       ███
Get started ███
```

---

## 2. Visual system

### Palette

Restrained UI, colour comes from the scene (lights, materials, particles,
shaders) rather than from buttons, cards and background gradients.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | page base |
| `--fg` | `#FFFFFF` | primary text |
| `--fg-muted` | `#8A8F98` | secondary text, labels |
| `--line` | `#1C1F24` | hairlines, dividers |
| `--accent` | `#4DD8E6` | active state, focus, agent highlight |
| `--accent-warm` | `#E8A33D` | second agent state only, used sparingly |

Do not introduce more accents. Do not tint the black.

### Type

- One geometric sans with wide tracking available. Self-host it.
- Large display sizes, very little body copy, generous letter-spacing on
  small labels.
- Set a real type scale and put it in tokens. No arbitrary font sizes in
  components.

### Light and glow

Glow must be produced by compositing and post-processing, not by
`box-shadow`. Use `mix-blend-mode: plus-lighter` / `color-dodge` on DOM
overlays and a bloom pass in the WebGL layer. Light should look like it comes
from inside the scene.

### Tokens

All colour, type scale, spacing, easing curves and durations live in one
tokens file. No hardcoded values in components.

---

## 3. Motion model

### 3.1 Scroll does not move the page, it drives a timeline

```
wheel / touch
   ↓
target scroll value
   ↓
smoothed (lerped) current value
   ↓
normalised progress 0→1
   ↓
camera position + rotation
object transforms
shader uniforms
scene visibility
active agent index
```

Reference implementation:

```ts
current += (target - current) * 0.08   // per frame at 60fps
progress = current / max
```

- Use **inertia / exponential decay**, not springs.
- Damping factor `0.06–0.10`. Tune so motion settles ~300–500ms after the
  wheel stops.
- Make the damping frame-rate independent (scale by delta time) so 120Hz
  displays don't move twice as fast.
- Lenis handles the smoothing; GSAP ScrollTrigger drives section timelines.

### 3.2 The scene is never static

Even with zero input: particles drift, materials shimmer, lights breathe
slowly, the central object rotates fractionally. Amplitude must stay low
enough that it reads as ambient, not as animation. Pause all of it when the
tab is hidden.

### 3.3 Cursor is part of the world

Cursor position maps to world coordinates and emits a decaying trail
(tube or ribbon geometry) with noise-driven movement and a short glow fade.
On touch devices, the touch point does the same.

### 3.4 Transitions are camera moves, not page fades

Navigating to `/careers` or opening an agent detail must not look like a
document swap. Same renderer, same canvas; the camera travels, lighting
shifts, elements dissolve, the next state resolves. Scene state machine:

```
BOOT → HERO → JOURNEY → AGENT_DETAIL → PRODUCTS → TRUST
     → SERVICES → ABOUT → CONTACT → CAREERS
```

### 3.5 Navigation reacts physically

The sticky nav responds to scroll velocity and direction — subtle scale,
stretch or opacity shift — rather than sitting fixed and inert. Keep it
small. The environment should dominate, not the chrome.

---

## 4. Stack

```
Next.js (existing)
├── UI            React
├── WebGL         three + @react-three/fiber + @react-three/drei
├── Post          @react-three/postprocessing (bloom only)
├── Motion        GSAP + ScrollTrigger
├── Scroll        Lenis
├── Shaders       GLSL in separate .glsl files
└── State         Zustand (scene state, scroll progress, active agent)
```

Keep the existing component structure and routes. Do not restructure the app
router.

---

## 5. Section-by-section

### Hero
Full-viewport canvas. A central 3D identity object — metallic/iridescent,
reflective, slowly rotating, reacting to cursor with a small parallax offset.
Existing headline and subhead reveal with a masked stagger, once, on entry.
Existing CTAs stay in place.

### Journey — the centrepiece
The nine steps (Architecture, Decisions, FinOps, Infra, Compliance, Develop,
Security, Delivery, Observe) become nine nodes in a connected 3D structure,
not a numbered list.

- Scroll pins the section and moves the camera from node 01 to node 09.
- The active node illuminates; neighbours dim. Connections between nodes
  glow in sequence to show flow.
- The existing per-step text ("Architect agent does…", "YOU APPROVE",
  "Lead architect signs off") appears as a DOM overlay anchored to the
  active node. Keep this text verbatim.
- The existing "lessons from production feed the next design" line becomes
  the visual feedback loop back from node 09 to node 01.
- Hover on a node: local particle density rises within a small radius, node
  scales ~4%, label fades in. Click: camera eases to that node
  (900ms, `power3.inOut`) and the detail overlay opens.

### Products
Four tabs stay. Replace the tab swap with a camera/material transition:
content crossfades while the scene shifts behind it. The existing pipeline
gate list (Secrets scan, Dependency audit, Code analysis, Container scan,
Policy gate, Sign artifact) animates through its states in sequence — this
is a live demo, so let it actually run.

### Trust, Services, About, Get started
Lower intensity. Scroll-linked reveals, hairline structure, no card grid, no
per-card hover transitions. Services steps 01–04 are a genuine sequence, so
the numbering stays.

### Loader
Boot sequence, not a percentage counter. Three pulsing accent dots while
assets preload, then a camera move into the hero. Minimum display 600ms so
it doesn't flash on fast connections.

---

## 6. Performance budget

| Metric | Target |
|---|---|
| Initial JS (excl. 3D chunk) | ≤ 200KB gzipped |
| 3D chunk | lazy-loaded, after first paint |
| Desktop frame rate | 60fps sustained |
| Mobile frame rate | 30fps minimum, or static fallback |
| DPR cap | 2 desktop, 1.5 mobile |
| CLS | < 0.05 |

Rules:
- GPU-first: instanced meshes, shader-driven motion, minimal per-frame CPU
  work, no per-frame allocation in the render loop.
- Pause rendering when the canvas is offscreen or the tab is hidden.
- Compress geometry, lazy-load media.
- Detect low-end devices and drop to a reduced scene automatically.

---

## 7. Accessibility and quality floor

- `prefers-reduced-motion: reduce` → disable camera choreography, cursor
  trails, ambient drift and bloom. Content becomes a normal scrollable page.
  This path must be fully usable, not an afterthought.
- Full keyboard navigation with visible focus. Every agent node reachable by
  keyboard, not hover-only.
- Semantic HTML preserved. The skip link keeps working.
- All existing text stays in the DOM and readable by screen readers, even
  where it visually sits over the canvas.
- Contrast: body text ≥ 4.5:1 against whatever is behind it. Use a scrim if
  the scene makes that fail.
- No WebGL (or context lost) → static styled page with all content intact.
- SEO metadata and routes unchanged.

---

## 8. Out of scope for now

Flag these but do not build them in the first pass:

- **Multiplayer cursor presence.** Needs a WebSocket backend, hosting cost,
  and a privacy note. Propose an approach, build later.
- **AI navigation** ("what protects cloud infrastructure?" → camera travels
  to the Security agent). Strong idea, needs an API route, agent metadata
  schema and rate limiting. Phase 2.
- **Spatial audio.** Phase 2, and it must be off by default with a visible
  control.

---

## 9. Build phases

Each phase ends with a working build, a browser check and a commit.
Do not start the next phase without confirmation.

| Phase | Deliverable | Done when |
|---|---|---|
| 0 | Plan + token system, no code | Plan approved |
| 1 | Tokens, global styles, Lenis smooth scroll, scene state store | Scrolling feels damped; nothing visually broken |
| 2 | Canvas layer, loader, hero 3D object, cursor trail | Hero renders at 60fps; loader transitions cleanly |
| 3 | Journey: 9 nodes, pinned scroll, camera path, hover/click | All 9 steps reachable by scroll and keyboard |
| 4 | Products tab transitions + pipeline sequence | Tabs transition without content loss |
| 5 | Trust, Services, About, Get started reveals | No section left unstyled |
| 6 | Route transitions, nav physics, reduced-motion path, mobile fallback | Lighthouse + axe pass |
| 7 | Performance pass | Budget in section 6 met on a mid-range laptop |

---

## 10. Acceptance checks

Run before declaring any phase complete:

1. `git diff` on text content shows **zero** copy changes.
2. All existing routes still resolve; no 404s.
3. `prefers-reduced-motion` on → page fully usable, no camera motion.
4. Keyboard-only pass reaches every interactive element with visible focus.
5. Throttled 4x CPU → no frame drops below 30fps on the Journey section.
6. Tab backgrounded → render loop stops (verify in performance profiler).
7. WebGL disabled → content still readable and navigable.
8. Lighthouse performance ≥ 80 on desktop.
