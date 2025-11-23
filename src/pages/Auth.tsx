import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COUNTRIES } from "@/lib/countries";
import { Car } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<string>("");
  const preSelectedRole = searchParams.get("role");

  // Removed automatic redirect - let users see the auth form

  useEffect(() => {
    if (preSelectedRole) {
      setRole(preSelectedRole);
    }
  }, [preSelectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!role) {
          toast({
            title: "Role Required",
            description: "Please select your role to continue",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!country) {
          toast({
            title: "Country Required",
            description: "Please select your country to continue",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Insert user role
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert([{ user_id: data.user.id, role: role as any }]);

          if (roleError) throw roleError;

          // Update profile
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ full_name: fullName, phone, country })
            .eq("id", data.user.id);

          if (profileError) throw profileError;

          toast({
            title: "Account Created",
            description: "Welcome! Redirecting to your dashboard...",
          });

          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome Back",
          description: "Successfully signed in",
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    if (preSelectedRole === "driver") return "Driver Portal";
    if (preSelectedRole === "owner") return "Vehicle Owner Portal";
    if (preSelectedRole === "client_individual") return "Client Portal";
    return "Welcome";
  };

  const getRoleDescription = () => {
    if (preSelectedRole === "driver") return "Sign in to manage your trips and assignments";
    if (preSelectedRole === "owner") return "Sign in to manage your fleet and vehicles";
    if (preSelectedRole === "client_individual") return "Sign in to book vehicles and manage reservations";
    return "Sign in to your account or create a new one";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{getRoleTitle()}</CardTitle>
          <CardDescription>
            {getRoleDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Driver Registration Section - Prominent at Top */}
          {!preSelectedRole && (
            <div className="mb-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Professional Driver?</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Register with your license and documents to start driving
                  </p>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => navigate('/driver/register')}
                    type="button"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Register as Driver
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(v) => setIsSignUp(v === "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={country} onValueChange={setCountry} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <Select value={role} onValueChange={setRole} required disabled={!!preSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_individual">Client (Individual)</SelectItem>
                        <SelectItem value="client_corporate">Client (Corporate)</SelectItem>
                        <SelectItem value="owner">Vehicle Owner</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                    {preSelectedRole && (
                      <p className="text-xs text-muted-foreground">
                        Role pre-selected. To change, visit the sign up page.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
