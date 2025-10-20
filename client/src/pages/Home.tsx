import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Sparkles, LogOut, History as HistoryIcon, FileText, Zap, Map, Home as HomeIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UploadZone from '@/components/UploadZone';
import FormatSelector from '@/components/FormatSelector';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import ContentPreview from '@/components/ContentPreview';
import StrategyWizard from '@/components/StrategyWizard';
import StrategyPreview from '@/components/StrategyPreview';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import type { TargetFormat, TransformedContent, JobStatus, WritingSample, StrategyJob } from '@shared/schema';
import logoUrl from "@assets/hammer-logo.png";

export default function Home() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'quick' | 'strategy'>('quick');
  const [selectedFormat, setSelectedFormat] = useState<TargetFormat | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [transformedContent, setTransformedContent] = useState<TransformedContent | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [useStyleMatching, setUseStyleMatching] = useState(false);
  const [useLLMO, setUseLLMO] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [completedStrategy, setCompletedStrategy] = useState<StrategyJob | null>(null);

  const { data: writingSamples = [] } = useQuery<WritingSample[]>({
    queryKey: ['/api/writing-samples'],
    enabled: !!user,
  });

  const { data: currentStrategy } = useQuery<StrategyJob>({
    queryKey: ['/api/strategy', strategyId],
    enabled: !!strategyId && !completedStrategy,
    refetchInterval: false,
  });

  // Handle jobId query parameter from History page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    
    if (jobId) {
      const fetchJob = async () => {
        try {
          const response = await apiRequest('GET', `/api/job/${jobId}`);
          const result = await response.json();
          
          if (result.status === 'completed' && result.transformedContent) {
            setSelectedFormat(result.targetFormat as TargetFormat);
            setTransformedContent(JSON.parse(result.transformedContent));
            setJobStatus('completed');
            // Clear the query parameter
            window.history.replaceState({}, '', '/');
          }
        } catch (err) {
          setError('Failed to load content');
        }
      };
      
      fetchJob();
    }
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (data: { file?: File; url?: string; type?: 'youtube' | 'spotify'; format: TargetFormat; useStyleMatching?: boolean; useLLMO?: boolean }) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
        formData.append('sourceType', 'file');
      } else if (data.url) {
        formData.append('url', data.url);
        formData.append('sourceType', data.type || 'youtube');
      }
      
      formData.append('targetFormat', data.format);
      if (data.useStyleMatching) {
        formData.append('useStyleMatching', 'true');
      }
      if (data.useLLMO) {
        formData.append('useLLMO', 'true');
      }
      
      formData.append('model', 'grok-4-fast-reasoning');

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
    onError: (err) => {
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
    uploadMutation.mutate({ file, format: selectedFormat, useStyleMatching, useLLMO });
  };

  const handleLinkSubmit = (url: string, type: 'youtube' | 'spotify') => {
    if (!selectedFormat) {
      setError('Please select an output format first');
      return;
    }
    
    setError(null);
    uploadMutation.mutate({ url, type, format: selectedFormat, useStyleMatching, useLLMO });
  };

  const strategyMutation = useMutation({
    mutationFn: async (data: { file?: File; url?: string; type?: 'youtube' | 'spotify' }) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
        formData.append('sourceType', 'file');
      } else if (data.url) {
        formData.append('url', data.url);
        formData.append('sourceType', data.type || 'youtube');
      }
      
      formData.append('useStyleMatching', useStyleMatching.toString());
      formData.append('useLLMO', useLLMO.toString());

      const response = await fetch('/api/strategy/start', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start strategy');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setStrategyId(data.strategyId);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFileSelectStrategy = (file: File) => {
    setError(null);
    strategyMutation.mutate({ file });
  };

  const handleLinkSubmitStrategy = (url: string, type: 'youtube' | 'spotify') => {
    setError(null);
    strategyMutation.mutate({ url, type });
  };

  const handleStrategyComplete = async () => {
    if (strategyId) {
      const response = await apiRequest('GET', `/api/strategy/${strategyId}`);
      const strategy = await response.json();
      setCompletedStrategy(strategy);
    }
  };

  const handleReset = () => {
    setSelectedFormat(null);
    setJobStatus(null);
    setTransformedContent(null);
    setProgress(0);
    setError(null);
    setUseStyleMatching(false);
    setStrategyId(null);
    setCompletedStrategy(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="ContentHammer Logo" className="h-8 w-auto" data-testid="icon-logo" />
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-name">ContentHammer</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              data-testid="button-home-nav"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Home
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/writing-samples'}
                data-testid="button-writing-samples-nav"
              >
                <FileText className="h-4 w-4 mr-2" />
                Writing Samples
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/history'}
              data-testid="button-history-nav"
            >
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </Button>
            
            <ThemeToggle />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block" data-testid="text-user-name">
                      {user.firstName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel data-testid="text-user-email">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {completedStrategy ? (
          <StrategyPreview 
            strategy={completedStrategy}
            onStartNew={handleReset}
          />
        ) : strategyId ? (
          <StrategyWizard 
            strategyId={strategyId}
            onComplete={handleStrategyComplete}
          />
        ) : !jobStatus ? (
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

            <div className="flex justify-center mb-8">
              <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'strategy')} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quick" data-testid="tab-quick">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Transform
                  </TabsTrigger>
                  <TabsTrigger value="strategy" data-testid="tab-strategy">
                    <Map className="w-4 h-4 mr-2" />
                    Strategy Generator
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Card className="p-8 max-w-4xl mx-auto">
              {mode === 'quick' ? (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Quick Transform</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose one format and get instant results
                    </p>
                  </div>

                  <FormatSelector 
                    selectedFormat={selectedFormat} 
                    onSelectFormat={setSelectedFormat}
                  />
                  
                  {selectedFormat && (
                    <>
                      {user && writingSamples.length > 0 && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                            <Checkbox 
                              id="style-matching"
                              checked={useStyleMatching}
                              onCheckedChange={(checked) => setUseStyleMatching(checked === true)}
                              data-testid="checkbox-style-matching"
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor="style-matching" 
                                className="text-sm font-medium cursor-pointer"
                              >
                                Use my writing style
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Apply your personal writing style from {writingSamples.length} sample{writingSamples.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {selectedFormat === 'blog' && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                            <Checkbox 
                              id="llmo-optimization"
                              checked={useLLMO}
                              onCheckedChange={(checked) => setUseLLMO(checked === true)}
                              data-testid="checkbox-llmo"
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor="llmo-optimization" 
                                className="text-sm font-medium cursor-pointer"
                              >
                                Optimize for LLMO/GEO (Blog Only)
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Optimize content for AI search engines (ChatGPT, Google AI Overviews, Gemini) with keyword extraction, schema markup, and SEO analysis
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="h-px bg-border" />
                      
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-semibold text-foreground">
                              Copyright Notice
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Only upload or link to content that you own or have explicit permission to transform. 
                              Transforming copyrighted content without permission may violate copyright law and could expose you to legal liability.
                            </p>
                            <div className="flex items-start gap-2 mt-3">
                              <Checkbox 
                                id="tos-acceptance"
                                checked={tosAccepted}
                                onCheckedChange={(checked) => setTosAccepted(checked === true)}
                                data-testid="checkbox-tos-acceptance"
                              />
                              <Label 
                                htmlFor="tos-acceptance" 
                                className="text-xs cursor-pointer leading-relaxed"
                              >
                                I confirm that I own the rights to this content or have permission to create derivative works. 
                                I have read and agree to the{' '}
                                <Link href="/terms">
                                  <span className="text-primary hover:underline font-medium" data-testid="link-terms">Terms of Service</span>
                                </Link>
                                .
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-px bg-border" />
                      
                      {tosAccepted ? (
                        <UploadZone 
                          onFileSelect={handleFileSelect}
                          onLinkSubmit={handleLinkSubmit}
                        />
                      ) : (
                        <div className="p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed">
                          <p className="text-sm text-muted-foreground">
                            Please accept the copyright notice and Terms of Service above to continue
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {error && !jobStatus && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Multi-Step Strategy Generator
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                      Get a complete content marketing plan with AI-guided analysis, format recommendations, 
                      title options, full content generation, and a publishing calendar
                    </p>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto">1</div>
                      <p className="text-xs text-muted-foreground">Analyze Content</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto">2</div>
                      <p className="text-xs text-muted-foreground">Pick Formats</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto">3</div>
                      <p className="text-xs text-muted-foreground">Choose Titles</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto">4</div>
                      <p className="text-xs text-muted-foreground">Generate All</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center mx-auto">5</div>
                      <p className="text-xs text-muted-foreground">Get Schedule</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {user && writingSamples.length > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <Checkbox 
                          id="style-matching-strategy"
                          checked={useStyleMatching}
                          onCheckedChange={(checked) => setUseStyleMatching(checked === true)}
                          data-testid="checkbox-style-matching-strategy"
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor="style-matching-strategy" 
                            className="text-sm font-medium cursor-pointer"
                          >
                            Use my writing style
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Apply your personal writing style from {writingSamples.length} sample{writingSamples.length > 1 ? 's' : ''} to all generated content
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Checkbox 
                        id="llmo-optimization-strategy"
                        checked={useLLMO}
                        onCheckedChange={(checked) => setUseLLMO(checked === true)}
                        data-testid="checkbox-llmo-strategy"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor="llmo-optimization-strategy" 
                          className="text-sm font-medium cursor-pointer"
                        >
                          Optimize blog posts for LLMO/GEO
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Optimize blog content for AI search engines with keyword extraction, schema markup, and SEO analysis
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          Copyright Notice
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Only upload or link to content that you own or have explicit permission to transform. 
                          Transforming copyrighted content without permission may violate copyright law and could expose you to legal liability.
                        </p>
                        <div className="flex items-start gap-2 mt-3">
                          <Checkbox 
                            id="tos-acceptance-strategy"
                            checked={tosAccepted}
                            onCheckedChange={(checked) => setTosAccepted(checked === true)}
                            data-testid="checkbox-tos-acceptance-strategy"
                          />
                          <Label 
                            htmlFor="tos-acceptance-strategy" 
                            className="text-xs cursor-pointer leading-relaxed"
                          >
                            I confirm that I own the rights to this content or have permission to create derivative works. 
                            I have read and agree to the{' '}
                            <Link href="/terms">
                              <span className="text-primary hover:underline font-medium" data-testid="link-terms-strategy">Terms of Service</span>
                            </Link>
                            .
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {tosAccepted ? (
                    <UploadZone 
                      onFileSelect={handleFileSelectStrategy}
                      onLinkSubmit={handleLinkSubmitStrategy}
                    />
                  ) : (
                    <div className="p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed">
                      <p className="text-sm text-muted-foreground">
                        Please accept the copyright notice and Terms of Service above to continue
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </div>
              )}
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
      
      <footer className="border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ContentHammer. All rights reserved.</p>
            <Link href="/terms">
              <span className="text-primary hover:underline" data-testid="link-footer-terms">Terms of Service</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
