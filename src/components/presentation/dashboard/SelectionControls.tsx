import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Trash2, X, Loader2 } from "lucide-react";

interface SelectionControlsProps {
  isSelecting: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelecting: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function SelectionControls({
  isSelecting,
  selectedCount,
  totalCount,
  onToggleSelecting,
  onSelectAll,
  onDeselectAll,
  onDelete,
  isDeleting,
}: SelectionControlsProps) {
  if (!isSelecting) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSelecting}
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Select
      </Button>
    );
  }

  return (
    <div className="flex w-full items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSelecting}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
        {selectedCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            className="gap-2"
          >
            Deselect All ({selectedCount})
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="gap-2"
          >
            Select All ({totalCount})
          </Button>
        )}
        {selectedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                Delete ({selectedCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {selectedCount} selected{" "}
                  {selectedCount === 1 ? "presentation" : "presentations"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}