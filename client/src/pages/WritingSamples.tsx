import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, FileText, Home, LogOut, History as HistoryIcon } from "lucide-react";
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
import type { WritingSample } from "@shared/schema";
import logoUrl from "@assets/Gemini_Generated_Image_sde2j4sde2j4sde2_1760736424242.png";

export default function WritingSamples() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: samples = [], isLoading } = useQuery<WritingSample[]>({
    queryKey: ['/api/writing-samples'],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest('POST', '/api/writing-samples', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/writing-samples'] });
      setTitle("");
      setContent("");
      setShowForm(false);
      toast({
        title: "Writing sample added",
        description: "Your writing sample has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save writing sample",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/writing-samples/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/writing-samples'] });
      toast({
        title: "Sample deleted",
        description: "Writing sample has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete writing sample",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 800) {
      toast({
        title: "Error",
        description: `Content is ${wordCount} words. Maximum is 800 words.`,
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ title, content });
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {!user ? (
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to manage your writing samples.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = '/'} data-testid="button-go-home">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold mb-2">Writing Samples</h1>
              <p className="text-muted-foreground">
                Add 1-2 examples of your writing (max 800 words each) to help the AI match your style.
              </p>
            </div>

            {!showForm && samples.length < 2 && (
              <Button
                onClick={() => setShowForm(true)}
                data-testid="button-add-sample"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Writing Sample
              </Button>
            )}

            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Writing Sample</CardTitle>
                  <CardDescription>
                    Paste an example of your writing. The AI will analyze your style and mimic it in future transformations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., My Blog Post Example"
                        data-testid="input-sample-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="content">Content</Label>
                        <span className={`text-sm ${wordCount > 800 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {wordCount} / 800 words
                        </span>
                      </div>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your writing sample here..."
                        className="min-h-[300px] resize-none"
                        data-testid="textarea-sample-content"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        data-testid="button-save-sample"
                      >
                        {createMutation.isPending ? "Saving..." : "Save Sample"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setTitle("");
                          setContent("");
                        }}
                        data-testid="button-cancel-sample"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Loading samples...</p>
                </CardContent>
              </Card>
            ) : samples.length === 0 ? (
              !showForm && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No writing samples yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add writing samples to enable style matching in your content transformations.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Samples ({samples.length}/2)</h2>
                {samples.map((sample) => (
                  <Card key={sample.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg" data-testid={`text-sample-title-${sample.id}`}>
                            {sample.title}
                          </CardTitle>
                          <CardDescription>
                            {sample.wordCount} words • Added {new Date(sample.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(sample.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-sample-${sample.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {sample.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
