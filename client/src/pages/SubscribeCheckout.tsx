import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

    apiRequest("POST", "/api/stripe/create-subscription-checkout", { plan, priceId })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Checkout Error",
          description: error.message,
          variant: "destructive",
        });
        setLocation('/pricing');
      });
  }, [plan, priceId, toast, setLocation]);

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
