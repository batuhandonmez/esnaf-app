import { cn } from "@/lib/utils";

const tones = {
  success: {
    dot: "bg-success",
    text: "text-success",
    chip: "bg-success-soft text-success",
  },
  warning: {
    dot: "bg-warning",
    text: "text-warning",
    chip: "bg-warning-soft text-warning",
  },
  error: {
    dot: "bg-error",
    text: "text-error",
    chip: "bg-error-soft text-error",
  },
  muted: {
    dot: "bg-faint",
    text: "text-muted",
    chip: "bg-surface-sunken text-muted",
  },
} as const;

export type StatusTone = keyof typeof tones;

interface StatusDotProps {
  tone: StatusTone;
  label?: string;
  chip?: boolean;
  className?: string;
}

export function StatusDot({
  tone,
  label,
  chip = false,
  className,
}: StatusDotProps) {
  const styles = tones[tone];

  if (chip && label) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-xs font-medium",
          styles.chip,
          className,
        )}
      >
        <span className={cn("size-2 rounded-full", styles.dot)} />
        {label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", styles.dot)}
        role="status"
        aria-label={label}
      />
      {label ? (
        <span className={cn("text-[13px] font-medium", styles.text)}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
