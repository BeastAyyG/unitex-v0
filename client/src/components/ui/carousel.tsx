import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const CarouselContext = React.createContext<{
    api: {
        scrollNext: () => void
        scrollPrev: () => void
        scrollTo: (index: number) => void
        canScrollNext: boolean
        canScrollPrev: boolean
    } | null
    carouselRef: React.RefObject<HTMLDivElement>
    currentIndex: number
} | null>(null)

function useCarousel() {
    const context = React.useContext(CarouselContext)
    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }
    return context
}

const CarouselRoot = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { autoScroll?: boolean; interval?: number }
>(({ className, children, autoScroll = false, interval = 5000, ...props }, ref) => {
    const carouselRef = React.useRef<HTMLDivElement>(null)
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(true)
    const [currentIndex, setCurrentIndex] = React.useState(0)

    const scrollPrev = React.useCallback(() => {
        if (carouselRef.current) {
            const { scrollLeft, clientWidth } = carouselRef.current
            const targetScroll = Math.max(0, scrollLeft - clientWidth)
            carouselRef.current.scrollTo({ left: targetScroll, behavior: "smooth" })
        }
    }, [])

    const scrollNext = React.useCallback(() => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
            // If at end, loop back (for autoScroll)
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                carouselRef.current.scrollTo({ left: 0, behavior: "smooth" })
            } else {
                carouselRef.current.scrollTo({ left: scrollLeft + clientWidth, behavior: "smooth" })
            }
        }
    }, [])

    const scrollTo = React.useCallback((index: number) => {
        if (carouselRef.current) {
            const { clientWidth } = carouselRef.current
            carouselRef.current.scrollTo({ left: index * clientWidth, behavior: "smooth" })
        }
    }, [])

    const handleScroll = React.useCallback(() => {
        if (!carouselRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
        setCanScrollPrev(scrollLeft > 0)
        setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1)

        // Calculate current index
        const index = Math.round(scrollLeft / clientWidth)
        setCurrentIndex(index)
    }, [])

    React.useEffect(() => {
        if (carouselRef.current) {
            handleScroll()
            carouselRef.current.addEventListener('scroll', handleScroll)
            return () => carouselRef.current?.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    // Auto Scroll Logic
    React.useEffect(() => {
        if (!autoScroll) return
        const timer = setInterval(() => {
            scrollNext()
        }, interval)
        return () => clearInterval(timer)
    }, [autoScroll, interval, scrollNext])


    return (
        <CarouselContext.Provider
            value={{
                carouselRef,
                currentIndex,
                api: {
                    scrollPrev,
                    scrollNext,
                    scrollTo,
                    canScrollPrev,
                    canScrollNext,
                },
            }}
        >
            <div
                ref={ref}
                className={cn("relative group", className)}
                role="region"
                aria-roledescription="carousel"
                {...props}
            >
                {children}
            </div>
        </CarouselContext.Provider>
    )
})
CarouselRoot.displayName = "Carousel"

const CarouselContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { carouselRef } = useCarousel()

    return (
        <div ref={carouselRef} className="overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div
                ref={ref}
                className={cn("flex", className)}
                {...props}
            />
        </div>
    )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            role="group"
            aria-roledescription="slide"
            className={cn(
                "min-w-0 shrink-0 grow-0 basis-full snap-center pl-4",
                className
            )}
            {...props}
        />
    )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    const { api } = useCarousel()

    return (
        <button
            ref={ref}
            className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-white/80 border border-[var(--color-surface)] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 z-10",
                className
            )}
            disabled={!api?.canScrollPrev}
            onClick={api?.scrollPrev}
            {...props}
        >
            <ChevronLeft className="h-4 w-4 text-[var(--color-text)]" />
            <span className="sr-only">Previous slide</span>
        </button>
    )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    const { api } = useCarousel()

    return (
        <button
            ref={ref}
            className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-white/80 border border-[var(--color-surface)] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 z-10",
                className
            )}
            onClick={api?.scrollNext}
            {...props}
        >
            <ChevronRight className="h-4 w-4 text-[var(--color-text)]" />
            <span className="sr-only">Next slide</span>
        </button>
    )
})
CarouselNext.displayName = "CarouselNext"

const CarouselDots = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { count: number }
>(({ className, count, ...props }, ref) => {
    const { currentIndex, api } = useCarousel()

    return (
        <div
            ref={ref}
            className={cn("flex items-center gap-2", className)}
            {...props}
        >
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                        "h-1.5 transition-all duration-300 rounded-lg", // Rectangles
                        currentIndex === i ? "w-8 bg-[var(--color-accent)]" : "w-4 bg-[var(--color-text)]/20 hover:bg-[var(--color-text)]/40"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                />
            ))}
        </div>
    )
})
CarouselDots.displayName = "CarouselDots"

export const Carousel = {
    Root: CarouselRoot,
    Content: CarouselContent,
    Item: CarouselItem,
    PrevTrigger: CarouselPrevious,
    NextTrigger: CarouselNext,
    Dots: CarouselDots
}
