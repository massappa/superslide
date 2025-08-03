import { useRef } from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";
import { cn } from "@udecode/cn";
import { DRAG_ITEM_BLOCK, type ElementDragItemNode } from "@udecode/plate-dnd";
import { type PlateEditor, useEditorRef } from "@udecode/plate-core/react";
import { findNode, removeNodes, type TElement } from "@udecode/plate-common";
import { usePresentationState } from "@/states/presentation-state";
import { ImagePlugin } from "@udecode/plate-media/react";
import { type LayoutType } from "@/components/presentation/utils/parser";

function removeNodeById(editor: PlateEditor, id: string) {
  const nodeWithPath = findNode(editor, {
    match: { id },
  });
  if (!nodeWithPath) return;
  const [element, path] = nodeWithPath;
  removeNodes(editor, { at: path });
  return element;
}

export default function LayoutImageDrop({
  slideIndex,
}: {
  slideIndex: number;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const editor = useEditorRef();

  const handleImageDrop = (
    item: ElementDragItemNode,
    layoutType: LayoutType
  ) => {
    if (item?.element?.type !== ImagePlugin.key) return;
    
    let imageUrl = item.element.url as string;
    let imageQuery = (item.element as any).query as string || '';
    const id = item.element.id as string;
    
    // Remove the node from the editor to prevent duplication
    const element = removeNodeById(editor, id);

    if (element?.url) imageUrl = element.url as string;
    if ((element as any)?.query) imageQuery = (element as any).query as string;

    const { slides, setSlides } = usePresentationState.getState();
    const updatedSlides = slides.map((slide, index) => {
      if (index === slideIndex) {
        return {
          ...slide,
          rootImage: {
            url: imageUrl,
            query: imageQuery,
            background: false,
            alt: ""
          },
          layoutType: layoutType,
        };
      }
      return slide;
    });
    setSlides(updatedSlides);
  };

  const useLayoutDrop = (layoutType: LayoutType) => useDrop({
    accept: [DRAG_ITEM_BLOCK],
    canDrop: (item: ElementDragItemNode) => item.element.type === ImagePlugin.key,
    drop: (item: ElementDragItemNode) => {
      handleImageDrop(item, layoutType);
      return { droppedInLayoutZone: true };
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  const [{ isTopOver }, dropTop] = useLayoutDrop("vertical");
  const [{ isLeftOver }, dropLeft] = useLayoutDrop("left");
  const [{ isRightOver }, dropRight] = useLayoutDrop("right");

  dropTop(topRef);
  dropLeft(leftRef);
  dropRight(rightRef);

  return (
    <>
      {/* Top Drop Zone */}
      <div
        ref={topRef}
        className={cn(
          "absolute left-0 right-0 top-0 z-50 h-16",
          isTopOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200"
        )}
      />
      {/* Left Drop Zone */}
      <div
        ref={leftRef}
        className={cn(
          "absolute bottom-0 left-0 top-16 z-50 w-8",
          isLeftOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200"
        )}
      />
      {/* Right Drop Zone */}
      <div
        ref={rightRef}
        className={cn(
          "absolute bottom-0 right-0 top-16 z-50 w-8",
          isRightOver ? "bg-primary/20" : "bg-transparent",
          "transition-colors duration-200"
        )}
      />
    </>
  );
}