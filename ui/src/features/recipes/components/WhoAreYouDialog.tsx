import { useState, type FormEvent } from "react";
import type { Language } from "@/shared/utils/translator";
import { getLabel } from "@/shared/utils/labels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface WhoAreYouDialogProps {
  open: boolean;
  knownUsers: string[];
  currentLanguage: Language;
  onPick: (name: string) => void;
  onAddUser: (name: string) => Promise<string | null>;
  onCancel: () => void;
}

export function WhoAreYouDialog({
  open,
  knownUsers,
  currentLanguage,
  onPick,
  onAddUser,
  onCancel,
}: WhoAreYouDialogProps) {
  const [other, setOther] = useState("");
  const [saving, setSaving] = useState(false);

  const handleNewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = other.trim();
    if (!name) {
      return;
    }
    setSaving(true);
    const added = await onAddUser(name);
    setSaving(false);
    if (added) {
      onPick(added);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getLabel("whoAreYouTitle", currentLanguage)}</DialogTitle>
          <DialogDescription>{getLabel("whoAreYouBody", currentLanguage)}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 px-5 py-3">
          {knownUsers.map((name) => (
            <Button
              key={name}
              type="button"
              variant="outline"
              className="justify-start text-base"
              onClick={() => onPick(name)}
            >
              {name}
            </Button>
          ))}
          <form onSubmit={handleNewSubmit} className="mt-2 flex gap-2">
            <Input
              type="text"
              placeholder={getLabel("whoAreYouOther", currentLanguage)}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              maxLength={60}
            />
            <Button type="submit" disabled={!other.trim() || saving}>
              {saving ? "…" : getLabel("continue", currentLanguage)}
            </Button>
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {getLabel("cancel", currentLanguage)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
