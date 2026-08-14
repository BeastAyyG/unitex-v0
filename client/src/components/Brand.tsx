import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
    className?: string;
    size?: number;
};

export function BrandMark({ className, size = 36 }: BrandMarkProps) {
    return (
        <svg
            aria-hidden="true"
            className={cn('brand-mark', className)}
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="40" height="40" fill="var(--color-text)" />
            <path d="M7 7H15V15H23V7H33V17L25 25H17L7 15V7Z" fill="var(--color-accent-yellow)" />
            <path d="M7 23L15 15H23L33 25V33H25V25H17V33H7V23Z" fill="var(--color-accent-purple)" />
            <path d="M15 15H25V25H15V15Z" fill="var(--color-accent-orange)" />
            <path d="M18 18H22V22H18V18Z" fill="white" />
        </svg>
    );
}

type BrandLockupProps = BrandMarkProps & {
    compact?: boolean;
};

export function BrandLockup({ className, compact = false, size }: BrandLockupProps) {
    const [jumpFrame, setJumpFrame] = useState(0);

    useEffect(() => {
        const frameDelays = [700, 150, 150, 180];
        let frame = 0;
        let timeoutId: number;

        const advance = () => {
            frame = (frame + 1) % frameDelays.length;
            setJumpFrame(frame);
            timeoutId = window.setTimeout(advance, frameDelays[frame]);
        };

        timeoutId = window.setTimeout(advance, frameDelays[0]);
        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <span className={cn('brand-lockup', className)}>
            <BrandMark size={size ?? (compact ? 30 : 36)} />
            <span className={cn('brand-wordmark', `brand-wordmark--jump-${jumpFrame}`)}>Unit<span>X</span></span>
        </span>
    );
}
