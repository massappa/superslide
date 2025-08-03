"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  EllipsisVertical,
  Star,
  Trash2,
  Pencil,
  Presentation as PresentationIcon,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import {
  deletePresentations,
  duplicatePresentation,
  getPresentationContent,
  updatePresentationTitle,
} from "@/app/_actions/presentation/presentationActions";
import {
  addToFavorites,
  removeFromFavorites,
} from "@/app/_actions/presentation/toggleFavorite";
import type { Presentation } from "@/types/database";

interface PresentationItemProps {
  presentation: Presentation;
  isFavorited?: boolean;
  isSelecting?: boolean;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

export function PresentationItem({
  presentation,
  isFavorited = false,
  isSelecting = false,
  onSelect,
  isSelected = false,
  isLoading: initialLoading = false,
}: PresentationItemProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const queryClient = useQueryClient();
  const setCurrentPresentation = usePresentationState(
    (state) => state.setCurrentPresentation
  );

  const { mutate: deletePresentationMutation, isPending: isDeleting } =
    useMutation({
      mutationFn: async () => {
        const result = await deletePresentations([presentation.id]);
        if (!result.success && !result.partialSuccess) {
          throw new Error(result.message ?? "Failed to delete presentation");
        }
        return result;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["presentations-all"],
        });
        setIsDeleteDialogOpen(false);
        toast.success("Presentation deleted successfully");
      },
      onError: (error: Error) => {
        console.error("Failed to delete presentation:", error);
        toast.error("Error", { description: "Failed to delete presentation" });
      },
    });

  const { mutate: renameMutation, isPending: isRenaming } = useMutation({
    mutationFn: async () => {
      const newTitle = prompt("Enter new title", presentation.title || "");
      if (!newTitle || newTitle === presentation.title) return null;
      const result = await updatePresentationTitle(presentation.id, newTitle);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to rename presentation");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
      toast.success("Presentation renamed successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to rename presentation:", error);
      toast.error("Error", { description: "Failed to rename presentation" });
    },
  });

  const { mutate: duplicateMutation, isPending: isDuplicating } = useMutation({
    mutationFn: async () => {
      const result = await duplicatePresentation(presentation.id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to duplicate presentation");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
      toast.success("Presentation duplicated successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to duplicate presentation:", error);
      toast.error("Error", { description: "Failed to duplicate presentation" });
    },
  });

  const { mutate: favoriteMutation, isPending: isFavoritePending } =
    useMutation({
      mutationFn: async () => {
        return isFavorited
          ? removeFromFavorites(presentation.id)
          : addToFavorites(presentation.id);
      },
      onSuccess: async (result) => {
        if (!result.success) {
          toast.error("Failed to update favorites");
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
        toast.success(
          isFavorited
            ? "Removed from favorites"
            : "Added to favorites"
        );
      },
      onError: () => {
        toast.error("Failed to update favorites");
      },
    });

  const handleClick = async (e: React.MouseEvent) => {
    if (isSelecting && onSelect) {
      e.preventDefault();
      onSelect(presentation.id);
      return;
    }
    try {
      setIsNavigating(true);
      setCurrentPresentation(presentation.id, presentation.title);
      const response = await getPresentationContent(presentation.id);
      if (!response.success) {
        throw new Error(
          response.message ?? "Failed to check presentation status"
        );
      }
      const slides = (response.presentation?.content as { slides: unknown[] })?.slides ?? [];
      if (slides.length > 0) {
        router.push(`/presentation/${presentation.id}`);
      } else {
        router.push(`/presentation/generate/${presentation.id}`);
      }
    } catch (error) {
      console.error("Failed to navigate:", error);
      toast.error("Failed to open presentation");
    } finally {
      setIsNavigating(false);
    }
  };

  const isLoading = initialLoading || isNavigating;

  return (
    <>
      <div
        className={cn(
          "group relative flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:bg-accent/5",
          isSelected && "ring-2 ring-primary",
          isLoading && "pointer-events-none opacity-70"
        )}
      >
        <div className="flex w-full items-center gap-3" onClick={handleClick}>
          {isSelecting ? (
            <div
              className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background"
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <PresentationIcon className="h-5 w-5 text-primary" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground">
              {isLoading ? "Loading..." : presentation.title || "Untitled"}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : new Date(presentation.updated_at ?? new Date()).toLocaleDateString()}
            </p>
          </div>
        </div>
        {!isSelecting && !isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => renameMutation()}
                  disabled={isRenaming}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => duplicateMutation()}
                  disabled={isDuplicating}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => favoriteMutation()}
                  disabled={isFavoritePending}
                >
                  <Star
                    className={cn(
                      "mr-2 h-4 w-4",
                      isFavorited && "fill-yellow-400 text-yellow-500"
                    )}
                  />
                  {isFavorited ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              presentation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePresentationMutation()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}