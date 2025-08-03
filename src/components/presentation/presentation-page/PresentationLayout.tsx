"use client";
import React, { useState, useCallback, useEffect } from "react";
import { usePresentationState } from "@/states/presentation-state";
import { SlidePreview } from "./SlidePreview";
import { CustomThemeFontLoader } from "./FontLoader";
import { LoadingState } from "./Loading";
import { Resizable } from "re-resizable";
import { GripVertical } from "lucide-react";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { type ThemeProperties, themes, setThemeVariables } from "@/lib/presentation/themes";
import { ThemeBackground } from "../theme/ThemeBackground";
import { PresentationSlidesView } from "./PresentationSlidesView";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { useTheme } from "next-themes";
import { type TElement } from "@udecode/plate-common";

interface PresentationLayoutProps {
  isLoading?: boolean;
}

export default function PresentationLayout({ isLoading = false }: PresentationLayoutProps) {
  const {
    currentSlideIndex,
    setCurrentSlideIndex,
    slides,
    setSlides,
    theme: themeName,
  } = usePresentationState();
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const { scrollToSlide } = usePresentationSlides();
  const { save } = useDebouncedSave({ delay: 1000 });
  const { resolvedTheme } = useTheme();

  const themeData: ThemeProperties | undefined = (themes as any)[themeName];

  useEffect(() => {
    if (themeData) {
      setThemeVariables(themeData, resolvedTheme === 'dark');
    }
  }, [themeData, resolvedTheme]);

  const handleSlideChange = useCallback((value: TElement[], index: number) => {
    setSlides(slides.map((slide, i) => (i === index ? { ...slide, content: value } : slide)));
    save();
  }, [slides, setSlides, save]);

  const handleSlideClick = useCallback(
    (index: number) => {
      setCurrentSlideIndex(index);
      scrollToSlide(index);
    },
    [scrollToSlide, setCurrentSlideIndex]
  );

  const handleResize = useCallback(
    (_e: unknown, _direction: unknown, ref: HTMLElement, d: { width: number }) => {
      setSidebarWidth(ref.offsetWidth);
    }, []
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ThemeBackground className="h-full w-full">
      {themeData && <CustomThemeFontLoader themeData={themeData} />}
      <div className="flex h-full">
        <Resizable
          size={{ width: sidebarWidth, height: "100%" }}
          minWidth={150}
          maxWidth={400}
          enable={{ right: true }}
          onResize={handleResize}
          handleComponent={{
            right: (
              <div className="group/resize relative flex h-full w-1.5 cursor-col-resize items-center justify-center bg-transparent">
                <div className="h-full w-px bg-border group-hover/resize:w-0.5 group-hover/resize:bg-primary" />
              </div>
            ),
          }}
        >
          <ScrollArea className="h-full bg-background/50">
            <SlidePreview
              onSlideClick={handleSlideClick}
              currentSlideIndex={currentSlideIndex}
            />
          </ScrollArea>
        </Resizable>
        
        <div className="presentation-slides max-h-full flex-1 overflow-auto pb-20">
          <PresentationSlidesView handleSlideChange={handleSlideChange} isGeneratingPresentation={false} />
        </div>
      </div>
    </ThemeBackground>
  );
}