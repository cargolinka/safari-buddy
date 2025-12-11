import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      // Check for custom token first
      if (token) {
        try {
          const response = await supabase.functions.invoke('verify-reset-token', {
            body: { token }
          });

          if (response.error) {
            setTokenError(response.error.message || "Invalid reset link");
            setIsValidToken(false);
          } else if (response.data?.valid) {
            setIsValidToken(true);
            setUserEmail(response.data.email || "");
          } else if (response.data?.error) {
            setTokenError(response.data.error);
            setIsValidToken(false);
          }
        } catch (error: any) {
          console.error("Token verification error:", error);
          setTokenError("Failed to verify reset link");
          setIsValidToken(false);
        }
      } else {
        // Fallback: check for Supabase auth recovery session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidToken(true);
          setUserEmail(session.user.email || "");
        } else {
          setTokenError("Invalid or expired reset link");
          setIsValidToken(false);
        }
      }
      setCheckingToken(false);
    };

    // Listen for auth state changes (for Supabase recovery flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setIsValidToken(true);
          setUserEmail(session.user.email || "");
          setCheckingToken(false);
        }
      }
    );

    verifyToken();

    return () => subscription.unsubscribe();
  }, [token]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (token) {
        // Use custom token flow
        const response = await supabase.functions.invoke('verify-reset-token', {
          body: { token, newPassword: password }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        if (!response.data?.success) {
          throw new Error("Failed to update password");
        }
      } else {
        // Use Supabase auth flow
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;
      }

      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-lg">Verifying reset link...</div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              {tokenError || "This password reset link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth")}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription>
                Your password has been successfully changed.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                {userEmail ? `Enter a new password for ${userEmail}` : "Enter your new password below."}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth")}
            >
              Continue to Sign In
            </Button>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
