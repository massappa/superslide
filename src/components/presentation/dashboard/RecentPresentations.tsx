"use client";
import { useState } from "react";
import {
  Clock,
  ChevronRight,
  Star,
  Pencil,
  Trash2,
  MoreHorizontal,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePresentationState } from "@/states/presentation-state";
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
import type { Presentation } from "@/types/database";
import { fetchPresentations } from "@/app/_actions/presentation/fetchPresentations";
import {
  deletePresentations,
  getPresentationContent,
  updatePresentationTitle,
} from "@/app/_actions/presentation/presentationActions";
import {
  addToFavorites,
  removeFromFavorites,
} from "@/app/_actions/presentation/toggleFavorite";

export function RecentPresentations() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCurrentPresentation, setIsSheetOpen } = usePresentationState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const { data, isLoading, isError } = useInfiniteQuery({
    queryKey: ["presentations-all"],
    queryFn: async ({ pageParam = 0 }) => fetchPresentations(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? (lastPage.items.length / 10) : undefined),
  });

  const { mutate: deletePresentationMutation, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePresentations([id]);
      if (!result.success && !result.partialSuccess) {
        throw new Error(result.message ?? "Failed to delete presentation");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
      setDeleteDialogOpen(false);
      toast.success("Presentation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const { mutate: renameMutation } = useMutation({
    mutationFn: async (params: { id: string; currentTitle: string }) => {
      const newTitle = prompt("Enter new title", params.currentTitle || "");
      if (!newTitle || newTitle === params.currentTitle) return null;
      const result = await updatePresentationTitle(params.id, newTitle);
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
      toast.error("Error", { description: error.message });
    },
  });
  
  // This is a placeholder. A real implementation would check a `is_favorited` field.
  const isFavorited = (id: string) => false; 

  const { mutate: favoriteMutation } = useMutation({
    mutationFn: async (id: string) => {
      return isFavorited(id) ? removeFromFavorites(id) : addToFavorites(id);
    },
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error("Error", { description: result.error });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["presentations-all"] });
      toast.success(result.message);
    },
    onError: () => {
      toast.error("Failed to update favorites");
    },
  });

  const handlePresentationClick = async (presentation: Presentation) => {
    try {
      setIsNavigating(presentation.id);
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
      setIsNavigating(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (isError) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const presentations = data?.pages.flatMap(page => page.items).slice(0, 3) ?? [];

  if (presentations.length === 0) return null;
  
  const handleDelete = (id: string) => {
    setSelectedPresentationId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Recent Presentations
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSheetOpen(true)}
          className="gap-2 text-primary hover:bg-primary/5 hover:text-primary"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {presentations.map((presentation) => (
          <Card
            key={presentation.id}
            className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <div
              className="relative aspect-video bg-muted"
              onClick={() => handlePresentationClick(presentation)}
            >
              {isNavigating === presentation.id ? (
                 <div className="flex h-full w-full items-center justify-center bg-primary/10">
                   <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                 </div>
              ) : presentation.thumbnail_url ? (
                <img
                  src={presentation.thumbnail_url}
                  alt={presentation.title || "Presentation thumbnail"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <PresentationIcon className="h-12 w-12 text-primary/50" />
                </div>
              )}
            </div>
            <CardContent className="p-4" onClick={() => handlePresentationClick(presentation)}>
              <h3 className="line-clamp-1 font-semibold text-foreground">
                {presentation.title || "Untitled Presentation"}
              </h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {`Updated ${formatDate(presentation.updated_at)}`}
              </div>
            </CardContent>
            <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => renameMutation({ id: presentation.id, currentTitle: presentation.title })} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => favoriteMutation(presentation.id)} className="cursor-pointer">
                    <Star className="mr-2 h-4 w-4" /> Favorite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(presentation.id)} className="cursor-pointer text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your presentation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPresentationId && deletePresentationMutation(selectedPresentationId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}