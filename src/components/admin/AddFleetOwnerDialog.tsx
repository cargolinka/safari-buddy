import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useActiveCountries } from "@/hooks/useActiveCountries";

interface AddFleetOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  country: string;
  entity_type: "individual" | "company";
  company_name?: string;
  company_registration_number?: string;
  company_pin?: string;
}

export function AddFleetOwnerDialog({ open, onOpenChange, onSuccess }: AddFleetOwnerDialogProps) {
  const { data: countries = [] } = useActiveCountries();
  const [entityType, setEntityType] = useState<"individual" | "company">("individual");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      entity_type: "individual",
      country: "",
    },
  });

  const queryClient = useQueryClient();

  const createFleetOwnerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Check if email already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", data.email)
        .maybeSingle();

      if (existingProfile) {
        throw new Error("A user with this email already exists");
      }

      // Create auth user with signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const userId = authData.user.id;

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update profile with additional data
      const profileData: any = {
        full_name: data.full_name,
        phone: data.phone,
        country: data.country,
        entity_type: data.entity_type,
        is_fleet_owner: true,
        email: data.email,
      };

      if (data.entity_type === "company") {
        profileData.company_name = data.company_name;
        profileData.company_registration_number = data.company_registration_number;
        profileData.company_pin = data.company_pin;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      // Add owner role using edge function (bypasses RLS)
      const { data: roleData, error: roleError } = await supabase.functions.invoke("assign-role", {
        body: { userId, role: "owner" },
      });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        throw new Error(`Failed to assign owner role: ${roleError.message}`);
      }

      if (roleData?.error) {
        console.error("Role assignment failed:", roleData.error);
        throw new Error(`Failed to assign owner role: ${roleData.error}`);
      }

      return authData.user;
    },
    onSuccess: () => {
      toast.success("Fleet owner created successfully with owner role");
      reset();
      setEntityType("individual");
      queryClient.invalidateQueries({ queryKey: ["fleet-owners"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error creating fleet owner:", error);
      toast.error(error.message || "Failed to create fleet owner");
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.entity_type === "company" && (!data.company_name || !data.company_registration_number)) {
      toast.error("Company name and registration number are required for companies");
      return;
    }

    createFleetOwnerMutation.mutate(data);
  };

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value as "individual" | "company");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fleet Owner</DialogTitle>
          <DialogDescription>
            Create a new fleet owner account. They will receive their login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Entity Type *</Label>
            <RadioGroup
              defaultValue="individual"
              onValueChange={handleEntityTypeChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="font-normal cursor-pointer">
                  Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="font-normal cursor-pointer">
                  Company
                </Label>
              </div>
            </RadioGroup>
            <input type="hidden" {...register("entity_type")} value={entityType} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: true })}
                placeholder="owner@example.com"
              />
              {errors.email && <span className="text-sm text-destructive">Email is required</span>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: true, minLength: 6 })}
                placeholder="Min. 6 characters"
              />
              {errors.password && (
                <span className="text-sm text-destructive">
                  Password must be at least 6 characters
                </span>
              )}
            </div>

            {entityType === "individual" ? (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register("full_name", { required: true })}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <span className="text-sm text-destructive">Full name is required</span>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    {...register("company_name")}
                    placeholder="Safari Tours Ltd"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_registration_number">Registration Number *</Label>
                  <Input
                    id="company_registration_number"
                    {...register("company_registration_number")}
                    placeholder="REG123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_pin">Company PIN</Label>
                  <Input
                    id="company_pin"
                    {...register("company_pin")}
                    placeholder="PIN123456"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="full_name">Contact Person Name *</Label>
                  <Input
                    id="full_name"
                    {...register("full_name", { required: true })}
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <span className="text-sm text-destructive">Contact person name is required</span>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone", { required: true })}
                placeholder="+254712345678"
              />
              {errors.phone && (
                <span className="text-sm text-destructive">Phone is required</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select onValueChange={(value) => register("country").onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("country", { required: true })} />
              {errors.country && (
                <span className="text-sm text-destructive">Country is required</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setEntityType("individual");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFleetOwnerMutation.isPending}>
              {createFleetOwnerMutation.isPending ? "Creating..." : "Create Fleet Owner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
