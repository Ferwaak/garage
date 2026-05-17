import { cn } from "@/lib/utils";

export function AutoManagerLogo({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      aria-hidden="true"
      className={cn("block shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="automanager-metal"
          x1="24"
          y1="26"
          x2="105"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f4f5f3" />
          <stop offset="0.45" stopColor="#7c807c" />
          <stop offset="1" stopColor="#d9dcd8" />
        </linearGradient>
        <linearGradient
          id="automanager-car"
          x1="35"
          y1="68"
          x2="93"
          y2="103"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#202321" />
          <stop offset="0.55" stopColor="#070908" />
          <stop offset="1" stopColor="#1f2220" />
        </linearGradient>
        <filter
          id="automanager-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="128" height="128" rx="22" fill="#080b0a" />
      <rect
        x="1"
        y="1"
        width="126"
        height="126"
        rx="21"
        stroke="#1f2825"
        strokeWidth="2"
      />
      <path
        d="M23 96V52L64 27L105 52V96"
        stroke="url(#automanager-metal)"
        strokeWidth="6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M32 96V59H96V96"
        stroke="#0b564a"
        strokeWidth="3"
        strokeLinecap="square"
      />
      <path d="M36 66H92" stroke="#0b564a" strokeWidth="1.5" opacity="0.75" />
      <path d="M36 75H92" stroke="#0b564a" strokeWidth="1.2" opacity="0.55" />

      <path
        d="M31 99L37 75L48 65H80L91 75L97 99H31Z"
        fill="url(#automanager-car)"
        stroke="#8b918d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M49 66H79L87 78H41L49 66Z"
        fill="#030504"
        stroke="#8b918d"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M37 84L49 88L59 85"
        stroke="#6fffee"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        filter="url(#automanager-glow)"
      />
      <path
        d="M91 84L79 88L69 85"
        stroke="#6fffee"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        filter="url(#automanager-glow)"
      />
      <path
        d="M43 96H85"
        stroke="#b7bbb7"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M35 99H93"
        stroke="#151918"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
