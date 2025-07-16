import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
        <svg
          className="h-6 w-6 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 11.1c1.5-1.5 4-1.5 4 1.4 0 2.9-4 4.5-4 4.5s-4-1.6-4-4.5c0-2.9 2.5-2.9 4-1.4z" />
        </svg>
      </div>
      <span className="text-lg font-bold text-foreground font-headline">Guardian Angel AI</span>
    </div>
  );
}
