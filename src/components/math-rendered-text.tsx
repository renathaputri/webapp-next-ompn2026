import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRenderedTextProps {
  html: string;
  className?: string;
}

/**
 * Merender konten HTML dan mengonversi format rumus LaTeX $...$ menjadi elemen KaTeX yang aman
 */
export function MathRenderedText({ html, className = "" }: MathRenderedTextProps) {
  if (!html) return null;

  // Ganti pola $rumus$ menjadi rendered KaTeX HTML
  const processedHtml = html.replace(/\$([^$]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return match;
    }
  });

  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
