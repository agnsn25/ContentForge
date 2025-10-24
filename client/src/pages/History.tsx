import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, FileText, Share2, Newspaper, Calendar, ExternalLink, Home, LogOut, Zap, CreditCard, Coins } from "lucide-react";
import type { ContentJob, StrategyJob } from "@shared/schema";
import { format } from "date-fns";
import logoUrl from "@assets/hammer-logo.png";
import StrategyPreview from "@/components/StrategyPreview";
import ContentPreview from "@/components/ContentPreview";

type HistoryItem = (ContentJob & { itemType: 'quick' }) | (StrategyJob & { itemType: 'strategy' });

export default function History() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [viewingStrategy, setViewingStrategy] = useState<StrategyJob | null>(null);
  const [viewingContent, setViewingContent] = useState<ContentJob | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: contentHistory = [], isLoading: isLoadingContent } = useQuery<ContentJob[]>({
    queryKey: ["/api/content/history"],
    enabled: isAuthenticated,
  });

  const { data: strategyHistory = [], isLoading: isLoadingStrategies } = useQuery<StrategyJob[]>({
    queryKey: ["/api/strategy/history"],
    enabled: isAuthenticated,
  });

  const { data: subscriptionData } = useQuery<{ hasSubscription: boolean; subscription?: { plan: string; creditsRemaining: number } }>({
    queryKey: ['/api/subscription'],
    enabled: !!user,
  });

  // Combine and sort by date
  const history: HistoryItem[] = [
    ...contentHistory.map(job => ({ ...job, itemType: 'quick' as const })),
    ...strategyHistory.map(job => ({ ...job, itemType: 'strategy' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoadingHistory = isLoadingContent || isLoadingStrategies;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "newsletter":
        return <Newspaper className="h-4 w-4" />;
      case "social":
        return <Share2 className="h-4 w-4" />;
      case "blog":
        return <FileText className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case "newsletter":
        return "text-primary";
      case "social":
        return "text-secondary";
      case "blog":
        return "text-accent";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" data-testid={`badge-status-completed`}>Completed</Badge>;
      case "processing":
        return <Badge variant="secondary" data-testid={`badge-status-processing`}>Processing</Badge>;
      case "error":
        return <Badge variant="destructive" data-testid={`badge-status-error`}>Error</Badge>;
      default:
        return null;
    }
  };


  if (isLoading || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your content history...</p>
        </div>
      </div>
    );
  }

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
              <Home className="h-4 w-4 mr-2" />
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

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/billing'}
                data-testid="button-billing-nav"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Button>
            )}
            
            <ThemeToggle />
            
            {user && subscriptionData?.hasSubscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/pricing'}
                className="gap-2"
                data-testid="button-credits-badge"
              >
                <Coins className="h-4 w-4" />
                <span className="font-medium" data-testid="text-credits-remaining">
                  {subscriptionData.subscription?.creditsRemaining || 0}
                </span>
                <Badge variant="secondary" className="text-xs" data-testid="text-subscription-tier">
                  {subscriptionData.subscription?.plan || 'Unknown'}
                </Badge>
              </Button>
            )}
            
            {user && !subscriptionData?.hasSubscription && (
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.href = '/pricing'}
                data-testid="button-upgrade-pricing"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
            
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold" data-testid="heading-history">Content History</h1>
          <p className="text-muted-foreground" data-testid="text-history-subtitle">
            View and manage all your transformed content
          </p>
        </div>

        {history.length === 0 ? (
          <Card className="p-12 text-center" data-testid="card-empty-state">
            <div className="space-y-4">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-lg font-semibold">No transformations yet</h3>
              <p className="text-muted-foreground">
                Start transforming your content to see your history here
              </p>
              <Button onClick={() => window.location.href = "/"} data-testid="button-start-transforming">
                Start Transforming
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Card key={item.id} data-testid={`card-job-${item.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.itemType === 'quick' ? (
                          <>
                            <div className={getFormatColor(item.targetFormat)}>
                              {getFormatIcon(item.targetFormat)}
                            </div>
                            <CardTitle className="text-lg capitalize" data-testid={`text-format-${item.id}`}>
                              {item.targetFormat} Format
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-type-${item.id}`}>
                              Quick Transform
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 text-primary" />
                            <CardTitle className="text-lg" data-testid={`text-format-${item.id}`}>
                              Complete Content Strategy
                            </CardTitle>
                            <Badge variant="default" className="text-xs" data-testid={`badge-type-${item.id}`}>
                              Multi-Step Generator
                            </Badge>
                          </>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2" data-testid={`text-source-${item.id}`}>
                        {item.sourceType === "youtube" && item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            {item.sourceUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : item.fileName ? (
                          item.fileName
                        ) : (
                          "Unknown source"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-date-${item.id}`}>
                        {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    {item.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (item.itemType === 'quick') {
                            setViewingContent(item);
                          } else {
                            setViewingStrategy(item);
                          }
                        }}
                        data-testid={`button-view-${item.id}`}
                      >
                        {item.itemType === 'quick' ? 'View Content' : 'View Strategy'}
                      </Button>
                    )}
                    {item.status === "error" && (
                      <p className="text-sm text-destructive" data-testid={`text-error-${item.id}`}>
                        {item.error || "Processing failed"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {viewingStrategy && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="relative w-full max-w-5xl my-8">
            <div className="bg-card border border-border rounded-lg shadow-lg">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
                <h2 className="text-2xl font-bold" data-testid="heading-strategy-view">
                  Complete Content Strategy
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingStrategy(null)}
                  data-testid="button-close-strategy"
                >
                  Close
                </Button>
              </div>
              <div className="p-6">
                <StrategyPreview
                  strategy={viewingStrategy}
                  onStartNew={() => {
                    setViewingStrategy(null);
                    window.location.href = '/';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingContent && viewingContent.transformedContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="relative w-full max-w-5xl my-8">
            <div className="bg-card border border-border rounded-lg shadow-lg">
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
                <h2 className="text-2xl font-bold capitalize" data-testid="heading-content-view">
                  {viewingContent.targetFormat} Content
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingContent(null)}
                  data-testid="button-close-content"
                >
                  Close
                </Button>
              </div>
              <div className="p-6">
                <ContentPreview
                  content={JSON.parse(viewingContent.transformedContent)}
                  format={viewingContent.targetFormat as any}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
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
