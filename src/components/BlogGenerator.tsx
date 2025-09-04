import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, Download } from 'lucide-react';
import { chatService } from '@/services/chatService';

const BlogGenerator = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('english');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState([800]);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const generatePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both the title and content fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPost('');
    setEvents([]);

    const query = `${title}. ${content}`.trim();
    try {
      await chatService.streamAgent(
        { query },
        (evt) => {
          setEvents((prev) => [...prev, evt]);
          if (evt.type === 'delta' && evt.content) {
            setGeneratedPost((prev) => prev + evt.content);
          }
        }
      );
      toast({ title: 'Generation complete' });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: "Copied to clipboard",
      description: "Your blog post has been copied to the clipboard.",
    });
  };

  const downloadPost = () => {
    const blob = new Blob([generatedPost], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Your blog post has been downloaded as a markdown file.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Create New Post</h1>
        <p className="text-lg text-muted-foreground">
          Fill in the details below to generate your new blog post with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Blog Post Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Blog Post Title</Label>
              <Input
                id="title"
                placeholder="e.g., The Future of AI in Content Creation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content / Topic</Label>
              <Textarea
                id="content"
                placeholder="Describe the main topic or provide the initial content for your blog post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English (US)</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Desired Length</Label>
              <div className="px-2">
                <Slider
                  value={length}
                  onValueChange={setLength}
                  max={2000}
                  min={200}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>Short (~200 words)</span>
                  <span className="font-medium">{length[0]} words</span>
                  <span>Long (~2000 words)</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={generatePost} 
              disabled={isGenerating}
              variant="hero"
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating Post...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Blog Post</CardTitle>
              {generatedPost && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadPost}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg min-h-[240px]">
                  {generatedPost || 'Your generated blog post will appear here'}
                </pre>
              </div>
              {events.length > 0 && (
                <div className="text-xs bg-muted p-3 rounded">
                  <div className="font-medium mb-2">Live events</div>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {events.map((e, i) => (
                      <div key={i} className="font-mono">
                        {JSON.stringify(e)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogGenerator;