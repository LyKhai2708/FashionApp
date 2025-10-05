import {useEffect, useRef, useState} from "react";  
import {ChevronLeft, ChevronRight} from "lucide-react";
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
        }
        
    ]
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => prevIndex === 0 ? sliderData.length - 1 : prevIndex - 1)
    };
    const goToNext = () => {
        setCurrentIndex((prevIndex) => prevIndex === sliderData.length - 1 ? 0 : prevIndex + 1 );
    };

    useEffect(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
        }
        if (!isPaused) {
            intervalRef.current = window.setInterval(() => {
                setCurrentIndex((prevIndex) => prevIndex === sliderData.length - 1 ? 0 : prevIndex + 1);
            }, 3000);
        }
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [isPaused, sliderData.length]);
    return (
    <div className="w-full relative h-[240px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[560px] group" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="w-full h-full relative bg-center bg-cover duration-200" style={{backgroundImage: `url(${sliderData[currentIndex].image})`}}>
        </div>
        <ChevronLeft size={30} className="hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1.5 sm:p-2 shadow backdrop-blur focus:outline-none cursor-pointer group-hover:block" onClick={goToPrevious} />
        <ChevronRight size={30} className="hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-1.5 sm:p-2 shadow backdrop-blur focus:outline-none cursor-pointer group-hover:block" onClick={goToNext} />
        <div className="absolute bottom-2 space-x-1 left-1/2 -translate-x-1/2">
            {sliderData.map((slide, slideIndex) => (
                <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIndex(slideIndex)}
                    className="focus:outline-none cursor-pointer"
                >
                    <span className={`${slideIndex === currentIndex ? 'bg-white/60' : 'bg-white/40'} hover:bg-white/80 inline-block rounded-full h-3 w-3`}></span>
                </button>
            ))}
        </div>
    </div>
    );
}