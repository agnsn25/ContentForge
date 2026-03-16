// xAI Grok integration for content transformation
import OpenAI from "openai";
import type { TargetFormat, WritingSample } from "@shared/schema";
import { estimateTokens, MAX_CONTEXT_TOKENS } from "./transcriptCleaner";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

export async function transformContent(
  transcript: string,
  targetFormat: TargetFormat,
  sourceInfo: string,
  writingSamples?: WritingSample[],
  model: string = "grok-4-fast-reasoning"
): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null }> {

  const systemPrompts: Record<TargetFormat, string> = {
    newsletter: `Transform this transcript into a newsletter format (400-600 words).

Requirements:
- Start with a brief, punchy intro (2-3 sentences)
- Create 3-4 short sections with clear headers
- Use bullet points for key insights
- Include a "Quick Takeaway" box at the end
- Make it scannable and email-friendly
- Add a call-to-action at the end
- If no writing style guide was provided above, use a friendly and direct tone

Return ONLY a valid JSON object with this structure:
{
  "title": "Newsletter subject line",
  "intro": "Brief punchy intro (2-3 sentences)",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content",
      "bulletPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "quickTakeaway": "One sentence main takeaway",
  "callToAction": "Clear CTA text",
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "newsletter",
    "wordCount": 0
  }
}`,
    
    social: `Convert this transcript into a social media tutorial carousel (8-10 slides).

Requirements:
- Slide 1: Hook + what they'll learn
- Slides 2-8: One key point per slide (max 280 characters each)
- Use numbered steps if it's a how-to
- Make each slide self-contained but connected
- Slide 9-10: Summary + CTA
- Make it actionable and easy to follow
- Format as: "SLIDE 1:\\n[content]\\n\\nSLIDE 2:\\n[content]" etc.
- If no writing style guide was provided above, use emojis strategically for visual appeal

Return ONLY a valid JSON object with this structure:
{
  "hook": "Slide 1 hook with what they'll learn",
  "slides": [
    {
      "slideNumber": 1,
      "content": "Slide content with emojis (max 280 chars)"
    }
  ],
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "social",
    "totalSlides": 0
  }
}`,
    
    blog: `Convert this transcript into an engaging blog post (800-1200 words).

Requirements:
- Create an attention-grabbing title
- Write a compelling introduction
- Organize content into 3-5 sections with descriptive headings
- Use question-based headings where natural
- Lead each section with a direct, clear answer before elaborating
- Highlight specific data points, statistics, or concrete examples from the transcript
- Use natural transitions between ideas
- Include a conclusion with key takeaways
- Stay true to the content and ideas from the transcript
- If no writing style guide was provided above, use a conversational but professional tone

Return ONLY a valid JSON object with this structure:
{
  "title": "Attention-grabbing SEO-friendly title",
  "metaDescription": "Concise meta description (150-160 chars)",
  "introduction": "Compelling introduction paragraph",
  "sections": [
    {
      "heading": "Descriptive section heading",
      "content": "Detailed section content with natural transitions"
    }
  ],
  "conclusion": "Conclusion with key takeaways",
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "blog",
    "wordCount": 0
  }
}`,

    x: `Create a Twitter/X thread from this transcript (8-12 tweets).

Requirements:
- Tweet 1: Attention-grabbing hook with the main insight
- Each tweet: One clear idea (max 280 characters)
- Use line breaks for readability
- Last tweet: Summary or CTA
- Number the tweets (1/10, 2/10, etc.)
- NO hashtags (platform is moving away from them)
- Format as: "1/10\\n[tweet content]\\n\\n2/10\\n[tweet content]" etc.
- If no writing style guide was provided above, use a conversational and punchy tone

Return ONLY a valid JSON object with this structure:
{
  "tweets": [
    {
      "tweetNumber": 1,
      "totalTweets": 10,
      "content": "Tweet content (max 280 chars, no hashtags)"
    }
  ],
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "x",
    "totalTweets": 0
  }
}`
  };

  try {
    // Context window guard
    const estimatedInputTokens = estimateTokens(transcript);
    if (estimatedInputTokens > MAX_CONTEXT_TOKENS) {
      throw new Error('Transcript too long. Please use a shorter video or trim the content.');
    }

    // Build the system prompt with style matching FIRST if writing samples are provided
    let systemPrompt = '';
    
    const basePrompt = systemPrompts[targetFormat];
    
    if (writingSamples && writingSamples.length > 0) {
      const styleMatchingPrompt = `🎯 CRITICAL PRIORITY: WRITING STYLE MATCHING

You MUST write in the user's personal voice, tone, and style. The user has provided ${writingSamples.length} writing sample(s) below. Your PRIMARY job is to analyze and REPLICATE their unique writing style.

📝 Writing Sample(s):
${writingSamples.map((sample, idx) => `
━━━ Sample ${idx + 1}: "${sample.title}" (${sample.wordCount} words) ━━━
${sample.content}
`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 MANDATORY STYLE ANALYSIS - Identify and REPLICATE:
• Tone & Voice: Is it formal/casual, serious/playful, academic/conversational, enthusiastic/reserved?
• Perspective: First person (I/we), second person (you), or third person? How does the writer address the reader?
• Sentence Structure: Short punchy sentences vs. long flowing ones? Simple vs. complex? Rhythm and cadence?
• Vocabulary Level: Technical jargon, casual slang, accessible language, sophisticated terminology?
• Paragraph Style: One-liners? Dense blocks? How does pacing feel?
• Humor & Personality: Witty asides? Dry humor? Earnest and straightforward? Sarcastic? Playful?
• Rhetorical Devices: Questions to the reader? Lists? Metaphors? Analogies? Repetition for emphasis?
• Punctuation & Emphasis: Em dashes—like this? Parentheticals (casually inserted)? Ellipses... for effect? Italics or bold?
• Opening Style: How do they hook the reader?
• Closing Style: How do they wrap up thoughts?

⚡ YOUR TASK:
Write as if YOU ARE this person. Every sentence should sound like they wrote it. Match their:
- Energy level and enthusiasm
- Formality vs. casualness  
- Complexity vs. simplicity
- Wordiness vs. brevity
- Personality quirks and voice

The reader should NOT be able to tell this wasn't written by the original author.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
      systemPrompt = styleMatchingPrompt + basePrompt;
    } else {
      systemPrompt = basePrompt;
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Transform this transcript:\n\n${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from Grok');
    }

    // Read actual token usage from API response
    const usage = response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    } : null;

    if (usage) {
      console.log(`[Grok Usage] prompt=${usage.promptTokens} completion=${usage.completionTokens} total=${usage.totalTokens}`);
    }

    // Validate JSON structure based on format
    const parsed = JSON.parse(content);

    // Basic validation for each format
    if (targetFormat === 'newsletter') {
      if (!parsed.title || !parsed.intro || !parsed.sections || !parsed.quickTakeaway || !parsed.callToAction) {
        throw new Error('Invalid newsletter structure from Grok');
      }
    } else if (targetFormat === 'blog') {
      if (!parsed.title || !parsed.metaDescription || !parsed.introduction || !parsed.sections || !parsed.conclusion) {
        throw new Error('Invalid blog structure from Grok');
      }
    } else if (targetFormat === 'social') {
      if (!parsed.hook || !parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid social tutorial structure from Grok');
      }
    } else if (targetFormat === 'x') {
      if (!parsed.tweets || !Array.isArray(parsed.tweets)) {
        throw new Error('Invalid X thread structure from Grok');
      }
    }

    return { content, usage };
  } catch (error) {
    console.error('Grok transformation error:', error);
    throw new Error(`Failed to transform content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
