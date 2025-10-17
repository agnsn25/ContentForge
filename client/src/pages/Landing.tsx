import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Clock, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" data-testid="icon-logo" />
            <span className="text-xl font-semibold" data-testid="text-app-name">ContentForge</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login-header"
            >
              Log In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight" data-testid="heading-hero">
            Transform Your Content with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Turn podcasts, videos, and long-form content into engaging newsletters, 
            social media posts, and blog articles in seconds.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" data-testid="heading-features">
          Why Choose ContentForge?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 space-y-4" data-testid="card-feature-ai">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI analyzes and transforms your content while preserving key insights and timestamps.
            </p>
          </Card>

          <Card className="p-6 space-y-4" data-testid="card-feature-fast">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-lg">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Get your transformed content in seconds. No waiting, no hassle.
            </p>
          </Card>

          <Card className="p-6 space-y-4" data-testid="card-feature-history">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Save History</h3>
            <p className="text-sm text-muted-foreground">
              Access all your transformed content anytime. Your work is always saved.
            </p>
          </Card>

          <Card className="p-6 space-y-4" data-testid="card-feature-secure">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Your content is encrypted and secure. We never share your data.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center space-y-6 max-w-3xl mx-auto bg-primary/5">
          <h2 className="text-3xl font-bold" data-testid="heading-cta">
            Ready to Transform Your Content?
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="text-cta">
            Join thousands of creators who use ContentForge to repurpose their content effortlessly.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta-signup"
          >
            Sign Up Now
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              © 2025 ContentForge. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Powered by Grok AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
