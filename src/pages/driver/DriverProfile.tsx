import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const driverSchema = z.object({
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry date is required"),
});

type DriverFormData = z.infer<typeof driverSchema>;

export default function DriverProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "driver") {
      navigate("/dashboard");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch driver data
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (driverError) throw driverError;

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      setDriver(driverData);
      setProfile(profileData);

      if (driverData) {
        setValue("license_number", driverData.license_number);
        setValue("license_expiry", driverData.license_expiry);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseUpload = async () => {
    if (!licenseFile) return;

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = licenseFile.name.split('.').pop();
      const fileName = `${session.user.id}/license-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, licenseFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          entity_id: session.user.id,
          entity_type: 'driver',
          document_type: 'driver_license',
          file_path: publicUrl,
        });

      if (docError) throw docError;

      toast({
        title: "License uploaded",
        description: "Your license document has been uploaded successfully.",
      });

      setLicenseFile(null);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: DriverFormData) => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (driver) {
        // Update existing driver
        const { error } = await supabase
          .from("drivers")
          .update({
            license_number: data.license_number,
            license_expiry: data.license_expiry,
          })
          .eq("id", session.user.id);

        if (error) throw error;
      } else {
        // Create new driver profile
        const { error } = await supabase
          .from("drivers")
          .insert({
            id: session.user.id,
            license_number: data.license_number,
            license_expiry: data.license_expiry,
            status: 'available',
            ntsa_verified: false,
          });

        if (error) throw error;
      }

      // Upload license if selected
      if (licenseFile) {
        await handleLicenseUpload();
      }

      toast({
        title: "Profile updated",
        description: "Your driver profile has been updated successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/driver/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Driver Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and license</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <p className="text-sm mt-1">{profile?.full_name || "N/A"}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p className="text-sm mt-1">{profile?.phone || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* License Status */}
        {driver && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>License Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compliance Status</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {driver.is_compliant ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Compliant</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">Non-Compliant</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={driver.ntsa_verified ? "default" : "outline"}>
                  {driver.ntsa_verified ? "NTSA Verified" : "NTSA Pending"}
                </Badge>
              </div>

              <div>
                <Label>Driver Status</Label>
                <Badge variant="secondary" className="mt-2 capitalize">
                  {driver.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* License Details Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>License Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="license_number">License Number *</Label>
                <Input 
                  id="license_number" 
                  {...register("license_number")}
                  placeholder="Enter your license number"
                />
                {errors.license_number && (
                  <p className="text-sm text-destructive mt-1">{errors.license_number.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="license_expiry">License Expiry Date *</Label>
                <Input 
                  id="license_expiry" 
                  type="date"
                  {...register("license_expiry")}
                />
                {errors.license_expiry && (
                  <p className="text-sm text-destructive mt-1">{errors.license_expiry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="license_file">Upload License Document</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    id="license_file"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                  />
                  {licenseFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {licenseFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              {saving || uploading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
