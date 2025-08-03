"use client";
import React from "react";
import { usePresentationState } from "@/states/presentation-state";
import PresentationLayout from "./PresentationLayout";
import { PlateSlide } from "@/components/presentation/utils/parser";

interface MainProps {
  initialSlides: PlateSlide[];
  presentationId: string;
  presentationTitle: string;
}

const Main: React.FC<MainProps> = ({
  initialSlides,
  presentationId,
  presentationTitle,
}) => {
  const { setSlides, setCurrentPresentation } = usePresentationState();

  React.useEffect(() => {
    // Set the initial state when the component mounts
    setSlides(initialSlides);
    setCurrentPresentation(presentationId, presentationTitle);
  }, [
    initialSlides,
    presentationId,
    presentationTitle,
    setSlides,
    setCurrentPresentation,
  ]);

  return (
    <PresentationLayout>
      {/* The children for PresentationLayout are rendered within it, not here */}
    </PresentationLayout>
  );
};

export default Main;
