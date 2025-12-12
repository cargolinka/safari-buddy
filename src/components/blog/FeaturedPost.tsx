import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedPostProps {
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

const FeaturedPost = ({
  title,
  slug,
  excerpt,
  featuredImage,
  category,
  author,
  publishedAt,
  readingTime,
}: FeaturedPostProps) => {
  return (
    <div className="relative h-[500px] rounded-lg overflow-hidden group">
      {featuredImage && (
        <>
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-foreground">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="default">{category.name}</Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {author.full_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground mb-6 line-clamp-2">{excerpt}</p>
          <Button size="lg" asChild>
            <Link to={`/safari-hire-blog/${slug}`}>Read Full Article</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedPost;
