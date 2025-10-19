import OpenAI from "openai";
import type { Step1Analysis, Step2Recommendation, Step3TitleOption, Step4Content, Step5Schedule, TargetFormat, TransformedContent } from "@shared/schema";
import { transformContent } from "./grok";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

export async function executeStep1(transcript: string, sourceInfo: string): Promise<Step1Analysis> {
  const systemPrompt = `You are a content strategy expert. Analyze this transcript and identify:
1. The main topic/subject matter
2. The target audience (who would benefit most from this content)
3. Primary goals this content achieves (educate, entertain, inspire, etc.)
4. The tone and style (casual, professional, technical, etc.)
5. Key takeaways that make this content valuable

Return ONLY a valid JSON object with this structure:
{
  "topic": "Clear, specific topic description",
  "targetAudience": "Detailed audience description (demographics, interests, pain points)",
  "primaryGoals": ["goal1", "goal2", "goal3"],
  "tone": "Tone and style description",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3", "takeaway4", "takeaway5"]
}`;

  const completion = await openai.chat.completions.create({
    model: "grok-2-1212",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Source: ${sourceInfo}\n\nTranscript:\n${transcript}` }
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function executeStep2(
  transcript: string, 
  step1Output: Step1Analysis
): Promise<Step2Recommendation[]> {
  const systemPrompt = `You are a content strategy expert. Based on the content analysis, recommend which content formats would work best for repurposing this content.

Available formats:
- newsletter: Email-friendly format, 400-600 words, scannable sections
- social: Instagram/LinkedIn carousel, 8-10 slides, visual storytelling
- blog: Long-form article, 800-1200 words, SEO-optimized
- x: Twitter/X thread, 8-12 tweets, bite-sized insights

For EACH format, provide:
1. Why this format is suitable (specific reasons based on the content)
2. Priority level (high/medium/low)
3. Estimated engagement potential

Return ONLY a valid JSON array with this structure:
[
  {
    "format": "newsletter",
    "reason": "Detailed explanation of why this format fits the content and audience",
    "priority": "high",
    "estimatedEngagement": "Engagement prediction with reasoning"
  },
  ...all 4 formats
]`;

  const completion = await openai.chat.completions.create({
    model: "grok-2-1212",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analysis:\n${JSON.stringify(step1Output, null, 2)}\n\nTranscript (first 2000 chars):\n${transcript.substring(0, 2000)}` }
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function executeStep3(
  transcript: string,
  step1Output: Step1Analysis,
  selectedFormats: TargetFormat[]
): Promise<Step3TitleOption[]> {
  const systemPrompt = `You are a content strategy expert. Generate 5 compelling title options for each selected format.

Title guidelines:
- Newsletter: Subject lines that boost open rates (curiosity, value, urgency)
- Social: Hooks that stop scrolling (question, bold claim, relatable pain point)
- Blog: SEO-friendly titles with keywords (how-to, listicle, ultimate guide)
- X Thread: Attention-grabbing openers (surprising stat, controversial take, story hook)

Return ONLY a valid JSON array with this structure:
[
  {
    "format": "newsletter",
    "titles": ["title1", "title2", "title3", "title4", "title5"]
  },
  ...for each selected format
]`;

  const completion = await openai.chat.completions.create({
    model: "grok-2-1212",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analysis:\n${JSON.stringify(step1Output, null, 2)}\n\nSelected formats: ${selectedFormats.join(', ')}\n\nTranscript (first 2000 chars):\n${transcript.substring(0, 2000)}` }
    ],
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }
  
  return JSON.parse(jsonMatch[0]);
}

export async function executeStep4(
  transcript: string,
  sourceInfo: string,
  selectedFormats: TargetFormat[],
  selectedTitles: { format: TargetFormat; title: string }[]
): Promise<Step4Content[]> {
  const results: Step4Content[] = [];
  
  for (const format of selectedFormats) {
    const selectedTitle = selectedTitles.find(t => t.format === format);
    
    const transformedContent = await transformContent(
      transcript,
      format,
      sourceInfo
    );
    
    const content = JSON.parse(transformedContent);
    
    if (selectedTitle) {
      content.title = selectedTitle.title;
    }
    
    results.push({
      format,
      content: content as TransformedContent
    });
  }
  
  return results;
}

export async function executeStep5(
  step1Output: Step1Analysis,
  step4Output: Step4Content[]
): Promise<Step5Schedule[]> {
  const systemPrompt = `You are a content marketing strategist. Create a strategic publishing schedule and promotion plan.

Consider:
- Optimal posting times for each platform
- Content sequencing (build anticipation, maintain momentum)
- Cross-promotion opportunities
- Platform-specific best practices

For each content piece, provide:
1. Recommended publish date (relative to today, e.g., "Day 1", "Day 3")
2. Optimal time of day
3. Primary platform (where to publish first)
4. 3-5 specific promotion tactics

Return ONLY a valid JSON array with this structure:
[
  {
    "contentPiece": {
      "format": "newsletter",
      "title": "The actual title"
    },
    "publishDate": "Day 1",
    "publishTime": "9:00 AM EST",
    "platform": "Email / LinkedIn / Twitter / Blog",
    "promotionStrategy": [
      "Specific tactic 1",
      "Specific tactic 2",
      "Specific tactic 3"
    ]
  },
  ...for each content piece
]`;

  const contentSummary = step4Output.map(c => {
    const content = c.content as any;
    return {
      format: c.format,
      title: content.title || 'Untitled'
    };
  });

  const completion = await openai.chat.completions.create({
    model: "grok-2-1212",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analysis:\n${JSON.stringify(step1Output, null, 2)}\n\nContent pieces:\n${JSON.stringify(contentSummary, null, 2)}` }
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }
  
  return JSON.parse(jsonMatch[0]);
}
