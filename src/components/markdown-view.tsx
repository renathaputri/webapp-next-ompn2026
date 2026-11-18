import ReactMarkdown from "react-markdown";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  return (
    <div
      className={`prose prose-slate max-w-none prose-headings:text-[#0B1F4B] prose-headings:font-bold prose-a:text-[#0B1F4B] prose-a:underline hover:prose-a:text-[#C9A227] ${className}`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
