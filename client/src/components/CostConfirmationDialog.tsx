import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Coins, TrendingDown } from "lucide-react";

interface QuickTransformEstimate {
  credits: number;
}

interface StrategyGeneratorEstimate {
  totalCredits: number;
}

type CreditEstimate = QuickTransformEstimate | StrategyGeneratorEstimate;

interface CostConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  estimate: CreditEstimate | null;
  creditsRemaining: number;
  isPending?: boolean;
}

function isStrategyEstimate(estimate: CreditEstimate): estimate is StrategyGeneratorEstimate {
  return 'totalCredits' in estimate;
}

export default function CostConfirmationDialog({
  open,
  onClose,
  onConfirm,
  estimate,
  creditsRemaining,
  isPending = false,
}: CostConfirmationDialogProps) {
  if (!estimate) return null;

  const isStrategy = isStrategyEstimate(estimate);
  const totalCredits = isStrategy ? estimate.totalCredits : estimate.credits;
  const creditsAfter = creditsRemaining - totalCredits;
  const isInsufficient = creditsAfter < 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent data-testid="dialog-cost-confirmation">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Confirm Credit Usage
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isStrategy ? (
              <>This strategy will cost <strong>{totalCredits} credits</strong> for all 5 steps.</>
            ) : (
              <>This transformation will cost <strong>{totalCredits} credits</strong>.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-medium" data-testid="text-current-balance">
                {creditsRemaining} credits
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After {isStrategy ? 'Strategy' : 'Transformation'}</span>
              <span 
                className={`font-medium ${isInsufficient ? 'text-destructive' : ''}`}
                data-testid="text-balance-after"
              >
                {creditsAfter} credits
              </span>
            </div>
          </div>

          {isInsufficient && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Insufficient Credits
                </p>
                <p className="text-xs text-muted-foreground">
                  You need {Math.abs(creditsAfter)} more credits to complete this {isStrategy ? 'strategy' : 'transformation'}.
                  Please upgrade your plan or wait for your credits to reset.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-transform" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isInsufficient || isPending}
            data-testid="button-confirm-transform"
          >
            {isPending ? 'Processing...' : isStrategy ? 'Start Strategy Generator' : 'Confirm & Transform'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
