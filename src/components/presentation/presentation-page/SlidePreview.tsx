"use client";

import React from "react";
import { usePresentationState } from "@/states/presentation-state";
import { cn } from "@/lib/utils";
import { type PlateNode } from "@/components/presentation/utils/parser";
import Image from "next/image";

interface SlidePreviewProps {
  onSlideClick: (index: number) => void;
  currentSlideIndex: number;
}

interface ElementNode {
  type: string;
  children?: PlateNode[];
  url?: string;
  [key: string]: unknown;
}

function SimpleContentRenderer({ content }: { content: PlateNode[] }) {
  const renderNode = (node: PlateNode, index: number): React.ReactNode => {
    if ('text' in node) {
      return <span key={index}>{String(node.text)}</span>;
    }

    const element = node as ElementNode;
    const children = element.children?.map((child: PlateNode, i: number) => renderNode(child, i)) ?? [];

    switch (element.type) {
      case 'h1':
        return <h1 key={index} className="text-lg font-bold mb-1">{children}</h1>;
      case 'h2':
        return <h2 key={index} className="text-base font-semibold mb-1">{children}</h2>;
      case 'h3':
        return <h3 key={index} className="text-sm font-medium mb-1">{children}</h3>;
      case 'p':
        return <p key={index} className="text-xs mb-1">{children}</p>;
      case 'img':
        const imageUrl = element.url === 'placeholder' ? '/placeholder.svg' : element.url;
        return imageUrl ? (
          <Image 
            key={index} 
            src={imageUrl} 
            alt="" 
            width={100} 
            height={60} 
            className="max-w-full h-auto" 
          />
        ) : null;
      default:
        return <div key={index} className="text-xs">{children}</div>;
    }
  };

  return (
    <div className="text-xs text-muted-foreground space-y-1 p-2">
      {content.map((node, index) => renderNode(node, index))}
    </div>
  );
}

export function SlidePreview({
  onSlideClick,
  currentSlideIndex,
}: SlidePreviewProps) {
  const { slides } = usePresentationState();

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="mb-2 text-sm font-semibold">Slides</h2>
      <div className="flex flex-col space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-md border transition-all hover:border-primary",
              currentSlideIndex === index
                ? "border-primary ring-1 ring-primary"
                : "border-muted",
            )}
            onClick={() => {
              console.log("clicked", index);
              onSlideClick(index);
            }}
          >
            <div className="absolute left-2 top-1 z-10 rounded-sm bg-muted px-1 py-0.5 text-xs font-medium text-muted-foreground">
              {index + 1}
            </div>
            <div
              id={`slide-preview-${index}`}
              className="pointer-events-none h-max min-h-9 w-full overflow-hidden bg-card"
            >
              {slide.content && slide.content.length > 0 && (
                <SimpleContentRenderer content={slide.content} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}