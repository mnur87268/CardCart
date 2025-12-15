import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

window.addEventListener("load", async () => {
  const root = document.getElementById("app");
  const { bootCardcartUI } = await import("./Cardcart-ui.js");

  const isMini = await (async () => {
    try {
      return await sdk.isInMiniApp();
    } catch {
      return false;
    }
  })();

  const ui = bootCardcartUI({
    root,
    onReadyText: isMini ? "mini app detected ✓" : "web mode ✓"
  });
  ui.setEnv(isMini);

  // ALWAYS call ready()
  try {
    await sdk.actions.ready();
  } catch {}
});