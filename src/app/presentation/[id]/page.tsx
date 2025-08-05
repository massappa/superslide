import {
  getPresentation,
  getSlides,
} from "@/app/_actions/presentation/presentationActions";
import PresentationPage from "@/components/presentation/presentation-page/Main";
import React from "react";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  // Fetch initial data on the server
  const presentationResult = await getPresentation(id);
  const slidesResult = await getSlides(id);

  if (!presentationResult.success) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Presentation not found</h1>
          <p className="text-muted-foreground">{presentationResult.message}</p>
        </div>
      </div>
    );
  }

  const presentation = presentationResult.presentation;
  const initialSlides = slidesResult.slides ?? [];

  return (
    <PresentationPage
      initialSlides={initialSlides}
      presentationId={presentation.id}
      presentationTitle={presentation.title}
    />
  );
}
