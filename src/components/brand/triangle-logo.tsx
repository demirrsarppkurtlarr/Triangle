import { cn } from "@/lib/utils";

type TriangleLogoProps = {
  className?: string;
  size?: number;
  showGlow?: boolean;
};

export function TriangleLogo({
  className,
  size = 40,
  showGlow = false,
}: TriangleLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="triangle-gradient" x1="8" y1="6" x2="40" y2="42">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <path
          d="M24 6L42 40H6L24 6Z"
          fill="url(#triangle-gradient)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M24 16L32 34H16L24 16Z"
          fill="white"
          fillOpacity="0.22"
        />
      </svg>
    </div>
  );
}
