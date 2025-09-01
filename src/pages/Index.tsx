import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, Clock, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">BlogSpark</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero">Get Started Free</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Generate blog posts that
          <br />
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            rank on search engines
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          BlogSpark is an AI-powered tool that helps you create high-quality, SEO-friendly
          blog posts in minutes. Say goodbye to writer's block and hello to effortless content
          creation.
        </p>
        <Link to="/register">
          <Button variant="hero" size="xl" className="mb-12">
            Start Generating Content
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Key Features</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            BlogSpark offers a range of features designed to streamline your content
            creation process and maximize your online presence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-soft hover:shadow-warm transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="p-3 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <CardTitle>AI-Powered Content Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our AI algorithms generate unique, engaging blog posts tailored to your topic
                and target audience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-warm transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="p-3 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4">
                <Target className="h-10 w-10 text-white" />
              </div>
              <CardTitle>SEO Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Ensure your content ranks high on search engines with built-in SEO optimization
                features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-warm transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="p-3 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <CardTitle>Time-Saving Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Create blog posts in minutes, freeing up your time for other important tasks.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Ready to transform your content strategy?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
          Join thousands of businesses and creators who are using BlogSpark to create
          amazing content.
        </p>
        <Link to="/register">
          <Button variant="hero" size="xl">
            Get Started For Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 BlogSpark. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
