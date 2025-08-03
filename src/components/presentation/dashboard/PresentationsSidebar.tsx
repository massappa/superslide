"use client";
import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { FileX, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePresentationState } from "@/states/presentation-state";
import { useMutation } from "@tanstack/react-query";
import { PresentationItem } from "../PresentationItem";
import type { Presentation } from "@/types/database";
import { SelectionControls } from "./SelectionControls";
import { deletePresentations } from "@/app/_actions/presentation/presentationActions";
import { fetchPresentations } from "@/app/_actions/presentation/fetchPresentations";

interface PresentationResponse {
  items: Presentation[];
  hasMore: boolean;
}

export function PresentationsSidebar() {
  const { ref: loadMoreRef, inView } = useInView();
  const queryClient = useQueryClient();
  const {
    isSelecting,
    selectedPresentations,
    toggleSelecting,
    selectAllPresentations,
    deselectAllPresentations,
    togglePresentationSelection,
    isSheetOpen,
    setIsSheetOpen,
  } = usePresentationState();

  const handleCreateNew = () => {
    // This assumes clicking "Create New" on the dashboard is the primary flow
    // and will close the sheet to show the main dashboard view.
    setIsSheetOpen(false); 
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<PresentationResponse>({
    queryKey: ["presentations-all"],
    queryFn: async ({ pageParam = 0 }) => fetchPresentations(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PresentationResponse, allPages) => {
      if (lastPage?.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
  });

  const { mutate: deleteSelectedPresentations, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const result = await deletePresentations(selectedPresentations);
      if (!result.success && !result.partialSuccess) {
        throw new Error(result.message ?? "Failed to delete presentations");
      }
      return result;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
      deselectAllPresentations();
      toggleSelecting();
      toast.success(result.message || "Selected presentations deleted");
    },
    onError: (error: Error) => {
      console.error("Failed to delete presentations:", error);
      toast.error("Error", {
        description: "Failed to delete selected presentations.",
      });
    },
  });


  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPresentations = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSelectAll = () => {
    selectAllPresentations(allPresentations.map((p) => p.id));
  };

  const sidebarContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full" />
          ))}
        </div>
      );
    }
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <FileX className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Failed to load presentations.
            <br />
            Please try again later.
          </p>
        </div>
      );
    }
    if (allPresentations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <FileX className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You haven't created any
            <br />
            presentations yet.
          </p>
        </div>
      );
    }
    return (
      <>
        <div className="space-y-2 p-0.5">
          {allPresentations.map((presentation) => (
            <PresentationItem
              key={presentation.id}
              presentation={presentation}
              isSelecting={isSelecting}
              onSelect={togglePresentationSelection}
              isSelected={selectedPresentations.includes(presentation.id)}
            />
          ))}
        </div>
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={loadMoreRef} className="h-1" />
      </>
    );
  };
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent
        side="left"
        className="flex h-full w-[400px] flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-2">
          <SheetHeader className="space-y-4 text-left">
            <SheetTitle className="flex items-center justify-between">
              <span>Your Presentations</span>
            </SheetTitle>
            <div className="flex items-center justify-between">
              {!isSelecting && (
                <Button onClick={handleCreateNew} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Presentation
                </Button>
              )}
              <div className="flex w-full items-center justify-end">
                 <SelectionControls
                    isSelecting={isSelecting}
                    selectedCount={selectedPresentations.length}
                    totalCount={allPresentations.length}
                    onToggleSelecting={toggleSelecting}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={deselectAllPresentations}
                    onDelete={() => deleteSelectedPresentations()}
                    isDeleting={isDeleting}
                />
              </div>
            </div>
          </SheetHeader>
        </div>
        <ScrollArea className="flex-1 px-6 pt-2">
          {sidebarContent()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}