import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert({ email: email.trim() });

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already subscribed!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } else {
      toast.success("Successfully subscribed!");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <section className="bg-primary text-primary-foreground py-16">
      <div className="container text-center max-w-2xl mx-auto">
        <Mail className="h-10 w-10 mx-auto mb-4 opacity-80" />
        <h2 className="text-3xl font-bold mb-3">Stay Updated</h2>
        <p className="opacity-90 mb-8">
          Get the latest safari tips, travel guides, and exclusive deals
          delivered straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
          >
            {loading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterCTA;
