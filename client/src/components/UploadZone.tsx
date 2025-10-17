import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link2, FileText, Music, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onLinkSubmit: (url: string, type: 'youtube' | 'spotify') => void;
}

export default function UploadZone({ onFileSelect, onLinkSubmit }: UploadZoneProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkMode, setIsLinkMode] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) return;
    
    let type: 'youtube' | 'spotify' = 'youtube';
    if (linkUrl.includes('spotify.com')) {
      type = 'spotify';
    }
    
    onLinkSubmit(linkUrl, type);
    setLinkUrl('');
  };

  return (
    <div className="space-y-6">
      {!isLinkMode ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
            }
          `}
          data-testid="dropzone-upload"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full transition-all duration-200 ${
              isDragActive ? 'bg-primary/10' : 'bg-primary/5'
            }`}>
              <Upload className={`w-12 h-12 transition-colors ${
                isDragActive ? 'text-primary' : 'text-primary/70'
              }`} />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                {isDragActive ? 'Drop your file here' : 'Drag and drop your file'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse from your computer
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <Badge variant="secondary" className="gap-1.5">
                <Music className="w-3 h-3" />
                Audio
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Video className="w-3 h-3" />
                Video
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="w-3 h-3" />
                Text
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-12 border-border bg-muted/30">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/5">
              <Link2 className="w-12 h-12 text-primary/70" />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold text-foreground">Paste a link</p>
              <p className="text-sm text-muted-foreground">
                YouTube or Spotify content URL
              </p>
            </div>

            <div className="flex gap-2 w-full max-w-md mt-2">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://open.spotify.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                className="flex-1"
                data-testid="input-link"
              />
              <Button 
                onClick={handleLinkSubmit} 
                disabled={!linkUrl.trim()}
                data-testid="button-submit-link"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLinkMode(!isLinkMode)}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-toggle-mode"
        >
          {isLinkMode ? 'Upload a file instead' : 'Or paste a link instead'}
        </Button>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}
