import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Calendar, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StrategyJob, TargetFormat, Step1Analysis, Step2Recommendation, Step3TitleOption, Step4Content, Step5Schedule } from "@shared/schema";
import ContentPreview from "./ContentPreview";

interface StrategyPreviewProps {
  strategy: StrategyJob;
  onStartNew: () => void;
}

export default function StrategyPreview({ strategy, onStartNew }: StrategyPreviewProps) {
  const { toast } = useToast();

  const step1Data: Step1Analysis | null = strategy.step1Output ? JSON.parse(strategy.step1Output) : null;
  const step4Data: Step4Content[] = strategy.step4Output ? JSON.parse(strategy.step4Output) : [];
  const step5Data: Step5Schedule[] = strategy.step5Output ? JSON.parse(strategy.step5Output) : [];

  const getFormatLabel = (format: TargetFormat) => {
    const labels: Record<TargetFormat, string> = {
      newsletter: 'Newsletter',
      social: 'Social Carousel',
      blog: 'Blog Post',
      x: 'X Thread',
    };
    return labels[format];
  };

  const handleCopyAll = () => {
    let allContent = `# Content Strategy\n\n`;
    
    if (step1Data) {
      allContent += `## Analysis\n\n`;
      allContent += `**Topic:** ${step1Data.topic}\n\n`;
      allContent += `**Target Audience:** ${step1Data.targetAudience}\n\n`;
      allContent += `**Tone:** ${step1Data.tone}\n\n\n`;
    }

    step4Data.forEach((content) => {
      const contentData = content.content as any;
      allContent += `## ${getFormatLabel(content.format)}\n\n`;
      allContent += `**Title:** ${contentData.title || contentData.hook || 'Untitled'}\n\n`;
      allContent += JSON.stringify(contentData, null, 2);
      allContent += '\n\n---\n\n';
    });

    if (step5Data.length > 0) {
      allContent += `## Publishing Schedule\n\n`;
      step5Data.forEach((schedule) => {
        allContent += `### ${getFormatLabel(schedule.contentPiece.format)}\n`;
        allContent += `- **Date:** ${schedule.publishDate}\n`;
        allContent += `- **Time:** ${schedule.publishTime}\n`;
        allContent += `- **Platform:** ${schedule.platform}\n`;
        allContent += `- **Promotion:**\n`;
        schedule.promotionStrategy.forEach(tactic => {
          allContent += `  - ${tactic}\n`;
        });
        allContent += '\n';
      });
    }

    navigator.clipboard.writeText(allContent);
    toast({
      title: "Copied!",
      description: "Complete strategy copied to clipboard",
    });
  };

  const handleDownload = () => {
    let allContent = `# Content Strategy\n\nGenerated on ${new Date(strategy.createdAt).toLocaleDateString()}\n\n`;
    
    if (step1Data) {
      allContent += `## Analysis\n\n`;
      allContent += `**Topic:** ${step1Data.topic}\n\n`;
      allContent += `**Target Audience:** ${step1Data.targetAudience}\n\n`;
      allContent += `**Tone:** ${step1Data.tone}\n\n\n`;
    }

    step4Data.forEach((content) => {
      const contentData = content.content as any;
      allContent += `## ${getFormatLabel(content.format)}\n\n`;
      allContent += `**Title:** ${contentData.title || contentData.hook || 'Untitled'}\n\n`;
      allContent += JSON.stringify(contentData, null, 2);
      allContent += '\n\n---\n\n';
    });

    if (step5Data.length > 0) {
      allContent += `## Publishing Schedule\n\n`;
      step5Data.forEach((schedule) => {
        allContent += `### ${getFormatLabel(schedule.contentPiece.format)}\n`;
        allContent += `- **Date:** ${schedule.publishDate}\n`;
        allContent += `- **Time:** ${schedule.publishTime}\n`;
        allContent += `- **Platform:** ${schedule.platform}\n`;
        allContent += `- **Promotion:**\n`;
        schedule.promotionStrategy.forEach(tactic => {
          allContent += `  - ${tactic}\n`;
        });
        allContent += '\n';
      });
    }

    const blob = new Blob([allContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-strategy-${strategy.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Strategy saved as Markdown file",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Your Complete Content Strategy
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(strategy.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyAll} data-testid="button-copy-all">
            <Copy className="w-4 h-4" />
            Copy All
          </Button>
          <Button variant="outline" onClick={handleDownload} data-testid="button-download-all">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button onClick={onStartNew} data-testid="button-start-new">
            Create New Strategy
          </Button>
        </div>
      </div>

      {step1Data && (
        <Card data-testid="card-analysis-summary">
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Topic</h4>
              <p className="text-sm text-muted-foreground">{step1Data.topic}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Tone</h4>
              <p className="text-sm text-muted-foreground">{step1Data.tone}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-foreground mb-1">Target Audience</h4>
              <p className="text-sm text-muted-foreground">{step1Data.targetAudience}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" data-testid="tab-content">
            Generated Content
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Publishing Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {step4Data.map((content) => (
            <div key={content.format} data-testid={`content-${content.format}`}>
              <ContentPreview 
                content={content.content} 
                format={content.format}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {step5Data.length > 0 ? (
            <div className="grid gap-4">
              {step5Data.map((schedule, index) => (
                <Card key={index} data-testid={`schedule-card-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{getFormatLabel(schedule.contentPiece.format)}</CardTitle>
                      <span className="text-sm text-muted-foreground">{schedule.publishDate}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{schedule.contentPiece.title}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-xs font-medium text-foreground mb-1">Time</h4>
                        <p className="text-sm text-muted-foreground">{schedule.publishTime}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-foreground mb-1">Platform</h4>
                        <p className="text-sm text-muted-foreground">{schedule.platform}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-2">Promotion Strategy</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {schedule.promotionStrategy.map((tactic, i) => (
                          <li key={i}>{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No publishing schedule available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
