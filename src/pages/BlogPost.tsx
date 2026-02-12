import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:profiles(full_name)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.category_id],
    queryFn: async () => {
      if (!post?.category_id) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:profiles(full_name)
        `)
        .eq("category_id", post.category_id)
        .eq("is_published", true)
        .neq("id", post.id)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!post?.category_id,
  });

  // Fetch categories for sidebar
  const { data: categories = [] } = useQuery({
    queryKey: ["blog-categories-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent posts for sidebar
  const { data: recentPosts = [] } = useQuery({
    queryKey: ["recent-posts-sidebar"],
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

  // Fetch all published posts for archive and tags
  const { data: allPosts = [] } = useQuery({
    queryKey: ["all-posts-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("published_at, tags")
        .eq("is_published", true);
      if (error) throw error;
      return data;
    },
  });

  // Calculate archive months
  const archive = allPosts.reduce((acc: { month: string; year: string; count: number }[], post) => {
    if (!post.published_at) return acc;
    const date = new Date(post.published_at);
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    const existing = acc.find((a) => a.month === month && a.year === year);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ month, year, count: 1 });
    }
    return acc;
  }, []);

  // Calculate popular tags
  const tagCounts: Record<string, number> = {};
  allPosts.forEach((p) => {
    p.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  useEffect(() => {
    if (post?.id) {
      supabase
        .from("blog_posts")
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq("id", post.id)
        .then();
    }
  }, [post?.id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Skeleton className="h-[500px] w-full mb-8" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Button asChild>
            <Link to="/safari-hire-blog">Back to Blog</Link>
          </Button>
        </main>
      </div>
    );
  }

  const siteUrl = "https://safari-buddy.lovable.app";
  const postUrl = `${siteUrl}/safari-hire-blog/${post.slug}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{post.meta_title || post.title} | Safari Buddy Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.meta_keywords && post.meta_keywords.length > 0 && (
          <meta name="keywords" content={post.meta_keywords.join(", ")} />
        )}
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        <meta property="og:url" content={postUrl} />
        {(post.og_image_url || post.featured_image_url) && (
          <meta property="og:image" content={post.og_image_url || post.featured_image_url} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt} />
        {(post.og_image_url || post.featured_image_url) && (
          <meta name="twitter:image" content={post.og_image_url || post.featured_image_url} />
        )}
        
        {/* Article specific */}
        <meta property="article:published_time" content={post.published_at} />
        {post.author?.full_name && <meta property="article:author" content={post.author.full_name} />}
        {post.category?.name && <meta property="article:section" content={post.category.name} />}
        {post.tags?.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>
      
      <Header />
      
      <main className="flex-1">
        <article>
          {/* Hero Image */}
          {post.featured_image_url && (
            <section className="relative h-[340px] md:h-[480px] overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="container">
                  {post.category && <Badge className="mb-3">{post.category.name}</Badge>}
                  <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 max-w-3xl">{post.title}</h1>
                </div>
              </div>
            </section>
          )}

          <div className="container py-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/safari-hire-blog">Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{post.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="container py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Button variant="ghost" asChild className="mb-6">
                  <Link to="/safari-hire-blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                  </Link>
                </Button>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {!post.featured_image_url && post.category && <Badge variant="default">{post.category.name}</Badge>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {post.author?.full_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author.full_name}
                    </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.reading_time} min read
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleShare} className="ml-auto">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {!post.featured_image_url && (
                  <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
                )}
                
                <div className="prose prose-lg max-w-none">
                  <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
                  <div 
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t">
                    {post.tags.map((tag: string) => (
                      <Link key={tag} to={`/safari-hire-blog?tag=${tag}`}>
                        <Badge variant="outline">{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <aside className="lg:col-span-1">
                <BlogSidebar
                  categories={categories}
                  recentPosts={recentPosts}
                  archive={archive}
                  popularTags={popularTags}
                />
              </aside>
            </div>
          </div>
        </article>

        {relatedPosts && relatedPosts.length > 0 && (
          <section className="bg-muted py-16">
            <div className="container">
              <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard
                    key={relatedPost.id}
                    id={relatedPost.id}
                    title={relatedPost.title}
                    slug={relatedPost.slug}
                    excerpt={relatedPost.excerpt}
                    featuredImage={relatedPost.featured_image_url}
                    category={relatedPost.category}
                    author={relatedPost.author}
                    publishedAt={relatedPost.published_at}
                    readingTime={relatedPost.reading_time}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
