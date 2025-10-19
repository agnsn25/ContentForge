import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Edit3 } from "lucide-react";
import type { Step1Analysis, Step2Recommendation, Step3TitleOption, Step4Content, Step5Schedule, TargetFormat } from "@shared/schema";

interface StrategyWizardProps {
  strategyId: string;
  onComplete: () => void;
}

export default function StrategyWizard({ strategyId, onComplete }: StrategyWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Analysis | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Recommendation[]>([]);
  const [step3Data, setStep3Data] = useState<Step3TitleOption[]>([]);
  const [step4Data, setStep4Data] = useState<Step4Content[]>([]);
  const [step5Data, setStep5Data] = useState<Step5Schedule[]>([]);
  
  const [isEditingStep1, setIsEditingStep1] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<TargetFormat[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<{ format: TargetFormat; title: string }[]>([]);

  const step1Mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/strategy/${strategyId}/step1`);
      return response.json();
    },
    onSuccess: (data) => {
      setStep1Data(data);
    },
  });

  const step2Mutation = useMutation({
    mutationFn: async (step1Output: Step1Analysis) => {
      const response = await apiRequest('POST', `/api/strategy/${strategyId}/step2`, {
        step1Output,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setStep2Data(data);
    },
  });

  const step3Mutation = useMutation({
    mutationFn: async ({ step1Output, formats }: { step1Output: Step1Analysis; formats: TargetFormat[] }) => {
      const response = await apiRequest('POST', `/api/strategy/${strategyId}/step3`, {
        step1Output,
        selectedFormats: formats,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setStep3Data(data);
      const defaultTitles = data.map((item: Step3TitleOption) => ({
        format: item.format,
        title: item.titles[0],
      }));
      setSelectedTitles(defaultTitles);
    },
  });

  const step4Mutation = useMutation({
    mutationFn: async (titles: { format: TargetFormat; title: string }[]) => {
      const response = await apiRequest('POST', `/api/strategy/${strategyId}/step4`, {
        selectedTitles: titles,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setStep4Data(data);
    },
  });

  const step5Mutation = useMutation({
    mutationFn: async ({ step1Output, step4Output }: { step1Output: Step1Analysis; step4Output: Step4Content[] }) => {
      const response = await apiRequest('POST', `/api/strategy/${strategyId}/step5`, {
        step1Output,
        step4Output,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setStep5Data(data);
    },
  });

  const handleStep1Execute = () => {
    step1Mutation.mutate();
  };

  const handleStep1Next = () => {
    if (step1Data) {
      setCurrentStep(2);
      step2Mutation.mutate(step1Data);
    }
  };

  const handleStep2Next = () => {
    if (selectedFormats.length > 0 && step1Data) {
      setCurrentStep(3);
      step3Mutation.mutate({ step1Output: step1Data, formats: selectedFormats });
    }
  };

  const handleStep3Next = () => {
    setCurrentStep(4);
    step4Mutation.mutate(selectedTitles);
  };

  const handleStep4Next = () => {
    if (step1Data && step4Data) {
      setCurrentStep(5);
      step5Mutation.mutate({ step1Output: step1Data, step4Output: step4Data });
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const toggleFormatSelection = (format: TargetFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const getFormatLabel = (format: TargetFormat) => {
    const labels: Record<TargetFormat, string> = {
      newsletter: 'Newsletter',
      social: 'Social Carousel',
      blog: 'Blog Post',
      x: 'X Thread',
    };
    return labels[format];
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Content Strategy Generator</h2>
          <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
        </div>
        <Progress value={progressPercentage} className="h-2" data-testid="progress-strategy" />
      </div>

      {currentStep === 1 && (
        <Card data-testid="card-step1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Step 1: Content Analysis
            </CardTitle>
            <CardDescription>
              AI will analyze your transcript to identify the topic, audience, goals, and key takeaways
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!step1Data ? (
              <Button 
                onClick={handleStep1Execute} 
                disabled={step1Mutation.isPending}
                size="lg"
                data-testid="button-execute-step1"
              >
                {step1Mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Content
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Analysis Complete
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingStep1(!isEditingStep1)}
                    data-testid="button-edit-step1"
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditingStep1 ? 'Done Editing' : 'Edit'}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Topic</label>
                    {isEditingStep1 ? (
                      <Input
                        value={step1Data.topic}
                        onChange={(e) => setStep1Data({ ...step1Data, topic: e.target.value })}
                        data-testid="input-topic"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid="text-topic">{step1Data.topic}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Target Audience</label>
                    {isEditingStep1 ? (
                      <Textarea
                        value={step1Data.targetAudience}
                        onChange={(e) => setStep1Data({ ...step1Data, targetAudience: e.target.value })}
                        rows={2}
                        data-testid="input-audience"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid="text-audience">{step1Data.targetAudience}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Primary Goals</label>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1" data-testid="list-goals">
                      {step1Data.primaryGoals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Tone</label>
                    {isEditingStep1 ? (
                      <Input
                        value={step1Data.tone}
                        onChange={(e) => setStep1Data({ ...step1Data, tone: e.target.value })}
                        data-testid="input-tone"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid="text-tone">{step1Data.tone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Key Takeaways</label>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1" data-testid="list-takeaways">
                      {step1Data.keyTakeaways.map((takeaway, i) => (
                        <li key={i}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleStep1Next} size="lg" data-testid="button-next-step1">
                    Continue to Step 2
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card data-testid="card-step2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Step 2: Format Recommendations
            </CardTitle>
            <CardDescription>
              Select which formats you want to create (you can choose one, some, or all)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step2Mutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : step2Data.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {step2Data.map((rec) => (
                    <div 
                      key={rec.format}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover-elevate ${
                        selectedFormats.includes(rec.format) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => toggleFormatSelection(rec.format)}
                      data-testid={`card-format-${rec.format}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedFormats.includes(rec.format)}
                          onCheckedChange={() => toggleFormatSelection(rec.format)}
                          data-testid={`checkbox-format-${rec.format}`}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">{getFormatLabel(rec.format)}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              rec.priority === 'high' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' :
                              rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                              {rec.priority} priority
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          <p className="text-xs text-muted-foreground italic">{rec.estimatedEngagement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step2">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleStep2Next} 
                    disabled={selectedFormats.length === 0}
                    size="lg"
                    data-testid="button-next-step2"
                  >
                    Continue to Step 3
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card data-testid="card-step3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Step 3: Title Selection
            </CardTitle>
            <CardDescription>
              Choose your favorite title for each format (or edit them)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step3Mutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : step3Data.length > 0 ? (
              <div className="space-y-6">
                {step3Data.map((titleOption) => (
                  <div key={titleOption.format} className="space-y-3" data-testid={`section-titles-${titleOption.format}`}>
                    <h4 className="font-semibold text-foreground">{getFormatLabel(titleOption.format)}</h4>
                    <div className="space-y-2">
                      {titleOption.titles.map((title, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 cursor-pointer transition-all hover-elevate ${
                            selectedTitles.find(t => t.format === titleOption.format)?.title === title
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                          onClick={() => {
                            setSelectedTitles(prev => {
                              const filtered = prev.filter(t => t.format !== titleOption.format);
                              return [...filtered, { format: titleOption.format, title }];
                            });
                          }}
                          data-testid={`option-title-${titleOption.format}-${index}`}
                        >
                          <p className="text-sm text-foreground">{title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step3">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button onClick={handleStep3Next} size="lg" data-testid="button-next-step3">
                    Generate Content
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card data-testid="card-step4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Step 4: Content Generation
            </CardTitle>
            <CardDescription>
              AI is creating all your selected content pieces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step4Mutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating {selectedFormats.length} content piece{selectedFormats.length > 1 ? 's' : ''}...</p>
              </div>
            ) : step4Data.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  All content generated successfully!
                </div>

                <div className="space-y-3">
                  {step4Data.map((content) => {
                    const contentData = content.content as any;
                    return (
                      <div key={content.format} className="border rounded-lg p-4" data-testid={`preview-${content.format}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{getFormatLabel(content.format)}</h4>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {contentData.title || contentData.hook || 'Content generated'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-back-step4">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button onClick={handleStep4Next} size="lg" data-testid="button-next-step4">
                    Create Publishing Schedule
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {currentStep === 5 && (
        <Card data-testid="card-step5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Step 5: Publishing Strategy
            </CardTitle>
            <CardDescription>
              Your complete content calendar and promotion plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step5Mutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating your publishing schedule...</p>
              </div>
            ) : step5Data.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  Strategy Complete!
                </div>

                <div className="space-y-3">
                  {step5Data.map((schedule, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2" data-testid={`schedule-${index}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{getFormatLabel(schedule.contentPiece.format)}</h4>
                        <span className="text-xs text-muted-foreground">{schedule.publishDate}</span>
                      </div>
                      <p className="text-sm text-foreground">{schedule.contentPiece.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{schedule.publishTime}</span>
                        <span>•</span>
                        <span>{schedule.platform}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-foreground mb-1">Promotion Strategy:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          {schedule.promotionStrategy.map((tactic, i) => (
                            <li key={i}>{tactic}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(4)} data-testid="button-back-step5">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button onClick={handleComplete} size="lg" data-testid="button-complete">
                    <CheckCircle2 className="w-4 h-4" />
                    View Complete Strategy
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
