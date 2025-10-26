import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Check, Home, History as HistoryIcon, FileText, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoUrl from "@assets/hammer-logo.png";

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    credits: 500,
    priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
    description: 'Perfect for content creators getting started',
    features: [
      'Quick Transform for all formats',
      'Strategy Generator',
      'Writing Style Matching',
      'Content History',
      '500 credits per month',
      'Email support',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    credits: 1500,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    description: 'For serious creators and agencies',
    features: [
      'Everything in Starter',
      'LLMO/GEO Optimization',
      '1,500 credits per month',
      'Priority Support',
      'Advanced Analytics',
      'Early access to new features',
    ],
    recommended: true,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: subscriptionData } = useQuery<{ hasSubscription: boolean; subscription?: { plan: string; creditsRemaining: number } }>({
    queryKey: ['/api/subscription'],
    enabled: !!user,
  });

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
              onClick={() => setLocation('/')}
              data-testid="button-home-nav"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/history')}
              data-testid="button-history-nav"
            >
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/writing-samples')}
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
                onClick={() => setLocation('/billing')}
                data-testid="button-billing-nav"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
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

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3" data-testid="text-pricing-title">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-subtitle">
            Choose the plan that's right for you. All plans include access to our AI-powered content transformation tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''}`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl" data-testid={`text-plan-name-${plan.id}`}>
                  {plan.name}
                </CardTitle>
                <CardDescription data-testid={`text-plan-description-${plan.id}`}>
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold" data-testid={`text-plan-price-${plan.id}`}>
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3"
                      data-testid={`text-plan-feature-${plan.id}-${index}`}
                    >
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {!user ? (
                  <Button 
                    className="w-full" 
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => window.location.href = '/api/login'}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    Sign In to Subscribe
                  </Button>
                ) : subscriptionData?.hasSubscription && subscriptionData.subscription?.plan === plan.id ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    Current Plan
                  </Button>
                ) : plan.priceId ? (
                  <Button 
                    className="w-full" 
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => setLocation(`/subscribe?plan=${plan.id}&priceId=${plan.priceId}`)}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    {subscriptionData?.hasSubscription ? 'Switch Plan' : 'Subscribe Now'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={plan.recommended ? 'default' : 'outline'}
                    disabled
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    Coming Soon
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Credit Usage Examples</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quick Transform</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Newsletter (10min podcast)</span>
                  <span className="font-medium">~15 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blog post (30min podcast)</span>
                  <span className="font-medium">~40 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blog + LLMO (30min podcast)</span>
                  <span className="font-medium">~70 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">X Thread (15min podcast)</span>
                  <span className="font-medium">~20 credits</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Strategy Generator</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">3 formats (30min podcast)</span>
                  <span className="font-medium">~150 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">3 formats + Style Matching</span>
                  <span className="font-medium">~180 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">4 formats + LLMO</span>
                  <span className="font-medium">~250 credits</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            * Actual credits used may vary based on transcript length and complexity. 
            You'll see the exact cost before confirming any transformation.
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need a custom plan for your team?{' '}
            <a href="mailto:support@contenthammer.com" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
