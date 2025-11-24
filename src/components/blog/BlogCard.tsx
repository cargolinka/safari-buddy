import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: {
    name: string;
    slug: string;
  };
  author: {
    full_name: string;
  };
  publishedAt: string;
  readingTime: number;
}

const BlogCard = ({
  slug,
  title,
  excerpt,
  featuredImage,
  category,
  author,
  publishedAt,
  readingTime,
}: BlogCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary">{category.name}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
        <h2 className="text-2xl font-semibold hover:text-primary transition-colors">
          <Link to={`/blog/${slug}`}>{title}</Link>
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {author.full_name}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/blog/${slug}`}>Read More</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
