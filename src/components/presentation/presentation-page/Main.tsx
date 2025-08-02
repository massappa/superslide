"use client"
import React from 'react';
import { usePresentationState } from '@/states/presentation-state';
import SlideContainer from './SlideContainer';
import { PlateSlide } from '@/components/presentation/utils/parser';

interface MainProps {
  initialSlides: PlateSlide[];
}

const Main: React.FC<MainProps> = ({ initialSlides }) => {
  const { setSlides, items } = usePresentationState();

  React.useEffect(() => {
    if (initialSlides) {
      setSlides(initialSlides);
    }
  }, [initialSlides, setSlides]);

  return (
    <main>
      {items.map((slide, index) => (
        <SlideContainer key={slide.id} slide={slide} index={index} />
      ))}
    </main>
  );
};

export default Main;
