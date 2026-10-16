"use client";

import {
  AuroraHeadline,
  KineticType,
  MagneticButton,
  ConstellationCard,
  LiquidGlassCard,
  HoloTiltCard,
  InfiniteMarquee,
  MagneticDock,
  RotatingWords,
  ShinyBorderButton,
  ConfettiButton,
  FlipCard,
  NotificationStack,
  OrbitLoader,
} from "@motionfoundry/ui";
import "@motionfoundry/ui/styles.css";

export default function ExampleConsumerPage() {
  return (
    <main style={{ background: "#09090b", color: "#f4f4f6", minHeight: "100vh", padding: "3rem" }}>
      <AuroraHeadline text="MotionFoundry v2.1 Consumer Application" />
      <KineticType text="Choreographed kinetic typography for precision interfaces" />
      <div style={{ marginTop: "1.5rem" }}>
        <InfiniteMarquee />
      </div>
      <div style={{ marginTop: "1.5rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <ConstellationCard title="Imported from @motionfoundry/ui" />
        <LiquidGlassCard title="Layered Specular Translucency" />
        <HoloTiltCard title="Holographic 3D Surface" />
      </div>
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <MagneticButton>Explore 48 Components</MagneticButton>
        <MagneticDock />
      </div>

      {/* Studio Kit collection */}
      <h2 style={{ marginTop: "3rem", fontSize: "1.75rem", fontWeight: 600 }}>
        <RotatingWords prefix="Studio Kit adds" words={["feedback", "delight", "clarity"]} />
      </h2>
      <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
        <ShinyBorderButton label="Get early access" />
        <ConfettiButton label="Ship it" />
        <OrbitLoader />
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
        <FlipCard trigger="click" />
        <NotificationStack />
      </div>
    </main>
  );
}
