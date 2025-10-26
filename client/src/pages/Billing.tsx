import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
import { 
  CreditCard, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Clock,
  Home,
  LogOut,
  DollarSign,
  Package,
  Zap,
  History as HistoryIcon,
  FileText,
  Coins
} from "lucide-react";
import { format } from "date-fns";
import logoUrl from "@assets/hammer-logo.png";
import type { CreditPackage, CreditTransaction, CreditPurchase } from "@shared/schema";

interface BillingDashboardData {
  subscription: {
    plan: string;
    planDetails: {
      name: string;
      price: number;
      credits: number;
    };
    creditsTotal: number;
    creditsUsed: number;
    subscriptionCreditsRemaining: number;
    oneTimeCreditsRemaining: number;
    totalCreditsRemaining: number;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    status: string;
  };
  recentTransactions: CreditTransaction[];
  creditPurchases: CreditPurchase[];
}

export default function Billing() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  const { data: billingData, isLoading: isLoadingBilling } = useQuery<BillingDashboardData>({
    queryKey: ["/api/billing/dashboard"],
    enabled: isAuthenticated,
  });

  const { data: creditPackages = [], isLoading: isLoadingPackages } = useQuery<CreditPackage[]>({
    queryKey: ["/api/billing/packages"],
  });

  const { data: subscriptionData } = useQuery<{ hasSubscription: boolean; subscription?: { plan: string; creditsRemaining: number } }>({
    queryKey: ['/api/subscription'],
    enabled: !!user,
  });

  if (isLoading || isLoadingBilling) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Sparkles className="h-8 w-8 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const hasSubscription = billingData?.subscription;
  const subscription = hasSubscription ? billingData.subscription : null;
  const recentTransactions = billingData?.recentTransactions || [];
  const creditPurchases = billingData?.creditPurchases || [];
  const usagePercentage = subscription ? (subscription.creditsUsed / subscription.creditsTotal) * 100 : 0;

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
            
            <ThemeToggle />
            
            {user && subscriptionData?.hasSubscription && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/pricing')}
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
                onClick={() => setLocation('/pricing')}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">Billing & Usage</h1>
          <p className="text-muted-foreground">
            {hasSubscription 
              ? "Manage your subscription, credits, and billing information" 
              : "Purchase credits to start transforming your content"}
          </p>
        </div>

        {!hasSubscription && (
          <Card className="mb-8" data-testid="card-no-subscription">
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>Subscribe to get monthly credits or purchase one-time credit packages below</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/pricing">
                <Button data-testid="button-view-plans">View Subscription Plans</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {hasSubscription && subscription && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card data-testid="card-total-credits">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-credits">{subscription.totalCreditsRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available across all sources
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-subscription-credits">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Credits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-subscription-credits">{subscription.subscriptionCreditsRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {subscription.creditsUsed} used of {subscription.creditsTotal}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-purchased-credits">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchased Credits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-purchased-credits">{subscription.oneTimeCreditsRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Never expire
              </p>
            </CardContent>
          </Card>
        </div>
        )}

        {hasSubscription && subscription && (
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card data-testid="card-current-plan">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg capitalize" data-testid="text-plan-name">{subscription.plan}</h3>
                  <p className="text-sm text-muted-foreground">${subscription.planDetails?.price || 0}/month</p>
                </div>
                <Badge variant="default" data-testid="badge-plan-status">{subscription.status}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Credits</span>
                  <span className="font-medium">{subscription.creditsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing Period</span>
                  <span className="font-medium">
                    {format(new Date(subscription.billingPeriodStart), "MMM d")} - {format(new Date(subscription.billingPeriodEnd), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full" data-testid="button-change-plan">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-recent-transactions">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest credit usage</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0" data-testid={`transaction-${transaction.id}`}>
                      <div className="flex-1">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        -{transaction.creditsCharged} credits
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        <Card data-testid="card-credit-packages">
          <CardHeader>
            <CardTitle>Buy More Credits</CardTitle>
            <CardDescription>
              Purchase additional credits that never expire. These credits are used before your subscription credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPackages ? (
              <div className="flex items-center justify-center py-8">
                <Sparkles className="h-6 w-6 animate-pulse text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
                {creditPackages.map((pkg) => (
                  <Card key={pkg.id} className="hover-elevate flex flex-col" data-testid={`package-${pkg.id}`}>
                    <CardHeader className="h-[100px] flex-shrink-0">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <div>
                        <div className="text-3xl font-bold">{pkg.credits}</div>
                        <div className="text-sm text-muted-foreground">credits</div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${pkg.priceUSD}</span>
                        <span className="text-sm text-muted-foreground">USD</span>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setLocation(`/buy-credits?packageId=${pkg.id}`)}
                        data-testid={`button-buy-${pkg.id}`}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {hasSubscription && creditPurchases.length > 0 && (
          <Card className="mt-6" data-testid="card-purchase-history">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Your credit purchase transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creditPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0" data-testid={`purchase-${purchase.id}`}>
                    <div className="flex-1">
                      <p className="font-medium">{purchase.credits} credits purchased</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(purchase.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${purchase.amountPaid}</p>
                      <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
