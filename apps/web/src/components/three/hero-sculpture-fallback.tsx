"use client";

/** Static CSS sculpture when WebGL / reduced motion is preferred. */
export function HeroSculptureFallback({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto aspect-square w-full max-w-xl">
        <div
          className="atelier-breathe absolute inset-[12%] rounded-[42%] opacity-90"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, #e0d6c8 0%, #c4b8a5 28%, #5b8fa8 62%, #121214 100%)",
            filter: "blur(0.5px)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
          }}
        />
        <div
          className="absolute inset-[22%] rounded-[40%] border border-[#e0d6c8]/20"
          style={{ transform: "rotate(18deg)" }}
        />
        <div
          className="absolute inset-[30%] rounded-[38%] border border-[#5b8fa8]/25"
          style={{ transform: "rotate(-12deg)" }}
        />
      </div>
    </div>
  );
}
