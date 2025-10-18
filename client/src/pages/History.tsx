import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Sparkles, FileText, Share2, Newspaper, Calendar, ExternalLink, Home, LogOut, History as HistoryIcon } from "lucide-react";
import type { ContentJob } from "@shared/schema";
import { format } from "date-fns";
import logoUrl from "@assets/Gemini_Generated_Image_sde2j4sde2j4sde2_1760736424242.png";

export default function History() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const { data: history = [], isLoading: isLoadingHistory } = useQuery<ContentJob[]>({
    queryKey: ["/api/content/history"],
    enabled: isAuthenticated,
  });

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

  const viewContent = (jobId: string) => {
    window.location.href = `/?jobId=${jobId}`;
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
            <img src={logoUrl} alt="ContentHammer Logo" className="w-7 h-7" data-testid="icon-logo" />
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
            {history.map((job) => (
              <Card key={job.id} data-testid={`card-job-${job.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={getFormatColor(job.targetFormat)}>
                          {getFormatIcon(job.targetFormat)}
                        </div>
                        <CardTitle className="text-lg capitalize" data-testid={`text-format-${job.id}`}>
                          {job.targetFormat} Format
                        </CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2" data-testid={`text-source-${job.id}`}>
                        {job.sourceType === "youtube" && job.sourceUrl ? (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            {job.sourceUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : job.fileName ? (
                          job.fileName
                        ) : (
                          "Unknown source"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-date-${job.id}`}>
                        {format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    {job.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewContent(job.id)}
                        data-testid={`button-view-${job.id}`}
                      >
                        View Content
                      </Button>
                    )}
                    {job.status === "error" && (
                      <p className="text-sm text-destructive" data-testid={`text-error-${job.id}`}>
                        {job.error || "Processing failed"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
