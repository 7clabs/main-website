/** Motion tokens for JavaScript. They mirror --ease-* and --dur-* in src/styles/tokens.css. */
export const motion = {
  /** Scroll smoothing: exponential decay, settles about 300-500 ms after the wheel stops. */
  scrollLerp: 0.085,
  /** Camera move to a node or section. */
  cameraMs: 900,
  cameraEase: "power3.inOut",
  /** The loader never flashes on fast connections. */
  loaderMinMs: 600,
  /** Camera move from the loader into the hero. */
  bootCameraMs: 1600,
  /** Hover on a node: how much it scales. */
  nodeHoverScale: 1.04,
  fastMs: 200,
  baseMs: 500,
  slowMs: 900,
} as const;

/** power3.inOut as a plain function (Lenis wants a function, GSAP wants the name above). */
export const power3InOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The scene state machine from SPEC.md section 3.4. */
export const SCENES = ["BOOT", "HERO", "JOURNEY", "AGENT_DETAIL", "PRODUCTS", "TRUST", "SERVICES", "ABOUT", "CONTACT", "CAREERS"] as const;
export type SceneName = (typeof SCENES)[number];

/** Which page section belongs to which scene, in page order. */
export const SECTION_SCENES: { id: string; scene: SceneName }[] = [
  { id: "top", scene: "HERO" },
  { id: "journey", scene: "JOURNEY" },
  { id: "products", scene: "PRODUCTS" },
  { id: "trust", scene: "TRUST" },
  { id: "services", scene: "SERVICES" },
  { id: "about", scene: "ABOUT" },
  { id: "contact", scene: "CONTACT" },
];
