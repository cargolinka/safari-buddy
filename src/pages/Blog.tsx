import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const Blog = () => {
  const posts = [
    {
      id: 1,
      title: "Top 10 Safari Destinations in Kenya",
      excerpt: "Discover the most breathtaking safari destinations that Kenya has to offer, from the Masai Mara to Amboseli National Park.",
      category: "Travel Tips",
      date: "March 15, 2024",
      author: "Safari Team",
    },
    {
      id: 2,
      title: "Choosing the Right Vehicle for Your Safari",
      excerpt: "Learn how to select the perfect safari vehicle based on your group size, destination, and adventure preferences.",
      category: "Vehicle Guide",
      date: "March 10, 2024",
      author: "Safari Team",
    },
    {
      id: 3,
      title: "Best Time to Visit East African National Parks",
      excerpt: "A comprehensive guide to planning your safari around the best weather and wildlife viewing seasons.",
      category: "Travel Tips",
      date: "March 5, 2024",
      author: "Safari Team",
    },
    {
      id: 4,
      title: "Wildlife Photography Tips for Safari Enthusiasts",
      excerpt: "Essential photography techniques and equipment recommendations for capturing stunning wildlife moments.",
      category: "Photography",
      date: "February 28, 2024",
      author: "Safari Team",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Safari Blog</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Tips, guides, and stories from the world of safari adventures
            </p>
          </div>
        </section>

        <section className="py-16 container">
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground mb-4 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">By {post.author}</span>
                    <Button variant="outline">Read More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Blog;
