import { cn } from '@/lib/utils';

/**
 * The original Atlasat orbit symbol: an ellipse with an orbiting dot.
 * Used beside the wordmark. Animated only as a gentle, interruptible spin;
 * respects reduced motion via CSS.
 */
export function OrbitSymbol({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
      aria-hidden="true"
    >
      <g className="animate-[orbit-spin_18s_linear_infinite] origin-center">
        <ellipse
          cx="12"
          cy="12"
          rx="11"
          ry="4.5"
          transform="rotate(-22 12 12)"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.7"
          fill="none"
        />
        <circle cx="22.5" cy="9.2" r="1.6" fill="currentColor" className="text-gold" />
      </g>
      <circle cx="12" cy="12" r="4" fill="currentColor" className="text-teal" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}