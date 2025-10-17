import { Mail, Video, FileText } from 'lucide-react';
import { RiTwitterXFill } from 'react-icons/ri';
import { Card } from '@/components/ui/card';
import type { TargetFormat } from '@shared/schema';

interface FormatSelectorProps {
  selectedFormat: TargetFormat | null;
  onSelectFormat: (format: TargetFormat) => void;
}

const formats = [
  {
    id: 'newsletter' as TargetFormat,
    icon: Mail,
    title: 'Newsletter',
    description: 'Email-friendly format with sections and key takeaways',
  },
  {
    id: 'social' as TargetFormat,
    icon: Video,
    title: 'Social Tutorial',
    description: 'Carousel slides optimized for social media',
  },
  {
    id: 'blog' as TargetFormat,
    icon: FileText,
    title: 'Blog Post',
    description: 'Long-form article with proper structure and SEO',
  },
  {
    id: 'x' as TargetFormat,
    icon: RiTwitterXFill,
    title: 'X Thread',
    description: 'Twitter/X thread with engaging tweets and hashtags',
  },
];

export default function FormatSelector({ selectedFormat, onSelectFormat }: FormatSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Choose Output Format</h3>
        <p className="text-sm text-muted-foreground">
          Select how you want your content transformed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {formats.map((format) => {
          const Icon = format.icon;
          const isSelected = selectedFormat === format.id;
          
          return (
            <Card
              key={format.id}
              onClick={() => onSelectFormat(format.id)}
              className={`
                p-6 cursor-pointer transition-all duration-200 hover-elevate active-elevate-2
                ${isSelected 
                  ? 'border-2 border-primary ring-2 ring-primary/20' 
                  : 'border border-card-border'
                }
              `}
              data-testid={`card-format-${format.id}`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`
                  p-3 rounded-lg transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">{format.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {format.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
