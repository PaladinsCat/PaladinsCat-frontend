/** ScrambleText component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/reduced-motion";

const scrambleChars = "!@#$%&*+-=[]{}|;:,.<>?/~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomChar() {
  return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
}

interface ScrambleTextProps {
  text: string;
  speed?: number;
  iterations?: number;
  className?: string;
  delayFromCenter?: boolean;
}

function ScrambleLetter({
  char,
  speed,
  iterations,
  delay,
}: {
  char: string;
  speed: number;
  iterations: number;
  delay: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [isRevealed, setIsRevealed] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let count = 1;
    const timeout = setTimeout(() => {
      setDisplayed(randomChar());
      setIsRevealed(false);

      intervalRef.current = setInterval(() => {
        count++;
        if (count >= iterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRevealed(true);
        } else {
          setDisplayed(randomChar());
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [char, delay, speed, iterations]);

  return (
    <span className="relative inline-block">
      <span>{char}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: isRevealed ? 0 : 0.35, transition: "opacity 0.4s ease" }}
      >
        {displayed}
      </span>
    </span>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function ScrambleText({
  text,
  speed = 150,
  iterations = 12,
  className = "",
  delayFromCenter = true,
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const centerIndex = Math.floor(text.length / 2);
  const letters = text.split("");

  if (reduceMotion) {
    return <span className={`inline-flex ${className}`}>{text}</span>;
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <span className="sr-only">{text}</span>
      {letters.map((letter, i) => {
        const distanceFromCenter = Math.abs(i - centerIndex);
        const staggerDelay = delayFromCenter ? distanceFromCenter * 80 : i * 30;

        if (letter === ' ') {
          return <span key={`${i}-space`} className="inline-block w-[0.35em]" aria-hidden="true" />;
        }

        return (
          <span key={`${i}-${letter}`} aria-hidden="true">
            <ScrambleLetter char={letter} speed={speed} iterations={iterations} delay={staggerDelay} />
          </span>
        );
      })}
    </span>
  );
}
