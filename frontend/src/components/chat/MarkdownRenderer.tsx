import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Plot from "react-plotly.js";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

// Normalize common LaTeX delimiters so remark-math/rehype-katex can render them
function normalizeMathDelimiters(text: string): string {
  if (!text) return text;

  let normalized = text;

  // Convert display math \[ ... \] to $$ ... $$
  normalized = normalized.replace(/\\\[([\s\S]+?)\\\]/g, (_match, expr) => `\n$$${expr}$$\n`);

  // Convert inline math \( ... \) to $ ... $
  normalized = normalized.replace(/\\\((.+?)\\\)/g, (_match, expr) => `$${expr}$`);

  return normalized;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code: CodeComponent,
        table: TableComponent,
        thead: TheadComponent,
        tbody: TbodyComponent,
        tr: TrComponent,
        th: ThComponent,
        td: TdComponent,
        h1: H1Component,
        h2: H2Component,
        h3: H3Component,
        p: PComponent,
        ul: UlComponent,
        ol: OlComponent,
        li: LiComponent,
        blockquote: BlockquoteComponent,
        a: AComponent,
      }}
    >
      {normalizedContent}
    </ReactMarkdown>
  );
}

// Component definitions
function CodeComponent(props: any) {
  const { className, children } = props;
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");
  const isInline = !match;

  // Handle Plotly charts (JSON format)
  if (language === "plotly" || language === "plotly-json") {
    try {
      const plotData = JSON.parse(codeString);
      return (
        <div className="my-4 rounded-lg overflow-hidden border border-border bg-card">
          <Plot
            data={plotData.data || plotData}
            layout={{
              ...plotData.layout,
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "hsl(var(--foreground))" },
              autosize: true,
              margin: { t: 40, r: 20, b: 40, l: 60 },
            }}
            config={{ 
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
            }}
            style={{ width: "100%", height: "400px" }}
            useResizeHandler={true}
          />
        </div>
      );
    } catch (e) {
      console.error("Plotly parsing error:", e);
      // Show code block instead of error if parsing fails
      return <CodeBlock code={codeString} language={language} />;
    }
  }

  // Handle Mermaid diagrams
  if (language === "mermaid") {
    return <MermaidDiagram chart={codeString} />;
  }

  // Handle regular code blocks
  if (!isInline) {
    return <CodeBlock code={codeString} language={language} />;
  }

  // Inline code
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm">
      {children}
    </code>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={oneDark as any}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "1rem",
          paddingRight: "3rem",
          fontSize: "0.875rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        mermaid.render(id, chart).then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        });
      } catch (e) {
        if (ref.current) {
          ref.current.innerHTML = `<div class="p-4 bg-destructive/10 text-destructive rounded-lg">Invalid Mermaid diagram</div>`;
        }
      }
    }
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-4 p-4 bg-muted rounded-lg flex justify-center overflow-x-auto"
    />
  );
}

function TableComponent(props: any) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">{props.children}</table>
    </div>
  );
}

function TheadComponent(props: any) {
  return <thead className="bg-muted">{props.children}</thead>;
}

function TbodyComponent(props: any) {
  return <tbody className="divide-y divide-border">{props.children}</tbody>;
}

function TrComponent(props: any) {
  return <tr className="border-b border-border">{props.children}</tr>;
}

function ThComponent(props: any) {
  return (
    <th className="px-4 py-2 text-left font-semibold text-foreground">
      {props.children}
    </th>
  );
}

function TdComponent(props: any) {
  return <td className="px-4 py-2 text-foreground">{props.children}</td>;
}

function H1Component(props: any) {
  return (
    <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">
      {props.children}
    </h1>
  );
}

function H2Component(props: any) {
  return (
    <h2 className="text-xl font-bold mt-5 mb-3 text-foreground">
      {props.children}
    </h2>
  );
}

function H3Component(props: any) {
  return (
    <h3 className="text-lg font-bold mt-4 mb-2 text-foreground">
      {props.children}
    </h3>
  );
}

function PComponent(props: any) {
  return (
    <p className="my-2 text-foreground leading-relaxed">{props.children}</p>
  );
}

function UlComponent(props: any) {
  return <ul className="my-2 ml-6 list-disc space-y-1">{props.children}</ul>;
}

function OlComponent(props: any) {
  return <ol className="my-2 ml-6 list-decimal space-y-1">{props.children}</ol>;
}

function LiComponent(props: any) {
  return <li className="text-foreground">{props.children}</li>;
}

function BlockquoteComponent(props: any) {
  return (
    <blockquote className="my-4 pl-4 border-l-4 border-primary italic text-muted-foreground">
      {props.children}
    </blockquote>
  );
}

function AComponent(props: any) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {props.children}
    </a>
  );
}
