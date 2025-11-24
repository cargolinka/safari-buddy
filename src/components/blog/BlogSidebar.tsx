import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";
import SearchBox from "./SearchBox";

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  featured_image_url?: string;
  published_at: string;
}

interface ArchiveMonth {
  month: string;
  year: string;
  count: number;
}

interface BlogSidebarProps {
  categories: Category[];
  recentPosts: RecentPost[];
  archive: ArchiveMonth[];
  popularTags: string[];
}

const BlogSidebar = ({ categories, recentPosts, archive, popularTags }: BlogSidebarProps) => {
  return (
    <div className="space-y-6">
      <SearchBox />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
            >
              <span className="text-sm">{category.name}</span>
              <Badge variant="secondary">{category.post_count}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Archive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {archive.map((item, index) => (
            <Link
              key={index}
              to={`/blog?archive=${item.year}-${item.month.padStart(2, '0')}`}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors text-sm"
            >
              <span>
                {new Date(parseInt(item.year), parseInt(item.month) - 1).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="text-muted-foreground">({item.count})</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="flex gap-3 group"
            >
              {post.featured_image_url && (
                <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {popularTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link key={tag} to={`/blog?tag=${tag}`}>
                  <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlogSidebar;
