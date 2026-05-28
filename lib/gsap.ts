/**
 * Centralized GSAP singleton.
 * Registers all plugins once to avoid double-registration warnings,
 * and exposes a tree-shake-friendly surface for components.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Match RTL: GSAP doesn't care about text direction but we expose a flag.
  gsap.config({ nullTargetWarn: false });
}

export { gsap, ScrollTrigger, useGSAP };
