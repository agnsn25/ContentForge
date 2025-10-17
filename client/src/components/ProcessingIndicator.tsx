import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { JobStatus } from '@shared/schema';

interface ProcessingIndicatorProps {
  status: JobStatus;
  progress?: number;
  error?: string;
}

export default function ProcessingIndicator({ status, progress = 0, error }: ProcessingIndicatorProps) {
  return (
    <div className="space-y-4">
      {status === 'processing' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Processing your content...
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI is analyzing and transforming your content
              </p>
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
            data-testid="progress-processing"
          />
          
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Transformation complete!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your content is ready to preview and export
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Processing failed
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {error || 'An error occurred while processing your content'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
