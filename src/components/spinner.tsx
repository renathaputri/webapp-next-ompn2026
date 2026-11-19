import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ className, size = "md", label }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {label && <span>{label}</span>}
    </span>
  );
}

/** Full-page centered loading indicator */
export function PageLoader({ message = "Memuat halaman..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#0A2558]" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}
