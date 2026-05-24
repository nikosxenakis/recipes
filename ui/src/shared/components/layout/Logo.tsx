import { cn } from "@/shared/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * The Rezeptbuch mark. Strokes/fills use currentColor so it picks up text colour
 * for inline use. For the standalone cream-square logo, use favicon.svg directly.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Rezeptbuch"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" className="fill-[#FBF6EE]" />
      <g className="fill-primary stroke-primary">
        <path
          d="M30 12 C 33 16, 29 20, 32 24 C 35 28, 31 32, 32 34"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <rect x="11" y="30" width="42" height="3.5" rx="1.75" stroke="none" />
        <path d="M14 33 L50 33 L48 52 Q48 54 46 54 L18 54 Q16 54 16 52 Z" stroke="none" />
        <rect x="6" y="36" width="6" height="5" rx="1.5" stroke="none" />
        <rect x="52" y="36" width="6" height="5" rx="1.5" stroke="none" />
      </g>
    </svg>
  );
}
