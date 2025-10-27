import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  plan: string;
  amount: number;
}

const CheckoutForm = ({ plan, amount }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing?subscription_success=true`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation('/pricing')}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-cancel-checkout"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-complete-payment"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Subscribe for $${amount}/month`
          )}
        </Button>
      </div>
    </form>
  );
};

export default function SubscribeCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan') || 'starter';
  const priceId = params.get('priceId');

  const planDetails = {
    starter: { name: 'Starter', amount: 19 },
    pro: { name: 'Pro', amount: 49 },
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails.starter;

  // Check if user has an active subscription
  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: ['/api/subscription'],
  });

  useEffect(() => {
    if (!priceId) {
      toast({
        title: "Missing Price ID",
        description: "Please select a plan from the pricing page",
        variant: "destructive",
      });
      setLocation('/pricing');
      return;
    }

    // Wait for subscription data to load
    if (subscriptionData === undefined) {
      return;
    }

    // Check if user has subscription but missing Stripe subscription ID (needs sync)
    const hasSubscriptionWithoutStripeId = subscriptionData?.hasSubscription && 
                                            subscriptionData?.subscription?.status === 'active' &&
                                            !subscriptionData?.subscription?.stripeSubscriptionId;

    // Check if user has complete subscription data
    const hasStripeSubscription = subscriptionData?.hasSubscription && 
                                   subscriptionData?.subscription?.status === 'active' &&
                                   subscriptionData?.subscription?.stripeSubscriptionId;

    // AUTO-SYNC: If subscription exists but missing Stripe ID, sync first
    if (hasSubscriptionWithoutStripeId && !isSyncing) {
      setIsSyncing(true);
      console.log('[AUTO-SYNC] Detected subscription without Stripe ID, syncing...');
      
      apiRequest("POST", "/api/stripe/sync-subscription", {})
        .then((res) => {
          if (!res.ok) {
            return res.json().then(data => {
              throw { message: data.error, code: data.code, needsNewSubscription: data.needsNewSubscription };
            });
          }
          return res.json();
        })
        .then((data) => {
          console.log('[AUTO-SYNC] Sync successful, refetching subscription...');
          
          // Refetch subscription data to get the updated Stripe ID
          return refetchSubscription();
        })
        .then(() => {
          // After successful sync and refetch, the effect will re-run
          // with updated data and proceed to update flow
          setIsSyncing(false);
        })
        .catch((error: any) => {
          console.error('[AUTO-SYNC] Sync failed:', error);
          setIsSyncing(false);
          
          // If no Stripe subscription found, fall back to creating new checkout
          if (error.code === 'NO_SUBSCRIPTIONS' || error.needsNewSubscription) {
            console.log('[AUTO-SYNC] No Stripe subscription found, creating new checkout...');
            // Let the effect continue to create new checkout flow
          } else {
            // For other errors, show warning
            toast({
              title: "Sync Warning",
              description: "Could not sync existing subscription. Proceeding with new checkout.",
              variant: "default",
            });
          }
        });
      
      return; // Exit early, will re-run after refetch or continue to checkout
    }

    if (hasStripeSubscription) {
      setIsUpdatingExisting(true);
      
      apiRequest("POST", "/api/stripe/update-subscription", { plan, priceId })
        .then((res) => {
          if (!res.ok) {
            return res.json().then(data => {
              throw { message: data.error, code: data.code, needsNewSubscription: data.needsNewSubscription };
            });
          }
          return res.json();
        })
        .then((data) => {
          // Invalidate subscription cache to update UI across all pages
          queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
          
          toast({
            title: "Plan Updated!",
            description: `Your subscription has been switched to the ${currentPlan.name} plan.`,
          });
          
          // Redirect to billing page
          setTimeout(() => {
            setLocation('/billing');
          }, 1500);
        })
        .catch((error: any) => {
          setIsUpdatingExisting(false);
          
          // If subscription is invalid, fall back to creating new checkout
          if (error.code === 'INVALID_SUBSCRIPTION' || error.needsNewSubscription) {
            console.log('[PLAN-CHANGE] Invalid subscription ID, falling back to checkout...');
            // Let the effect re-run and go through the checkout flow
            return;
          }
          
          toast({
            title: "Update Error",
            description: error.message,
            variant: "destructive",
          });
          setLocation('/pricing');
        });
    } else {
      // Create new subscription using Stripe Checkout
      apiRequest("POST", "/api/stripe/create-subscription-checkout", { plan, priceId })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            // If user already has a subscription, switch to update flow
            if (data.code === 'EXISTING_SUBSCRIPTION') {
              setIsUpdatingExisting(true);
              return apiRequest("POST", "/api/stripe/update-subscription", { plan, priceId })
                .then((res) => res.json())
                .then((updateData) => {
                  if (updateData.error) {
                    throw new Error(updateData.error);
                  }
                  
                  // Invalidate subscription cache to update UI across all pages
                  queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
                  
                  toast({
                    title: "Plan Updated!",
                    description: `Your subscription has been switched to the ${currentPlan.name} plan.`,
                  });
                  
                  setTimeout(() => {
                    setLocation('/billing');
                  }, 1500);
                });
            }
            throw new Error(data.error);
          }
          
          // Redirect to Stripe Checkout
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error('No checkout URL received');
          }
        })
        .catch((error) => {
          toast({
            title: "Checkout Error",
            description: error.message,
            variant: "destructive",
          });
          setLocation('/pricing');
        });
    }
  }, [plan, priceId, toast, setLocation, subscriptionData, currentPlan.name, isSyncing, refetchSubscription]);

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground" data-testid="text-syncing-subscription">Syncing your subscription from Stripe...</p>
        </div>
      </div>
    );
  }

  if (isUpdatingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground" data-testid="text-updating-plan">Updating your plan...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground" data-testid="text-loading-checkout">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-checkout-title">Subscribe to {currentPlan.name}</CardTitle>
            <CardDescription data-testid="text-checkout-description">
              Complete your payment to start your ${currentPlan.amount}/month subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm plan={plan} amount={currentPlan.amount} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
