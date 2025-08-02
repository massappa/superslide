import { PresentationControls } from "@/components/presentation/dashboard/PresentationControls";
import { PresentationGenerationManager } from "@/components/presentation/dashboard/PresentationGenerationManager";
import { PromptInput } from "@/components/presentation/outline/PromptInput";

export default function NewPresentationPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="mb-8 text-center text-4xl font-bold">
        Create a New Presentation
      </h1>
      <div className="space-y-6">
        <PromptInput />
        <PresentationControls />
      </div>
      <PresentationGenerationManager />
    </div>
  );
}
