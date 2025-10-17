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
  const systemPrompts = {
    newsletter: `You are an expert newsletter writer. Transform the provided transcript into an engaging email newsletter format with:
- A catchy subject line as the title
- Clear sections with descriptive headings
- Key takeaways and insights
- Timestamps for important moments (if available)
- Email-friendly formatting

Return ONLY a valid JSON object with this structure:
{
  "title": "Newsletter title",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content with key points",
      "timestamp": "MM:SS (optional)"
    }
  ],
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "newsletter"
  }
}`,
    
    social: `You are a social media content expert. Transform the provided transcript into a step-by-step tutorial optimized for social media with:
- An attention-grabbing title
- Clear, numbered or bulleted steps
- Timestamps for each key moment
- Concise, actionable content
- Social-media friendly language

Return ONLY a valid JSON object with this structure:
{
  "title": "Tutorial title",
  "sections": [
    {
      "heading": "Step 1: [Action]",
      "content": "Brief, actionable content",
      "timestamp": "MM:SS"
    }
  ],
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "social"
  }
}`,
    
    blog: `You are a professional blog writer. Transform the provided transcript into a well-structured blog post with:
- An SEO-friendly title
- Introduction, body sections, and conclusion
- Proper headings and subheadings
- Timestamps for references
- Long-form, engaging content

Return ONLY a valid JSON object with this structure:
{
  "title": "Blog post title",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Detailed blog content",
      "timestamp": "MM:SS (optional)"
    }
  ],
  "metadata": {
    "originalSource": "${sourceInfo}",
    "transformedAt": "${new Date().toISOString()}",
    "format": "blog"
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

    // Validate JSON structure
    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response structure from Grok');
    }

    return content;
  } catch (error) {
    console.error('Grok transformation error:', error);
    throw new Error(`Failed to transform content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
