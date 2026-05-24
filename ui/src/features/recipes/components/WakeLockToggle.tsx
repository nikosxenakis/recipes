import { Lightbulb, LightbulbOff } from "lucide-react";
import type { Language } from "@/shared/utils/translator";
import { isWakeLockSupported } from "@/features/recipes/hooks/useWakeLock";
import { getLabel } from "@/shared/utils/labels";
import { Button } from "@/shared/components/ui/button";

interface WakeLockToggleProps {
  enabled: boolean;
  onChange: (next: boolean) => void;
  language: Language;
}

export function WakeLockToggle({ enabled, onChange, language }: WakeLockToggleProps) {
  if (!isWakeLockSupported()) {
    return null;
  }

  const title = getLabel(enabled ? "keepAwakeOn" : "keepAwakeOff", language);

  return (
    <Button
      type="button"
      variant={enabled ? "default" : "outline"}
      size="icon"
      onClick={(event) => {
        event.stopPropagation();
        onChange(!enabled);
      }}
      title={title}
      aria-pressed={enabled}
      aria-label={title}
    >
      {enabled ? <Lightbulb className="h-4 w-4" /> : <LightbulbOff className="h-4 w-4" />}
    </Button>
  );
}
