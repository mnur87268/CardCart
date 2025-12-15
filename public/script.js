import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

window.addEventListener("load", async () => {
  const root = document.getElementById("app");
  const { bootCardcartUI } = await import("./Cardcart-ui.js");

  // --- detect mini app environment ---
  let isMini = false;
  try {
    isMini = await sdk.isInMiniApp();
  } catch {
    isMini = false;
  }

  // --- read host context (Base App vs others) ---
  let clientFid = "n/a";
  let clientName = "unknown";
  try {
    const ctx = await sdk.context;
    clientFid = ctx?.client?.clientFid ?? "n/a";
    clientName = ctx?.client?.name ?? "unknown";
  } catch {}

  // --- DEBUG BADGE (temporary, remove later) ---
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div style="
      position:fixed;
      bottom:10px;
      left:10px;
      z-index:9999;
      background:#000;
      color:#0f0;
      padding:8px 10px;
      border-radius:10px;
      font:12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      box-shadow:0 6px 20px rgba(0,0,0,.4);
    ">
      isMini=${isMini}<br/>
      client=${clientName}<br/>
      fid=${clientFid}
    </div>`
  );

  // --- boot UI ---
  const ui = bootCardcartUI({
    root,
    onReadyText: isMini ? "mini app detected ✓" : "web mode ✓"
  });
  ui.setEnv(isMini);

  // --- REQUIRED: signal ready to host ---
  try {
    await sdk.actions.ready();
  } catch {}
});
