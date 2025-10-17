import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import FormatSelector from '@/components/FormatSelector';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import ContentPreview from '@/components/ContentPreview';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import type { TargetFormat, TransformedContent, JobStatus } from '@shared/schema';

export default function Home() {
  const [selectedFormat, setSelectedFormat] = useState<TargetFormat | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [transformedContent, setTransformedContent] = useState<TransformedContent | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (data: { file?: File; url?: string; type?: 'youtube' | 'spotify'; format: TargetFormat }) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
        formData.append('sourceType', 'file');
      } else if (data.url) {
        formData.append('url', data.url);
        formData.append('sourceType', data.type || 'youtube');
      }
      
      formData.append('targetFormat', data.format);

      const response = await fetch('/api/transform', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setJobStatus('processing');
      setProgress(30);
      pollJobStatus(data.jobId);
    },
    onError: (err: Error) => {
      setJobStatus('error');
      setError(err.message);
    },
  });

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest('GET', `/api/job/${jobId}`);
        const result = await response.json();
        
        setProgress((prev) => Math.min(prev + 10, 90));
        
        if (result.status === 'completed') {
          clearInterval(interval);
          setProgress(100);
          setJobStatus('completed');
          setTransformedContent(JSON.parse(result.transformedContent));
        } else if (result.status === 'error') {
          clearInterval(interval);
          setJobStatus('error');
          setError(result.error || 'Processing failed');
        }
      } catch (err) {
        clearInterval(interval);
        setJobStatus('error');
        setError('Failed to check job status');
      }
    }, 2000);
  };

  const handleFileSelect = (file: File) => {
    if (!selectedFormat) {
      setError('Please select an output format first');
      return;
    }
    
    setError(null);
    uploadMutation.mutate({ file, format: selectedFormat });
  };

  const handleLinkSubmit = (url: string, type: 'youtube' | 'spotify') => {
    if (!selectedFormat) {
      setError('Please select an output format first');
      return;
    }
    
    setError(null);
    uploadMutation.mutate({ url, type, format: selectedFormat });
  };

  const handleReset = () => {
    setSelectedFormat(null);
    setJobStatus(null);
    setTransformedContent(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">ContentForge</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!jobStatus ? (
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-foreground">
                Transform Your Content with AI
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload podcasts, videos, or paste links to transform long-form content into newsletters, 
                social tutorials, or blog posts with timestamps and proper formatting.
              </p>
            </div>

            <Card className="p-8 max-w-4xl mx-auto">
              <div className="space-y-8">
                <FormatSelector 
                  selectedFormat={selectedFormat} 
                  onSelectFormat={setSelectedFormat}
                />
                
                {selectedFormat && (
                  <>
                    <div className="h-px bg-border" />
                    <UploadZone 
                      onFileSelect={handleFileSelect}
                      onLinkSubmit={handleLinkSubmit}
                    />
                  </>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {jobStatus !== 'completed' && (
              <Card className="p-6">
                <ProcessingIndicator 
                  status={jobStatus}
                  progress={progress}
                  error={error || undefined}
                />
              </Card>
            )}

            {jobStatus === 'completed' && transformedContent && selectedFormat && (
              <>
                <ContentPreview 
                  content={transformedContent}
                  format={selectedFormat}
                />
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    data-testid="button-transform-another"
                  >
                    Transform Another
                  </Button>
                </div>
              </>
            )}

            {jobStatus === 'error' && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  data-testid="button-try-again"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
