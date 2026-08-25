"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  decimals = 1, 
  prefix = "", 
  suffix = "", 
  className = "" 
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(value);
  // Fast, responsive spring easing without bounce delay
  const springVal = useSpring(motionVal, { stiffness: 200, damping: 24 });
  const displayVal = useTransform(springVal, (latest) => {
    return `${prefix}${latest.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span ref={ref} className={`tabular-nums ${className}`}>
      {displayVal}
    </motion.span>
  );
}
