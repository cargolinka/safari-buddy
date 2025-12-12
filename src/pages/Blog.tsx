import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import BlogCard from "@/components/blog/BlogCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import heroImage from "@/assets/hero-safari-2.jpg";

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const category = searchParams.get("category");
  const archive = searchParams.get("archive");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  useEffect(() => {
    setPage(1);
  }, [category, archive, search, tag]);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["blog-posts", page, category, archive, search, tag],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:profiles(full_name)
        `)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1);

      if (category) {
        const { data: cat } = await supabase
          .from("blog_categories")
          .select("id")
          .eq("slug", category)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }

      if (archive) {
        const [year, month] = archive.split("-");
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        query = query
          .gte("published_at", startDate.toISOString())
          .lte("published_at", endDate.toISOString());
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (tag) {
        query = query.contains("tags", [tag]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleCategoryFilter = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const activeFilter = category || archive || search || tag;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 container text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Safari Blog</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
              Expert tips, inspiring stories, and comprehensive guides for your safari adventure
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="border-b bg-background sticky top-0 z-20">
          <div className="container py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  variant={!category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90 transition-colors"
                  onClick={() => handleCategoryFilter(null)}
                >
                  All Posts
                </Badge>
                {categories?.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={category === cat.slug ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90 transition-colors"
                    onClick={() => handleCategoryFilter(cat.slug)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" size="sm">Search</Button>
              </form>
            </div>

            {/* Active Filter Indicator */}
            {activeFilter && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtering by:</span>
                <Badge variant="secondary" className="gap-1">
                  {category && `Category: ${category}`}
                  {archive && `Archive: ${archive}`}
                  {search && `Search: "${search}"`}
                  {tag && `Tag: ${tag}`}
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Blog Grid */}
        <section className="container py-12">
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-lg" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    featuredImage={post.featured_image_url}
                    category={post.category}
                    author={post.author}
                    publishedAt={post.published_at}
                    readingTime={post.reading_time}
                    compact
                  />
                ))}
              </div>
              {posts.length === POSTS_PER_PAGE && (
                <div className="flex justify-center pt-12">
                  <Button onClick={() => setPage(page + 1)} size="lg">
                    Load More Posts
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No blog posts found.</p>
              {activeFilter && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Blog;
