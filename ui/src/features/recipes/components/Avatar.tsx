import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface AvatarProps {
  photoUrl?: string;
  name?: string;
  size?: "sm" | "md";
  className?: string;
}

const PALETTE = ["#b87c7c", "#7cb8b8", "#b8b87c", "#b87ca8", "#7ca8b8", "#a8b87c"];

function getInitials(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

function getColorFromName(name: string): string {
  if (!name) {
    return "#999";
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
} as const;

export function Avatar({ photoUrl, name, size = "sm", className }: AvatarProps) {
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);
  const displayName = name ?? "";
  const showPhoto = photoUrl !== undefined && erroredUrl !== photoUrl;

  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
    sizeClasses[size],
    className
  );

  if (showPhoto) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        className={cn(base, "object-cover")}
        onError={() => setErroredUrl(photoUrl)}
      />
    );
  }

  return (
    <div className={base} style={{ backgroundColor: getColorFromName(displayName) }}>
      {displayName ? getInitials(displayName) : "?"}
    </div>
  );
}
