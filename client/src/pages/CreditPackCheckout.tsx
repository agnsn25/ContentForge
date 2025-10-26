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
  packageName: string;
  amount: number;
  credits: string;
}

const CheckoutForm = ({ packageName, amount, credits }: CheckoutFormProps) => {
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
          return_url: `${window.location.origin}/billing?credit_purchase_success=true`,
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
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Package:</span>
          <span className="font-medium" data-testid="text-package-name">{packageName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Credits:</span>
          <span className="font-medium" data-testid="text-package-credits">{credits}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="font-semibold text-lg" data-testid="text-package-price">${amount}</span>
        </div>
      </div>
      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation('/billing')}
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
            `Pay $${amount}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default function CreditPackCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get('packageId');

  useEffect(() => {
    if (!packageId) {
      toast({
        title: "Missing Package",
        description: "Please select a credit package from the billing page",
        variant: "destructive",
      });
      setLocation('/billing');
      return;
    }

    apiRequest("GET", "/api/billing/packages")
      .then((res) => res.json())
      .then((packages) => {
        const selectedPackage = packages.find((p: any) => p.id === packageId);
        if (!selectedPackage) {
          throw new Error('Package not found');
        }
        setPackageInfo(selectedPackage);
        return apiRequest("POST", "/api/stripe/create-credit-pack-checkout", { packageId });
      })
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
        setLocation('/billing');
      });
  }, [packageId, toast, setLocation]);

  if (!clientSecret || !packageInfo) {
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
            <CardTitle data-testid="text-checkout-title">Purchase Credits</CardTitle>
            <CardDescription data-testid="text-checkout-description">
              Complete your payment to add credits to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                packageName={packageInfo.name} 
                amount={parseFloat(packageInfo.priceUSD)} 
                credits={packageInfo.credits}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
