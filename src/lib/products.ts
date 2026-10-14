/** Where the Products section sits in the page, and the live values the scene and the DOM share. */
export const productsState = {
  on: false,
  top: 0,
  height: 0,
  vh: 1,
  /** Active tab (0-3) and the camera's orbit angle around the product object, eased by GSAP. */
  tab: 0,
  theta: 0,
  /** 0..1 flash that the delivery demo raises each time a gate passes. */
  pulse: 0,
  /** How visible the Products backdrop is (0-1), written by the camera rig each frame. */
  vis: 0,
};
