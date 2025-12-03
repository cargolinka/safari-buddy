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
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const redirectTo = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("individual");
  const [companyName, setCompanyName] = useState("");
  const [companyPin, setCompanyPin] = useState("");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState("");
  const [incorporationCert, setIncorporationCert] = useState<File | null>(null);
  const [pinCert, setPinCert] = useState<File | null>(null);
  const [businessPermit, setBusinessPermit] = useState<File | null>(null);
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
          const profileUpdate: any = { 
            full_name: fullName, 
            phone, 
            country,
            entity_type: role === 'owner' ? entityType : (role === 'client_corporate' ? 'company' : 'individual')
          };
          
          if (role === 'owner' && entityType === 'company') {
            profileUpdate.company_name = companyName;
            profileUpdate.company_pin = companyPin;
            profileUpdate.company_registration_number = companyRegistrationNumber;
          }
          
          const { error: profileError } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq("id", data.user.id);

          if (profileError) throw profileError;

          // Upload company documents if provided
          if (role === 'owner' && entityType === 'company') {
            const documentsToUpload = [
              { file: incorporationCert, type: 'certificate_of_incorporation' },
              { file: pinCert, type: 'pin_certificate' },
              { file: businessPermit, type: 'business_permit' }
            ];

            for (const doc of documentsToUpload) {
              if (doc.file) {
                const fileExt = doc.file.name.split('.').pop();
                const filePath = `${data.user.id}/${doc.type}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                  .from('company-documents')
                  .upload(filePath, doc.file);

                if (uploadError) throw uploadError;

                // Store document record
                const { error: docError } = await supabase
                  .from('company_documents')
                  .insert({
                    company_id: data.user.id,
                    document_type: doc.type,
                    file_path: filePath
                  });

                if (docError) throw docError;
              }
            }
          }

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

        navigate(redirectTo || "/dashboard");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
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

  const getRoleTitle = () => {
    if (showForgotPassword) return "Reset Password";
    if (redirectTo === "/admin") return "Admin Portal";
    if (preSelectedRole === "driver") return "Driver Portal";
    if (preSelectedRole === "owner") return "Vehicle Owner Portal";
    if (preSelectedRole === "client_individual") return "Client Portal";
    return "Welcome";
  };

  const getRoleDescription = () => {
    if (showForgotPassword) return "Enter your email to receive a password reset link";
    if (redirectTo === "/admin") return "Sign in to access the admin dashboard";
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
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          ) : (
          <>
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
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(preSelectedRole === "client_individual" || preSelectedRole === "client_corporate") ? (
                          <>
                            <SelectItem value="client_individual">Client (Individual)</SelectItem>
                            <SelectItem value="client_corporate">Client (Corporate)</SelectItem>
                          </>
                        ) : preSelectedRole === "driver" ? (
                          <SelectItem value="driver">Driver</SelectItem>
                        ) : preSelectedRole === "owner" ? (
                          <SelectItem value="owner">Vehicle Owner</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="client_individual">Client (Individual)</SelectItem>
                            <SelectItem value="client_corporate">Client (Corporate)</SelectItem>
                            <SelectItem value="owner">Vehicle Owner</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {role === "owner" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="entityType">Entity Type</Label>
                        <Select value={entityType} onValueChange={setEntityType} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {entityType === "company" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                              id="companyName"
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="companyPin">Company PIN</Label>
                            <Input
                              id="companyPin"
                              type="text"
                              value={companyPin}
                              onChange={(e) => setCompanyPin(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="companyRegistrationNumber">Company Registration Number</Label>
                            <Input
                              id="companyRegistrationNumber"
                              type="text"
                              value={companyRegistrationNumber}
                              onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                            />
                          </div>

                          <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium text-sm">Company Documents</h4>
                            
                            <div className="space-y-2">
                              <Label htmlFor="incorporationCert">Certificate of Incorporation *</Label>
                              <Input
                                id="incorporationCert"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setIncorporationCert(e.target.files?.[0] || null)}
                                required
                              />
                              <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 20MB)</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="pinCert">KRA PIN Certificate</Label>
                              <Input
                                id="pinCert"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setPinCert(e.target.files?.[0] || null)}
                              />
                              <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 20MB)</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="businessPermit">Business Permit/License</Label>
                              <Input
                                id="businessPermit"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setBusinessPermit(e.target.files?.[0] || null)}
                              />
                              <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 20MB)</p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
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

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </Tabs>

          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
