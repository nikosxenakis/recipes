import type { Language } from '../utils/translator';
import { isWakeLockSupported } from '../hooks/useWakeLock';
import { getLabel } from '../utils/labels';

interface WakeLockToggleProps {
  enabled: boolean;
  onChange: (next: boolean) => void;
  language: Language;
}

export function WakeLockToggle({ enabled, onChange, language }: WakeLockToggleProps) {
  if (!isWakeLockSupported()) {
    return null;
  }

  const title = getLabel(enabled ? 'keepAwakeOn' : 'keepAwakeOff', language);

  return (
    <button
      type="button"
      className="wake-lock-toggle"
      onClick={(event) => {
        event.stopPropagation();
        onChange(!enabled);
      }}
      title={title}
      aria-pressed={enabled}
      aria-label={title}
    >
      {enabled ? '💡' : '🌙'}
    </button>
  );
}
