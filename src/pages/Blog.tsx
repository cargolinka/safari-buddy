import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import FeaturedPost from "@/components/blog/FeaturedPost";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  
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

  const { data: recentPosts } = useQuery({
    queryKey: ["recent-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, featured_image_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: archiveData } = useQuery({
    queryKey: ["blog-archive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("is_published", true);
      if (error) throw error;

      const archiveMap = new Map<string, number>();
      data.forEach((post) => {
        const date = new Date(post.published_at);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        archiveMap.set(key, (archiveMap.get(key) || 0) + 1);
      });

      return Array.from(archiveMap.entries())
        .map(([key, count]) => {
          const [year, month] = key.split("-");
          return { year, month, count };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
          return parseInt(b.month) - parseInt(a.month);
        })
        .slice(0, 12);
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["popular-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("tags")
        .eq("is_published", true);
      if (error) throw error;

      const tagCounts = new Map<string, number>();
      data.forEach((post) => {
        post.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag]) => tag);
    },
  });

  const featuredPost = posts?.[0];
  const regularPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Safari Blog</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Expert tips, inspiring stories, and comprehensive guides for your safari adventure
            </p>
          </div>
        </section>

        {featuredPost && page === 1 && !category && !archive && !search && !tag && (
          <section className="container py-12">
            <FeaturedPost
              title={featuredPost.title}
              slug={featuredPost.slug}
              excerpt={featuredPost.excerpt}
              featuredImage={featuredPost.featured_image_url}
              category={featuredPost.category}
              author={featuredPost.author}
              publishedAt={featuredPost.published_at}
              readingTime={featuredPost.reading_time}
            />
          </section>
        )}

        <section className="container py-12">
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-8">
              {postsLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[400px] rounded-lg" />
                  ))}
                </>
              ) : regularPosts.length > 0 ? (
                <>
                  {regularPosts.map((post) => (
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
                    />
                  ))}
                  {regularPosts.length === POSTS_PER_PAGE && (
                    <div className="flex justify-center pt-8">
                      <Button onClick={() => setPage(page + 1)}>Load More Posts</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No blog posts found.</p>
                </div>
              )}
            </div>

            <aside>
              {categories && recentPosts && archiveData && tags && (
                <BlogSidebar
                  categories={categories}
                  recentPosts={recentPosts}
                  archive={archiveData}
                  popularTags={tags}
                />
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Blog;
