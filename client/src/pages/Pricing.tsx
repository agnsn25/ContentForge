import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    credits: 500,
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

  return (
    <div className="min-h-screen bg-background">
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
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  Coming Soon
                </Button>
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
