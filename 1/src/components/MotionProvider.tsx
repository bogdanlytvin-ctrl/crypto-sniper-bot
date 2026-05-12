"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Enables tree-shaking of framer-motion by loading only DOM animation features.
 * All animated components should use `m` instead of `motion` from framer-motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
