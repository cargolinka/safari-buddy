import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadField } from "@/components/driver/DocumentUploadField";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Director {
  full_name: string;
  id_number: string;
  position: string;
}

export default function CompanySetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyRegNumber, setCompanyRegNumber] = useState("");
  const [companyPin, setCompanyPin] = useState("");
  const [directors, setDirectors] = useState<Director[]>([
    { full_name: "", id_number: "", position: "" }
  ]);

  const [regCert, setRegCert] = useState<File | null>(null);
  const [pinCert, setPinCert] = useState<File | null>(null);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
  };

  const addDirector = () => {
    setDirectors([...directors, { full_name: "", id_number: "", position: "" }]);
  };

  const removeDirector = (index: number) => {
    setDirectors(directors.filter((_, i) => i !== index));
  };

  const updateDirector = (index: number, field: keyof Director, value: string) => {
    const updated = [...directors];
    updated[index][field] = value;
    setDirectors(updated);
  };

  const uploadDocument = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicle-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('vehicle-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!userId) return;

    // Validation
    if (!companyRegNumber || !companyPin) {
      toast.error("Please fill all company information");
      return;
    }

    if (directors.some(d => !d.full_name || !d.id_number || !d.position)) {
      toast.error("Please fill all director information");
      return;
    }

    if (!regCert || !pinCert) {
      toast.error("Please upload required documents");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload documents
      const regCertPath = await uploadDocument(regCert, `${userId}/company`);
      const pinCertPath = await uploadDocument(pinCert, `${userId}/company`);
      const businessLicensePath = businessLicense ? await uploadDocument(businessLicense, `${userId}/company`) : null;

      // 2. Update profile with company details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_registration_number: companyRegNumber,
          company_pin: companyPin
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Create director records
      const { error: directorsError } = await supabase
        .from('company_directors')
        .insert(
          directors.map(d => ({
            company_id: userId,
            ...d
          }))
        );

      if (directorsError) throw directorsError;

      // 4. Create document records
      const docs = [
        {
          company_id: userId,
          document_type: 'registration_certificate',
          file_path: regCertPath
        },
        {
          company_id: userId,
          document_type: 'pin_certificate',
          file_path: pinCertPath
        }
      ];

      if (businessLicensePath) {
        docs.push({
          company_id: userId,
          document_type: 'business_license',
          file_path: businessLicensePath
        });
      }

      const { error: docsError } = await supabase
        .from('company_documents')
        .insert(docs);

      if (docsError) throw docsError;

      toast.success("Company setup complete! Your company is under admin review.");
      navigate('/owner/dashboard');
    } catch (error: any) {
      console.error('Company setup error:', error);
      toast.error(error.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/owner/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Company Setup</h1>
        <p className="text-muted-foreground mb-6">Complete your company registration details</p>

        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Official company registration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regNumber">Company Registration Number *</Label>
                <Input
                  id="regNumber"
                  value={companyRegNumber}
                  onChange={(e) => setCompanyRegNumber(e.target.value)}
                  placeholder="C.123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (Tax ID) *</Label>
                <Input
                  id="pin"
                  value={companyPin}
                  onChange={(e) => setCompanyPin(e.target.value)}
                  placeholder="P051234567X"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Directors */}
          <Card>
            <CardHeader>
              <CardTitle>Company Directors</CardTitle>
              <CardDescription>Add all company directors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {directors.map((director, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Director {index + 1}</h4>
                    {directors.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDirector(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={director.full_name}
                        onChange={(e) => updateDirector(index, 'full_name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number *</Label>
                      <Input
                        value={director.id_number}
                        onChange={(e) => updateDirector(index, 'id_number', e.target.value)}
                        placeholder="12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position *</Label>
                      <Input
                        value={director.position}
                        onChange={(e) => updateDirector(index, 'position', e.target.value)}
                        placeholder="CEO"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addDirector} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Director
              </Button>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Company Documents</CardTitle>
              <CardDescription>Upload required company documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUploadField
                label="Company Registration Certificate"
                required
                onFileSelect={setRegCert}
              />
              <DocumentUploadField
                label="PIN Certificate"
                required
                onFileSelect={setPinCert}
              />
              <DocumentUploadField
                label="Business License (Optional)"
                onFileSelect={setBusinessLicense}
              />
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Complete Company Setup"}
          </Button>
        </div>
      </div>
    </div>
  );
}
