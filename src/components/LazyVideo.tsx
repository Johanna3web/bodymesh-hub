import { useState } from "react";
import { Play } from "lucide-react";

interface LazyVideoProps {
  src: string;
  title?: string;
  poster?: string | null;
  className?: string;
}

/**
 * Lazy-loaded video player. Shows a thumbnail with a play overlay until
 * the user clicks; only then is the iframe inserted into the DOM.
 * Maintains a 16:9 aspect ratio.
 */
export function LazyVideo({ src, title = "Workout video", poster, className = "" }: LazyVideoProps) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border ${className}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      {active ? (
        <iframe
          src={`${src}${src.includes("?") ? "&" : "?"}autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play ${title}`}
        >
          {poster ? (
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-card to-background" />
          )}
          <div className="absolute inset-0 bg-background/30 transition-smooth group-hover:bg-background/10" />
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-coral text-coral-foreground shadow-coral transition-smooth group-hover:scale-110">
            <Play className="ml-1 h-6 w-6 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
