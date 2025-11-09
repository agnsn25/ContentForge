import { Copy, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { TransformedContent, TargetFormat, NewsletterContent, BlogContent, SocialContent, XThreadContent } from '@shared/schema';
import { useState } from 'react';

interface ContentPreviewProps {
  content: TransformedContent;
  format: TargetFormat;
}

const formatLabels: Record<TargetFormat, string> = {
  newsletter: 'Newsletter',
  social: 'Social Tutorial',
  blog: 'Blog Post',
  x: 'X Thread',
};

export default function ContentPreview({ content, format }: ContentPreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = generateMarkdown(content, format);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Content has been copied in Markdown format',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateMarkdown(content, format);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const title = getContentTitle(content, format);
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download started',
      description: 'Your content is being downloaded as a Markdown file',
    });
  };

  const title = getContentTitle(content, format);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {formatLabels[format]}
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>

        <div className="flex gap-2 justify-end">
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
          {format === 'newsletter' && <NewsletterPreview content={content as NewsletterContent} />}
          {format === 'blog' && <BlogPreview content={content as BlogContent} />}
          {format === 'social' && <SocialPreview content={content as SocialContent} />}
          {format === 'x' && <XThreadPreview content={content as XThreadContent} />}
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
          } • {getMetadataCount(content, format)}
        </div>
      )}
    </div>
  );
}

function NewsletterPreview({ content }: { content: NewsletterContent }) {
  return (
    <>
      <div className="space-y-3">
        <p className="text-base text-foreground/90 leading-relaxed">{content.intro}</p>
      </div>

      {content.sections.map((section, index) => (
        <div key={index} className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground m-0">
            {section.heading}
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {section.content}
          </p>
          {section.bulletPoints && section.bulletPoints.length > 0 && (
            <ul className="space-y-1 ml-4">
              {section.bulletPoints.map((point, i) => (
                <li key={i} className="text-sm text-foreground/90">{point}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
        <h4 className="text-sm font-semibold text-foreground mb-2">📌 Quick Takeaway</h4>
        <p className="text-sm text-foreground/90">{content.quickTakeaway}</p>
      </div>

      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
        <p className="text-sm font-medium text-primary">{content.callToAction}</p>
      </div>
    </>
  );
}

function BlogPreview({ content }: { content: BlogContent }) {
  return (
    <>
      <div className="space-y-2 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground italic">{content.metaDescription}</p>
      </div>

      <div className="space-y-3">
        <p className="text-base text-foreground/90 leading-relaxed">{content.introduction}</p>
      </div>

      {content.sections.map((section, index) => (
        <div key={index} className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground m-0">
            {section.heading}
          </h3>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Conclusion</h3>
        <p className="text-sm text-foreground/90 leading-relaxed">{content.conclusion}</p>
      </div>

      {content.llmo && (
        <div className="mt-8 pt-6 border-t-2 border-primary/20 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">LLMO/GEO Optimization Report</h3>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">GEO Score</h4>
              <Badge variant={content.llmo.seoScore >= 80 ? 'default' : content.llmo.seoScore >= 60 ? 'secondary' : 'outline'} className="text-lg font-bold">
                {content.llmo.seoScore}/100
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {content.llmo.keywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">URL Slug</h4>
            <code className="text-xs bg-muted px-3 py-2 rounded block text-muted-foreground">
              /{content.llmo.urlSlug}
            </code>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">People Also Ask</h4>
            <div className="space-y-3">
              {content.llmo.peopleAlsoAsk.map((paa, i) => (
                <div key={i} className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">{paa.question}</p>
                  <p className="text-xs text-muted-foreground">{paa.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Image Alt Texts</h4>
            <ul className="space-y-2">
              {content.llmo.imageAltTexts.map((alt, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Recommendations</h4>
            <ul className="space-y-2">
              {content.llmo.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500">▸</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Schema Markup (JSON-LD)</h4>
            <div className="bg-muted p-3 rounded-lg overflow-x-auto">
              <pre className="text-xs text-muted-foreground">
                {JSON.stringify(JSON.parse(content.llmo.schemaMarkup), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SocialPreview({ content }: { content: SocialContent }) {
  return (
    <>
      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
        <h4 className="text-sm font-semibold text-foreground mb-2">🎯 Hook</h4>
        <p className="text-sm text-foreground/90">{content.hook}</p>
      </div>

      {content.slides.map((slide, index) => (
        <div key={index} className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Slide {slide.slideNumber}
            </Badge>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{slide.content}</p>
        </div>
      ))}
    </>
  );
}

function XThreadPreview({ content }: { content: XThreadContent }) {
  return (
    <>
      {content.tweets.map((tweet, index) => (
        <div key={index} className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              {tweet.tweetNumber}/{tweet.totalTweets}
            </Badge>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{tweet.content}</p>
        </div>
      ))}
    </>
  );
}

function getContentTitle(content: TransformedContent, format: TargetFormat): string {
  if (format === 'newsletter' || format === 'blog') {
    return (content as NewsletterContent | BlogContent).title;
  } else if (format === 'social') {
    return 'Social Media Tutorial';
  } else if (format === 'x') {
    return 'X Thread';
  }
  return 'Content';
}

function getMetadataCount(content: TransformedContent, format: TargetFormat): string {
  if (format === 'newsletter' || format === 'blog') {
    const wordCount = (content as NewsletterContent | BlogContent).metadata.wordCount;
    return `${wordCount} words`;
  } else if (format === 'social') {
    const totalSlides = (content as SocialContent).metadata.totalSlides;
    return `${totalSlides} slides`;
  } else if (format === 'x') {
    const totalTweets = (content as XThreadContent).metadata.totalTweets;
    return `${totalTweets} tweets`;
  }
  return '';
}

function generateMarkdown(content: TransformedContent, format: TargetFormat): string {
  let md = '';

  if (format === 'newsletter') {
    const newsletter = content as NewsletterContent;
    md += `# ${newsletter.title}\n\n`;
    md += `${newsletter.intro}\n\n`;
    
    newsletter.sections.forEach((section) => {
      md += `## ${section.heading}\n\n${section.content}\n\n`;
      if (section.bulletPoints && section.bulletPoints.length > 0) {
        section.bulletPoints.forEach(point => {
          md += `- ${point}\n`;
        });
        md += '\n';
      }
    });

    md += `## Quick Takeaway\n\n${newsletter.quickTakeaway}\n\n`;
    md += `## Call to Action\n\n${newsletter.callToAction}\n\n`;
  } else if (format === 'blog') {
    const blog = content as BlogContent;
    md += `# ${blog.title}\n\n`;
    md += `*${blog.metaDescription}*\n\n`;
    md += `## Introduction\n\n${blog.introduction}\n\n`;
    
    blog.sections.forEach((section) => {
      md += `## ${section.heading}\n\n${section.content}\n\n`;
    });

    md += `## Conclusion\n\n${blog.conclusion}\n\n`;
  } else if (format === 'social') {
    const social = content as SocialContent;
    md += `# Social Media Tutorial\n\n`;
    md += `## Hook\n\n${social.hook}\n\n`;
    
    social.slides.forEach((slide) => {
      md += `## Slide ${slide.slideNumber}\n\n${slide.content}\n\n`;
    });
  } else if (format === 'x') {
    const xThread = content as XThreadContent;
    md += `# X Thread\n\n`;
    
    xThread.tweets.forEach((tweet) => {
      md += `### ${tweet.tweetNumber}/${tweet.totalTweets}\n\n${tweet.content}\n\n`;
    });
  }

  if (content.metadata) {
    md += `---\n\n*Transformed from ${content.metadata.originalSource} on ${new Date(content.metadata.transformedAt).toLocaleDateString()}*\n`;
  }

  return md;
}
