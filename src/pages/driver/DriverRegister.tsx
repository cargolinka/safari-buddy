import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RegistrationSteps } from "@/components/driver/RegistrationSteps";
import { DocumentUploadField } from "@/components/driver/DocumentUploadField";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { addRole } from "@/lib/roleHelpers";

const STEPS = [
  { id: 1, title: "Account", description: "Setup login" },
  { id: 2, title: "Personal Info", description: "Your details" },
  { id: 3, title: "License", description: "Driver license" },
  { id: 4, title: "Documents", description: "Upload files" },
  { id: 5, title: "Vehicle Mgmt", description: "Optional" }
];

export default function DriverRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Step 3: License
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [ntsaBadge, setNtsaBadge] = useState("");

  // Step 4: Documents
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);

  // Step 5: Vehicle Management
  const [ownsVehicles, setOwnsVehicles] = useState(false);
  const [entityType, setEntityType] = useState<"individual" | "company">("individual");
  const [companyName, setCompanyName] = useState("");
  const [companyRegNumber, setCompanyRegNumber] = useState("");

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!email || !password || !confirmPassword) {
          toast.error("Please fill all account fields");
          return false;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return false;
        }
        return true;
      case 2:
        if (!fullName || !phone || !country || !idNumber) {
          toast.error("Please fill all personal information");
          return false;
        }
        return true;
      case 3:
        if (!licenseNumber || !licenseExpiry) {
          toast.error("Please fill license information");
          return false;
        }
        return true;
      case 4:
        if (!licenseDoc || !idDoc) {
          toast.error("Please upload all required documents");
          return false;
        }
        return true;
      case 5:
        if (ownsVehicles && entityType === "company" && (!companyName || !companyRegNumber)) {
          toast.error("Please fill company information");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const uploadDocument = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      // Pre-check: Verify email doesn't already exist in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingProfile) {
        toast.error("An account with this email already exists. Please sign in instead or use a different email.");
        setLoading(false);
        return;
      }

      // 1. Create auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/driver/dashboard`
        }
      });

      if (signUpError) {
        // Handle specific Supabase auth errors
        if (signUpError.message.includes('already registered')) {
          toast.error("This email is already registered. Please sign in instead.");
          setLoading(false);
          return;
        }
        throw signUpError;
      }
      
      if (!authData.user) throw new Error("User creation failed");

      const userId = authData.user.id;

      // 2. Upload documents
      const licensePath = await uploadDocument(licenseDoc!, userId);
      const idPath = await uploadDocument(idDoc!, userId);

      // 3. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          country,
          entity_type: ownsVehicles ? entityType : 'individual',
          company_name: ownsVehicles && entityType === 'company' ? companyName : null,
          company_registration_number: ownsVehicles && entityType === 'company' ? companyRegNumber : null,
          is_fleet_owner: ownsVehicles
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 4. Create driver record
      const { error: driverError } = await supabase
        .from('drivers')
        .insert([{
          id: userId,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          ntsa_badge_number: ntsaBadge || null,
          id_number: idNumber,
          is_vehicle_owner: ownsVehicles,
          status: 'pending' as any,
          is_compliant: false
        }]);

      if (driverError) throw driverError;

      // 5. Assign driver role
      await addRole(userId, 'driver');

      // 6. If owns vehicles, assign owner role
      if (ownsVehicles) {
        await addRole(userId, 'owner');
      }

      // 7. Create document records
      await supabase.from('documents').insert([
        {
          entity_id: userId,
          entity_type: 'driver',
          document_type: 'driver_license' as any,
          file_path: licensePath,
          expiry_date: licenseExpiry
        },
        {
          entity_id: userId,
          entity_type: 'driver',
          document_type: 'logbook' as any,
          file_path: idPath
        }
      ]);

      toast.success("Registration successful! Your profile is under review.");
      navigate('/driver/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          <h1 className="text-3xl font-bold">Driver Registration</h1>
          <p className="text-muted-foreground">Complete the steps below to register as a driver</p>
        </div>

        <RegistrationSteps currentStep={currentStep} steps={STEPS} />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Account Setup */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254712345678"
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
                  <Label htmlFor="idNumber">National ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </>
            )}

            {/* Step 3: License Information */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Driver's License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ntsaBadge">NTSA Badge Number (Optional)</Label>
                  <Input
                    id="ntsaBadge"
                    value={ntsaBadge}
                    onChange={(e) => setNtsaBadge(e.target.value)}
                    placeholder="NTSA123456"
                  />
                </div>
              </>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <>
                <DocumentUploadField
                  label="Driver's License"
                  required
                  onFileSelect={setLicenseDoc}
                />
                <DocumentUploadField
                  label="National ID"
                  required
                  onFileSelect={setIdDoc}
                />
              </>
            )}

            {/* Step 5: Vehicle Management */}
            {currentStep === 5 && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ownsVehicles"
                    checked={ownsVehicles}
                    onCheckedChange={(checked) => setOwnsVehicles(checked as boolean)}
                  />
                  <Label htmlFor="ownsVehicles" className="font-normal">
                    I own or manage vehicles
                  </Label>
                </div>

                {ownsVehicles && (
                  <>
                    <RadioGroup value={entityType} onValueChange={(value) => setEntityType(value as "individual" | "company")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="font-normal">I'm an Individual Owner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company" className="font-normal">I represent a Company/Fleet</Label>
                      </div>
                    </RadioGroup>

                    {entityType === "company" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="ABC Transport Ltd"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyRegNumber">Company Registration Number *</Label>
                          <Input
                            id="companyRegNumber"
                            value={companyRegNumber}
                            onChange={(e) => setCompanyRegNumber(e.target.value)}
                            placeholder="C.123456"
                          />
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            You'll need to upload company documents after registration
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {currentStep < 5 ? (
                <Button onClick={handleNext} className="ml-auto">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="ml-auto">
                  {loading ? "Submitting..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
