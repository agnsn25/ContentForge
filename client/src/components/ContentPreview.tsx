import { Copy, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { TransformedContent, TargetFormat } from '@shared/schema';
import { useState } from 'react';

interface ContentPreviewProps {
  content: TransformedContent;
  format: TargetFormat;
}

const formatLabels: Record<TargetFormat, string> = {
  newsletter: 'Newsletter',
  social: 'Social Tutorial',
  blog: 'Blog Post',
};

export default function ContentPreview({ content, format }: ContentPreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = generateMarkdown(content);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Content has been copied in Markdown format',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateMarkdown(content);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download started',
      description: 'Your content is being downloaded as a Markdown file',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {formatLabels[format]}
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">{content.title}</h2>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            data-testid="button-copy"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            data-testid="button-download"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      <Card className="p-8 prose prose-sm max-w-none dark:prose-invert">
        <div className="space-y-6" data-testid="content-preview">
          {content.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground m-0">
                  {section.heading}
                </h3>
                {section.timestamp && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {section.timestamp}
                  </Badge>
                )}
              </div>
              <div 
                className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
              />
            </div>
          ))}
        </div>
      </Card>

      {content.metadata && (
        <div className="text-xs text-muted-foreground text-center">
          Transformed from {content.metadata.originalSource} • {
            new Date(content.metadata.transformedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          }
        </div>
      )}
    </div>
  );
}

function generateMarkdown(content: TransformedContent): string {
  let md = `# ${content.title}\n\n`;
  
  content.sections.forEach((section) => {
    md += `## ${section.heading}`;
    if (section.timestamp) {
      md += ` [${section.timestamp}]`;
    }
    md += `\n\n${section.content}\n\n`;
  });

  if (content.metadata) {
    md += `---\n\n*Transformed from ${content.metadata.originalSource} on ${new Date(content.metadata.transformedAt).toLocaleDateString()}*\n`;
  }

  return md;
}

function formatContent(content: string): string {
  // Simple formatting to preserve line breaks and add basic styling
  return content
    .split('\n')
    .map(line => {
      // Convert bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return `<p class="ml-4">• ${line.trim().substring(2)}</p>`;
      }
      // Regular paragraphs
      return line.trim() ? `<p>${line}</p>` : '';
    })
    .join('');
}
