import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setMessage("No verification token found. Please check your email link.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          toast({
            title: "Email Verified!",
            description: "Your email has been verified. You can now sign in.",
          });
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify email. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <CardTitle>Verifying Your Email</CardTitle>
                <CardDescription>Please wait while we verify your email address...</CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-green-600">Email Verified!</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-destructive">Verification Failed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <Button onClick={() => navigate("/auth")} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Sign In to Your Account
              </Button>
            )}
            {status === "error" && (
              <div className="space-y-2">
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Go to Sign In
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Need help? Contact our support team.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
