"use client";

import { useEffect, useRef, useState } from "react";

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
}: {
  char: string;
  speed: number;
  iterations: number;
}) {
  const [displayed, setDisplayed] = useState(char);
  const [isRevealed, setIsRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let count = 0;
    setDisplayed(randomChar());

    intervalRef.current = setInterval(() => {
      count++;
      if (count >= iterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayed(char);
        setIsRevealed(true);
      } else {
        setDisplayed(randomChar());
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [char, speed, iterations]);

  return <span style={{ opacity: isRevealed ? 1 : 0.35, transition: 'opacity 0.4s ease' }}>{displayed}</span>;
}

export default function ScrambleText({
  text,
  speed = 150,
  iterations = 12,
  className = "",
  delayFromCenter = true,
}: ScrambleTextProps) {
  const centerIndex = Math.floor(text.length / 2);
  const letters = text.split("");

  return (
    <span className={`inline-flex ${className}`}>
      {letters.map((letter, i) => {
        const distanceFromCenter = Math.abs(i - centerIndex);
        const staggerDelay = delayFromCenter ? distanceFromCenter * 80 : i * 30;

        if (letter === ' ') {
          return <span key={i} className="inline-block w-[0.35em]" aria-hidden="true" />;
        }

        return (
          <span key={i} style={{ animationDelay: `${staggerDelay}ms` }}>
            <ScrambleLetter char={letter} speed={speed} iterations={iterations} />
          </span>
        );
      })}
    </span>
  );
}
