import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BlogPostDialog from "@/components/admin/BlogPostDialog";
import { Link } from "react-router-dom";

const ManageBlog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(name),
          author:profiles(full_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Post deleted successfully" });
    },
  });

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h1 className="text-3xl font-bold">Manage Blog Posts</h1>
              <p className="text-muted-foreground">Create and manage your blog content</p>
            </div>
            <Button onClick={() => {
              setEditingPost(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="bg-card rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : posts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No posts yet</TableCell>
                  </TableRow>
                ) : (
                  posts?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.category?.name}</TableCell>
                      <TableCell>{post.author?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={post.is_published ? "default" : "secondary"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.views_count || 0}</TableCell>
                      <TableCell>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {post.is_published && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/blog/${post.slug}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <BlogPostDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            post={editingPost}
          />
        </main>
      </div>
    </div>
  );
};

export default ManageBlog;
