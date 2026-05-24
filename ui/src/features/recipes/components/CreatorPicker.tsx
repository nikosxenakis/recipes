import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Language } from "@/shared/utils/translator";
import { getLabel } from "@/shared/utils/labels";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const ADD_NEW_SENTINEL = "__add_new__";

interface CreatorPickerProps {
  value: string;
  users: string[];
  onChange: (value: string) => void;
  onAddUser: (name: string) => Promise<string | null>;
  currentLanguage: Language;
}

export function CreatorPicker({ value, users, onChange, onAddUser, currentLanguage }: CreatorPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const knownValue = value && (users.includes(value) || value === "")
    ? value
    : value
      ? value
      : "";

  const handleSelect = (next: string) => {
    if (next === ADD_NEW_SENTINEL) {
      setAdding(true);
      setDraft("");
      return;
    }
    onChange(next);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    setSaving(true);
    const added = await onAddUser(trimmed);
    setSaving(false);
    if (added) {
      onChange(added);
      setAdding(false);
      setDraft("");
    }
  };

  if (adding) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={getLabel("addNewUserPlaceholder", currentLanguage)}
          maxLength={60}
        />
        <Button type="submit" size="sm" disabled={!draft.trim() || saving}>
          {saving ? "…" : getLabel("addUser", currentLanguage)}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
          {getLabel("cancel", currentLanguage)}
        </Button>
      </form>
    );
  }

  return (
    <Select value={knownValue} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {value && !users.includes(value) && (
          <SelectItem value={value}>{value}</SelectItem>
        )}
        {users.map((user) => (
          <SelectItem key={user} value={user}>
            {user}
          </SelectItem>
        ))}
        <SelectItem value={ADD_NEW_SENTINEL}>
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {getLabel("addNewUser", currentLanguage)}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
