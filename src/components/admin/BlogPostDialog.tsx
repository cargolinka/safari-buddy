import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/blog/RichTextEditor";
import BlogImageCropper from "@/components/admin/BlogImageCropper";
import { Search, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: any;
}

const BlogPostDialog = ({ open, onOpenChange, post }: BlogPostDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      tags: "",
      featured_image_url: "",
      is_published: false,
      reading_time: 5,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      canonical_url: "",
      og_image_url: "",
    },
  });

  const title = watch("title");
  const metaTitle = watch("meta_title");
  const metaDescription = watch("meta_description");
  const slug = watch("slug");

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

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category_id: post.category_id,
        tags: post.tags?.join(", ") || "",
        featured_image_url: post.featured_image_url || "",
        is_published: post.is_published,
        reading_time: post.reading_time,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        meta_keywords: post.meta_keywords?.join(", ") || "",
        canonical_url: post.canonical_url || "",
        og_image_url: post.og_image_url || "",
      });
    } else {
      reset({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category_id: "",
        tags: "",
        featured_image_url: "",
        is_published: false,
        reading_time: 5,
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        canonical_url: "",
        og_image_url: "",
      });
    }
  }, [post, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const postData = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category_id: data.category_id || null,
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
        featured_image_url: data.featured_image_url || null,
        is_published: data.is_published,
        reading_time: data.reading_time,
        author_id: user?.id,
        published_at: data.is_published ? new Date().toISOString() : null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords ? data.meta_keywords.split(",").map((k: string) => k.trim()) : [],
        canonical_url: data.canonical_url || null,
        og_image_url: data.og_image_url || data.featured_image_url || null,
      };

      if (post) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert([postData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: post ? "Post updated" : "Post created successfully" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // SEO Preview
  const seoPreviewTitle = metaTitle || title || "Page Title";
  const seoPreviewUrl = `safari-buddy.lovable.app/safari-hire-blog/${slug || "post-url"}`;
  const seoPreviewDescription = metaDescription || "Meta description will appear here...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Post" : "Create New Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: true })}
                onChange={(e) => {
                  register("title").onChange(e);
                  if (!post) {
                    setValue("slug", generateSlug(e.target.value));
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input id="slug" {...register("slug", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(value) => setValue("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea id="excerpt" {...register("excerpt", { required: true })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                content={watch("content")}
                onChange={(content) => setValue("content", content)}
                placeholder="Write your blog post content here..."
              />
            </div>

            <BlogImageCropper
              currentImageUrl={watch("featured_image_url")}
              onImageUploaded={(url) => setValue("featured_image_url", url)}
              label="Featured Image"
              aspectRatio={16 / 9}
            />

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" {...register("tags")} placeholder="safari, wildlife, travel" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reading_time">Reading Time (minutes)</Label>
                <Input
                  id="reading_time"
                  type="number"
                  {...register("reading_time", { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="is_published"
                  checked={watch("is_published")}
                  onCheckedChange={(checked) => setValue("is_published", checked)}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <Accordion type="single" collapsible defaultValue="seo">
            <AccordionItem value="seo" className="border rounded-lg">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>SEO Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* SEO Preview */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Search Engine Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm text-blue-600 truncate">{seoPreviewUrl}</p>
                    <p className="text-lg text-blue-800 font-medium truncate hover:underline cursor-pointer">
                      {seoPreviewTitle}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {seoPreviewDescription}
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <span className={`text-xs ${(metaTitle?.length || 0) > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {metaTitle?.length || 0}/60
                    </span>
                  </div>
                  <Input
                    id="meta_title"
                    {...register("meta_title")}
                    placeholder="SEO title (defaults to post title)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep under 60 characters for best display in search results
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <span className={`text-xs ${(metaDescription?.length || 0) > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {metaDescription?.length || 0}/160
                    </span>
                  </div>
                  <Textarea
                    id="meta_description"
                    {...register("meta_description")}
                    placeholder="Brief description for search engines..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep under 160 characters for optimal search results display
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
                  <Input
                    id="meta_keywords"
                    {...register("meta_keywords")}
                    placeholder="safari tours, kenya travel, wildlife safari"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canonical_url">Canonical URL</Label>
                  <Input
                    id="canonical_url"
                    {...register("canonical_url")}
                    placeholder="https://example.com/original-post"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use if this content exists elsewhere (prevents duplicate content issues)
                  </p>
                </div>

                <BlogImageCropper
                  currentImageUrl={watch("og_image_url")}
                  onImageUploaded={(url) => setValue("og_image_url", url)}
                  label="Open Graph Image"
                  aspectRatio={1200 / 630}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : post ? "Update" : "Create"} Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostDialog;
