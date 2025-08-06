// /Users/aswin/Movies/superslide/src/hooks/presentation/useImageGenerator.ts
import { usePresentationState } from "@/states/presentation-state";
import { generateImageAction } from "@/app/_actions/image/generate";
import { type PlateSlide } from "@/components/presentation/utils/parser";
import { type TElement } from "@udecode/plate-common";
import { toast } from "sonner";

// Helper to recursively find and update image nodes
const updateImageNodes = async (nodes: TElement[], setSlides: (slides: PlateSlide[]) => void, allSlides: PlateSlide[]): Promise<void> => {
  for (const node of nodes) {
    if (node.type === 'img' && node.url === 'placeholder' && node.query) {
      const prompt = node.query as string;
      console.log(`Generating image for prompt: "${prompt}"`);
      const result = await generateImageAction(prompt);

      if (result.success && result.image?.url) {
        // Update the specific node in our state
        const updatedSlides = allSlides.map(slide => ({
          ...slide,
          content: slide.content.map(n => {
            const recurseUpdate = (currentNode: TElement): TElement => {
              if (currentNode.id === node.id) {
                return { ...currentNode, url: result.image.url };
              }
              if (currentNode.children) {
                return { ...currentNode, children: (currentNode.children as TElement[]).map(recurseUpdate) };
              }
              return currentNode;
            };
            return recurseUpdate(n as TElement);
          }),
        }));
        // Update the global state
        usePresentationState.setState({ slides: updatedSlides });
        allSlides = updatedSlides; // Use the updated slides for subsequent generations in this loop
        toast.success(`Image generated for: "${prompt.substring(0, 20)}..."`);
      } else {
        toast.error(`Failed to generate image for: "${prompt.substring(0, 20)}..."`);
        console.error("Image generation failed:", result.error);
      }
    }
    // Recurse into children
    if (node.children) {
      await updateImageNodes(node.children as TElement[], setSlides, allSlides);
    }
  }
};


export const useImageGenerator = () => {
  const { slides, setSlides } = usePresentationState();

  const generateImagesForAllSlides = async () => {
    if (slides.length === 0) return;

    toast.info("Starting image generation for all placeholders...");

    // Create a deep copy to avoid mutation issues during async operations
    let currentSlidesState = JSON.parse(JSON.stringify(slides));

    for (const slide of currentSlidesState) {
        await updateImageNodes(slide.content as TElement[], setSlides, currentSlidesState);
        // After processing a slide, get the latest state for the next iteration
        currentSlidesState = usePresentationState.getState().slides;
    }
    
    console.log("Image generation process finished.");
    toast.success("All image generations complete!");
  };

  return { generateImagesForAllSlides };
};