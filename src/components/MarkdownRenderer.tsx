import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, href, children, ...props }) => {
          if (!href) return <a {...props}>{children as ReactNode}</a>;

          // Check if it's an internal link
          if (
            href.startsWith("./") ||
            href.startsWith("/") ||
            !href.startsWith("http")
          ) {
            // Strip .md extension
            let newHref = href.replace(/\.md$/, "");

            // Normalize path for Next.js router
            if (newHref.startsWith("./")) {
              newHref = `/${newHref.slice(2)}`;
            } else if (!newHref.startsWith("/")) {
              newHref = `/${newHref}`;
            }

            return (
              <Link href={newHref} {...props}>
                {children as ReactNode}
              </Link>
            );
          }

          // External link
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children as ReactNode}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
