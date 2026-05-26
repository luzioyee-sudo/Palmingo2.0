import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded-md bg-foreground/10 text-[0.85em]">{children}</code>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h3 className="font-display font-semibold text-base mt-2">{children}</h3>,
          h2: ({ children }) => <h3 className="font-display font-semibold text-base mt-2">{children}</h3>,
          h3: ({ children }) => <h4 className="font-display font-semibold text-sm mt-2">{children}</h4>,
          del: ({ children }) => <del className="text-destructive opacity-80">{children}</del>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 italic text-foreground/80 my-2">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
