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

const BlogGenerator = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('english');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState([800]);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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

    // Simulate AI generation
    setTimeout(() => {
      const lengthText = length[0] < 500 ? 'Short' : length[0] < 1200 ? 'Medium' : 'Long';
      const generatedContent = `# ${title}

## Introduction

${content} This comprehensive guide will explore the key aspects of this topic in detail, providing you with actionable insights and practical strategies.

## Key Points to Consider

1. **Understanding the Fundamentals**: It's crucial to grasp the basic concepts before diving deeper into advanced strategies.

2. **Best Practices**: Following industry-standard approaches ensures better results and sustainable growth.

3. **Implementation Strategies**: 
   - Start with small, manageable steps
   - Monitor progress regularly
   - Adjust tactics based on results

## Deep Dive Analysis

The ${tone} approach to this topic reveals several important considerations. When implementing these strategies, it's essential to maintain a balance between innovation and proven methodologies.

### Practical Applications

- **Immediate Actions**: Begin with these foundational steps
- **Medium-term Goals**: Develop comprehensive strategies
- **Long-term Vision**: Create sustainable systems

## Conclusion

By following these guidelines and maintaining a ${tone} approach, you'll be well-positioned to achieve your objectives. Remember to stay consistent and measure your progress regularly.

---

*This ${lengthText.toLowerCase()} blog post was generated to provide comprehensive coverage of "${title}" in ${language} with a ${tone} tone, containing approximately ${length[0]} words.*`;

      setGeneratedPost(generatedContent);
      setIsGenerating(false);
      
      toast({
        title: "Blog post generated!",
        description: `Your ${lengthText.toLowerCase()} blog post is ready.`,
      });
    }, 3000);
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
            {generatedPost ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {generatedPost}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated blog post will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogGenerator;