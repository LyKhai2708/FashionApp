import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slider1 from "../assets/slider1.jpg";
import slider2 from "../assets/slider2.jpg";
import slider3 from "../assets/slider3.jpg";
import slider4 from "../assets/slider4.jpg";

export default function Slider() {
  const sliderData = [
    {
      id: 1,
      image: slider1,
    },
    {
      id: 2,
      image: slider2,
    },
    {
      id: 3,
      image: slider3,
    },
    {
      id: 4,
      image: slider4,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? sliderData.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === sliderData.length - 1 ? 0 : prevIndex + 1
    );
  };

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    if (!isPaused && !isDragging) {
      intervalRef.current = window.setInterval(goToNext, 3000);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isDragging, sliderData.length]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setTranslateX(-currentIndex * 100);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = (clientX - startX) / (sliderRef.current?.clientWidth || 1) * 100;
    setTranslateX(-currentIndex * 100 + deltaX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    const threshold = (sliderRef.current?.clientWidth || 1) / 3;

    if (deltaX < -threshold) {
      goToNext();
    } else if (deltaX > threshold) {
      goToPrevious();
    } else {
      setTranslateX(-currentIndex * 100);
    }
  };

  useEffect(() => {
    setTranslateX(-currentIndex * 100);
  }, [currentIndex]);

  return (
    <div
      className="w-full relative h-[240px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[560px] group overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => isDragging && handleDragEnd({ clientX: startX } as React.MouseEvent)}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      ref={sliderRef}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${translateX}%)` }}
      >
        {sliderData.map((slide) => (
          <div
            key={slide.id}
            className="w-full h-full flex-shrink-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${slide.image})` }}
          ></div>
        ))}
      </div>
      <ChevronLeft
        size={30}
        className="hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1.5 sm:p-2 shadow backdrop-blur focus:outline-none cursor-pointer group-hover:block"
        onClick={goToPrevious}
      />
      <ChevronRight
        size={30}
        className="hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1.5 sm:p-2 shadow backdrop-blur focus:outline-none cursor-pointer group-hover:block"
        onClick={goToNext}
      />
      <div className="absolute bottom-2 space-x-1 left-1/2 -translate-x-1/2">
        {sliderData.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIndex(slideIndex)}
            className="focus:outline-none cursor-pointer"
          >
            <span
              className={`${
                slideIndex === currentIndex ? "bg-black/60" : "bg-white/40"
              } hover:bg-white/80 inline-block rounded-full h-1 w-5`}
            ></span>
          </button>
        ))}
      </div>
    </div>
  );
}