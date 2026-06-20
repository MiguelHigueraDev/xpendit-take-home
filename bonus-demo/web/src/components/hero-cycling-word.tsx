import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const WORDS = ["política", "moneda", "antigüedad", "categoría"] as const;

gsap.registerPlugin(useGSAP);

export function HeroCyclingWord() {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const word = wordRef.current;
      if (!word) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const timeline = gsap.timeline({ repeat: -1 });
      timeline.set(word, { textContent: WORDS[0], yPercent: 0, opacity: 1 });

      WORDS.forEach((_, index) => {
        const next = WORDS[(index + 1) % WORDS.length];

        timeline
          .to({}, { duration: 2.5 })
          .to(word, {
            yPercent: -100,
            opacity: 0,
            duration: 0.28,
            ease: "power2.in",
          })
          .set(word, { textContent: next, yPercent: 100, opacity: 0 })
          .to(word, {
            yPercent: 0,
            opacity: 1,
            duration: 0.28,
            ease: "power2.out",
          });
      });
    },
    { scope: wrapRef },
  );

  return (
    <span
      ref={wrapRef}
      className="cycling-word-wrap inline-block h-[1.05em] overflow-hidden align-bottom leading-[1.05]"
    >
      <span ref={wordRef} className="cycling-word inline-block">
        {WORDS[0]}
      </span>
    </span>
  );
}
