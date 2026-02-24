"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard-utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    const result = await copyToClipboard(code);
    
    if (result.success) {
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setError(result.error || 'Failed to copy to clipboard');
      console.error("Failed to copy:", result.error);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <code className="flex-1 px-4 py-3 text-sm font-mono text-zinc-100 overflow-x-auto whitespace-nowrap">
          {code}
        </code>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="shrink-0 h-full px-3 rounded-none border-l border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
