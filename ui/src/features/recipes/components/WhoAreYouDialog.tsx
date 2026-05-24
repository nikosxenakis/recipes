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
  knownCreators: string[];
  currentLanguage: Language;
  onPick: (name: string) => void;
  onCancel: () => void;
}

export function WhoAreYouDialog({
  open,
  knownCreators,
  currentLanguage,
  onPick,
  onCancel,
}: WhoAreYouDialogProps) {
  const [other, setOther] = useState("");

  const handleNewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = other.trim();
    if (name) {
      onPick(name);
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
          {knownCreators.map((name) => (
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
            <Button type="submit" disabled={!other.trim()}>
              {getLabel("continue", currentLanguage)}
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
