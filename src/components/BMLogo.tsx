type Props = { className?: string };

export function BMLogo({ className = "" }: Props) {
  return (
    <span className={`heading-display text-2xl tracking-tight ${className}`}>
      <span className="italic text-coral">//</span>{" "}
      <span>BODYMESH</span>
    </span>
  );
}
