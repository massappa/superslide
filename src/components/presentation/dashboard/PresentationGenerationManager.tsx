"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePresentationState } from "@/states/presentation-state";
import { SlideParser } from "../utils/parser";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";
import { useCompletion } from "@ai-sdk/react";
import { useImageGenerator } from "@/hooks/presentation/useImageGenerator";

interface StreamMetadata {
  author?: string;
  references?: string[];
}

interface StreamData {
  type: "status-update" | "other";
  data: string;
  metadata?: StreamMetadata;
}

export function PresentationGenerationManager() {
  const {
    numSlides,
    language,
    presentationInput,
    shouldStartOutlineGeneration,
    shouldStartPresentationGeneration,
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    setShouldStartPresentationGeneration,
    resetGeneration,
    setOutline,
    setSlides,
    setIsGeneratingPresentation,
    setDetailLogs,
  } = usePresentationState();
  const { generateImagesForAllSlides } = useImageGenerator();

  const streamingParserRef = useRef<SlideParser>(new SlideParser());
  const slidesRafIdRef = useRef<number | null>(null);
  const outlineRafIdRef = useRef<number | null>(null);
  const slidesBufferRef = useRef<
    ReturnType<SlideParser["getAllSlides"]> | null
  >(null);
  const outlineBufferRef = useRef<string[] | null>(null);

  const updateSlidesWithRAF = (): void => {
    if (slidesBufferRef.current !== null) {
      setSlides(slidesBufferRef.current);
      slidesBufferRef.current = null;
    }
    slidesRafIdRef.current = null;
  };

  const updateOutlineWithRAF = (): void => {
    if (outlineBufferRef.current !== null) {
      setOutline(outlineBufferRef.current);
      outlineBufferRef.current = null;
    }
    outlineRafIdRef.current = null;
  };

  const { completion: outlineCompletion, complete: generateOutline } =
    useCompletion({
      api: "/api/presentation/outline",
      body: {
        prompt: presentationInput,
        numberOfCards: numSlides,
        language,
      },
      onFinish: (_prompt, completion) => {
        if (outlineRafIdRef.current !== null) {
          cancelAnimationFrame(outlineRafIdRef.current);
          outlineRafIdRef.current = null;
        }

        const sections = completion.split(/^# /gm).filter(Boolean);
        const finalOutline: string[] =
          sections.length > 0
            ? sections.map((section) => `# ${section}`.trim())
            : [completion];
        setOutline(finalOutline);

        setIsGeneratingOutline(false);
        setShouldStartOutlineGeneration(false);
        setShouldStartPresentationGeneration(false);

        const { currentPresentationId, currentPresentationTitle, theme } =
          usePresentationState.getState();

        if (currentPresentationId) {
          void updatePresentation({
            id: currentPresentationId,
            outline: finalOutline,
            title: currentPresentationTitle ?? "",
            theme,
          });
        }
      },
      onError: (error) => {
        toast.error("Failed to generate outline: " + error.message);
        resetGeneration();
        if (outlineRafIdRef.current !== null) {
          cancelAnimationFrame(outlineRafIdRef.current);
          outlineRafIdRef.current = null;
        }
      },
    });

  useEffect(() => {
    if (outlineCompletion && typeof outlineCompletion === "string") {
      const sections = outlineCompletion.split(/^# /gm).filter(Boolean);
      const outlineItems: string[] =
        sections.length > 0
          ? sections.map((section) => `# ${section}`.trim())
          : [outlineCompletion];
      outlineBufferRef.current = outlineItems;

      if (outlineRafIdRef.current === null) {
        outlineRafIdRef.current = requestAnimationFrame(updateOutlineWithRAF);
      }
    }
  }, [outlineCompletion]);

  useEffect(() => {
    const startOutlineGeneration = async (): Promise<void> => {
      const { presentationInput, numSlides, language } =
        usePresentationState.getState();
      if (shouldStartOutlineGeneration) {
        try {
          setIsGeneratingOutline(true);

          if (outlineRafIdRef.current === null) {
            outlineRafIdRef.current =
              requestAnimationFrame(updateOutlineWithRAF);
          }

          await generateOutline(presentationInput ?? "", {
            body: {
              prompt: presentationInput ?? "",
              numberOfCards: numSlides,
              language,
            },
          });
        } catch (error) {
          console.log(error);
        } finally {
          setIsGeneratingOutline(false);
          setShouldStartOutlineGeneration(false);
        }
      }
    };

    void startOutlineGeneration();
  }, [shouldStartOutlineGeneration]);

  const generatePresentationStream = async ({
    title,
    outline,
    language,
    tone,
  }: {
    title: string;
    outline: string[];
    language: string;
    tone?: string;
  }) => {
    const parser = streamingParserRef.current;
    parser.reset();
    setDetailLogs([]);
    try {
      const response = await fetch("/api/presentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, outline, language, tone, numSlides }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bufferedText = "";
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          bufferedText += decoder.decode(value, { stream: true });

          const lines = bufferedText.split("\n");
          bufferedText = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const { type, data, metadata } = JSON.parse(line) as StreamData;
              const author = metadata?.author ?? "AIAgent";
              if (type === "status-update") {
                parser.parseChunk(data);
                if (metadata && Array.isArray(metadata.references)) {
                  usePresentationState
                    .getState()
                    .setReferences(metadata.references);
                }
              } else {
                setDetailLogs([
                  ...usePresentationState.getState().detailLogs,
                  { data, metadata: author },
                ]);
              }
              const slides = parser
                .getAllSlides()
                .map((slide) => ({ ...slide }));
              slidesBufferRef.current = slides;
              slidesRafIdRef.current =
                requestAnimationFrame(updateSlidesWithRAF);
            } catch (e) {
              console.error("Failed to parse JSON line:", line, e);
            }
          }
        }
      }

      if (bufferedText.trim()) {
        try {
          const { type, data, metadata } = JSON.parse(
            bufferedText.trim()
          ) as StreamData;
          const author = metadata?.author ?? "AIAgent";
          if (type === "status-update") {
            parser.parseChunk(data);
            if (metadata && Array.isArray(metadata.references)) {
              usePresentationState
                .getState()
                .setReferences(metadata.references);
            }
          } else {
            setDetailLogs([
              ...usePresentationState.getState().detailLogs,
              { data, metadata: author },
            ]);
          }
        } catch (e) {
          console.error(
            "Failed to parse final stream chunk:",
            bufferedText.trim(),
            e
          );
        }
      }

      parser.finalize();
      parser.clearAllGeneratingMarks();
      const finalSlides = parser.getAllSlides();
      slidesBufferRef.current = finalSlides;
      if (slidesRafIdRef.current) {
        cancelAnimationFrame(slidesRafIdRef.current);
      }
      updateSlidesWithRAF(); // Update UI immediately with final text content

      const { currentPresentationId, currentPresentationTitle, theme } =
        usePresentationState.getState();
      if (currentPresentationId) {
        await updatePresentation({ // Use await here
          id: currentPresentationId,
          content: { slides: finalSlides },
          title: currentPresentationTitle ?? "",
          theme,
        });
      }

      setIsGeneratingPresentation(false);
      setShouldStartPresentationGeneration(false);
      
      // *** NEW: TRIGGER IMAGE GENERATION ***
      await generateImagesForAllSlides();

      // Final save after images are generated
      const latestSlides = usePresentationState.getState().slides;
      if (currentPresentationId) {
        await updatePresentation({
          id: currentPresentationId,
          content: { slides: latestSlides },
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Failed to generate presentation: " + error.message);
      } else {
        toast.error("An unknown error occurred during presentation generation.");
      }
      resetGeneration();
      parser.reset();
      if (slidesRafIdRef.current !== null) {
        cancelAnimationFrame(slidesRafIdRef.current);
        slidesRafIdRef.current = null;
      }
    }
    finally {
      if (slidesRafIdRef.current !== null) {
        cancelAnimationFrame(slidesRafIdRef.current);
        slidesRafIdRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (shouldStartPresentationGeneration) {
      const {
        outline,
        presentationInput,
        language,
        presentationStyle,
        currentPresentationTitle,
      } = usePresentationState.getState();
      streamingParserRef.current.reset();
      setIsGeneratingPresentation(true);
      if (slidesRafIdRef.current === null) {
        slidesRafIdRef.current = requestAnimationFrame(updateSlidesWithRAF);
      }
      void generatePresentationStream({
        title: presentationInput ?? currentPresentationTitle ?? "",
        outline,
        language,
        tone: presentationStyle,
      });
    }
  }, [shouldStartPresentationGeneration]);

  useEffect(() => {
    return () => {
      if (slidesRafIdRef.current !== null) {
        cancelAnimationFrame(slidesRafIdRef.current);
        slidesRafIdRef.current = null;
      }

      if (outlineRafIdRef.current !== null) {
        cancelAnimationFrame(outlineRafIdRef.current);
        outlineRafIdRef.current = null;
      }
    };
  }, []);

  return null;
}
