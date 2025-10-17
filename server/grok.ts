// xAI Grok integration for content transformation
import OpenAI from "openai";
import type { TargetFormat } from "@shared/schema";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

export async function transformContent(
  transcript: string,
  targetFormat: TargetFormat,
  sourceInfo: string
): Promise<string> {
  const systemPrompts: Record<TargetFormat, string> = {
    newsletter: `Transform this transcript into a newsletter format (400-600 words).

Requirements:
- Start with a brief, punchy intro (2-3 sentences)
- Create 3-4 short sections with clear headers
- Use bullet points for key insights
- Include a "Quick Takeaway" box at the end
- Make it scannable and email-friendly
- Add a call-to-action at the end
- Tone should be friendly and direct

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
- Use emojis strategically
- Make it actionable and easy to follow
- Format as: "SLIDE 1:\\n[content]\\n\\nSLIDE 2:\\n[content]" etc.

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
- Use natural transitions between ideas
- Include a conclusion with key takeaways
- Maintain a conversational but professional tone
- Add relevant examples or elaborations where the transcript is brief

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
- Include relevant hashtags (2-3 max)
- Last tweet: Summary or CTA
- Conversational, punchy tone
- Number the tweets (1/10, 2/10, etc.)
- Format as: "1/10\\n[tweet content]\\n\\n2/10\\n[tweet content]" etc.

Return ONLY a valid JSON object with this structure:
{
  "tweets": [
    {
      "tweetNumber": 1,
      "totalTweets": 10,
      "content": "Tweet content with hashtags (max 280 chars)"
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
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: systemPrompts[targetFormat]
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

    return content;
  } catch (error) {
    console.error('Grok transformation error:', error);
    throw new Error(`Failed to transform content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
