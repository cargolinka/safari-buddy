import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string | null;
  category?: {
    id?: string;
    name: string;
    slug: string;
  } | null;
  author?: {
    full_name: string;
  } | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  compact?: boolean;
}

const BlogCard = ({
  title,
  slug,
  excerpt,
  featuredImage,
  category,
  author,
  publishedAt,
  readingTime,
  compact = false,
}: BlogCardProps) => {
  if (compact) {
    return (
      <Card className="overflow-hidden group h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          {category && (
            <Badge className="absolute top-3 left-3 bg-primary/90">
              {category.name}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            {publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(publishedAt), "MMM d, yyyy")}
              </span>
            )}
            {readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime} min
              </span>
            )}
          </div>
          <Link to={`/safari-hire-blog/${slug}`}>
            <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {excerpt}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          {author && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {author.full_name}
            </span>
          )}
          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
            <Link to={`/safari-hire-blog/${slug}`}>Read More →</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Original full-size card for other contexts
  return (
    <Card className="overflow-hidden group">
      <div className="grid md:grid-cols-[300px_1fr] gap-0">
        <div className="relative aspect-video md:aspect-auto overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center min-h-[200px]">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <CardContent className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-3">
              {category && (
                <Badge variant="secondary">{category.name}</Badge>
              )}
              {publishedAt && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(publishedAt), "MMMM d, yyyy")}
                </span>
              )}
            </div>
            <Link to={`/safari-hire-blog/${slug}`}>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {title}
              </h2>
            </Link>
            <p className="text-muted-foreground line-clamp-3 mb-4">{excerpt}</p>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {author.full_name}
                </span>
              )}
              {readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readingTime} min read
                </span>
              )}
            </div>
            <Button variant="outline" asChild>
              <Link to={`/safari-hire-blog/${slug}`}>Read More</Link>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default BlogCard;
