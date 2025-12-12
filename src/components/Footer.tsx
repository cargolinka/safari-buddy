import { useState } from "react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed to our newsletter!");
        } else {
          throw error;
        }
      } else {
        toast.success("Thank you for subscribing!");
        setEmail("");
      }
    } catch (error: any) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { to: "/safari-vehicles", label: "Vehicles" },
    { to: "/empty-legs", label: "Empty Legs" },
    { to: "/safari-hire-gallery", label: "Gallery" },
    { to: "/safari-hire-blog", label: "Blog" },
  ];

  const companyLinks = [
    { to: "/about", label: "About Us" },
    { to: "/why-us", label: "Why Choose Us" },
    { to: "/contact", label: "Contact" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">SafariHire</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trusted partner for safari vehicle rentals in East Africa. 
              Experience the adventure of a lifetime with our premium fleet.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Company</h4>
            <nav className="flex flex-col gap-2">
              {companyLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-2 pt-2">
              <a href="mailto:info@safarihire.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                info@safarihire.com
              </a>
              <a href="tel:+254700000000" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                +254 700 000 000
              </a>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Nairobi, Kenya
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Newsletter</h4>
            <p className="text-sm text-muted-foreground">
              Subscribe to get the latest offers, news, and safari tips.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SafariHire. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
