import fs from "node:fs";
import * as UI from "../../packages/ui/dist/index.mjs";

const pageCode = fs.readFileSync(new URL("./app/page.tsx", import.meta.url), "utf8");
const requiredExports = [
  "AuroraHeadline",
  "KineticType",
  "MagneticButton",
  "ConstellationCard",
  "LiquidGlassCard",
  "HoloTiltCard",
  "InfiniteMarquee",
  "MagneticDock",
  "RotatingWords",
  "ShinyBorderButton",
  "ConfettiButton",
  "FlipCard",
  "NotificationStack",
  "OrbitLoader",
];
for (const exp of requiredExports) {
  if (typeof UI[exp] !== "function") throw new Error(`Missing export ${exp} in @motionfoundry/ui`);
  if (!pageCode.includes(exp)) throw new Error(`Example page does not use ${exp}`);
}
console.log(`[examples/nextjs-app] Consumer build & @motionfoundry/ui v${UI.MOTIONFOUNDRY_VERSION} import verification passed.`);
