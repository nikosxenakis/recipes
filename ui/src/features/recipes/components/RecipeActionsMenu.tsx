import { useState } from "react";
import { Lightbulb, Link as LinkIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Recipe } from "@/features/recipes/types/recipe";
import type { Language } from "@/shared/utils/translator";
import { getLabel } from "@/shared/utils/labels";
import { isWakeLockSupported } from "@/features/recipes/hooks/useWakeLock";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface RecipeActionsMenuProps {
  recipe: Recipe;
  currentLanguage: Language;
  wakeLockEnabled: boolean;
  onToggleWakeLock: (next: boolean) => void;
  onEdit: () => void;
  onCopyLink: () => void;
  onDelete: () => Promise<void>;
}

export function RecipeActionsMenu({
  recipe,
  currentLanguage,
  wakeLockEnabled,
  onToggleWakeLock,
  onEdit,
  onCopyLink,
  onDelete,
}: RecipeActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supportsWakeLock = isWakeLockSupported();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            aria-label="Recipe options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="h-4 w-4" />
            {getLabel("editRecipe", currentLanguage)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCopyLink}>
            <LinkIcon className="h-4 w-4" />
            {getLabel("copyLink", currentLanguage)}
          </DropdownMenuItem>
          {supportsWakeLock && (
            <DropdownMenuCheckboxItem
              checked={wakeLockEnabled}
              onCheckedChange={onToggleWakeLock}
              onSelect={(e) => e.preventDefault()}
            >
              <Lightbulb className="h-4 w-4" />
              {getLabel("keepAwake", currentLanguage)}
            </DropdownMenuCheckboxItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" />
            {getLabel("deleteRecipe", currentLanguage)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getLabel("deleteConfirmTitle", currentLanguage)}</AlertDialogTitle>
            <AlertDialogDescription>
              {getLabel("deleteConfirmBody", currentLanguage).replace("{title}", recipe.title)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {getLabel("cancel", currentLanguage)}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? getLabel("deleting", currentLanguage) : getLabel("deleteRecipe", currentLanguage)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
