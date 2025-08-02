import { getPresentation } from "@/app/_actions/presentation/presentationActions";
import PresentationLayout from "@/components/presentation/presentation-page/PresentationLayout";
import Main from "@/components/presentation/presentation-page/Main";
import { notFound } from "next/navigation";
import { PlateSlide } from "@/components/presentation/utils/parser";

export default async function PresentationPage({
  params,
}: {
  params: { id:string };
}) {
  const { id } = params;
  const { success, presentation } = await getPresentation(id);

  if (!success || !presentation) {
    return notFound();
  }

  // Ensure content exists and has a slides array
  const initialSlides = (presentation.content as { slides: PlateSlide[] })?.slides || [];


  return (
    <PresentationLayout>
      <Main initialSlides={initialSlides} />
    </PresentationLayout>
  );
}
