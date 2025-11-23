import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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
import { COUNTRIES } from "@/lib/countries";

interface FleetOwner {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  country: string;
  entity_type: "individual" | "company";
  company_name?: string;
  company_registration_number?: string;
  company_pin?: string;
}

interface EditFleetOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: FleetOwner | null;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  full_name: string;
  phone: string;
  country: string;
  entity_type: "individual" | "company";
  company_name?: string;
  company_registration_number?: string;
  company_pin?: string;
}

export function EditFleetOwnerDialog({ open, onOpenChange, owner, onSuccess }: EditFleetOwnerDialogProps) {
  const [entityType, setEntityType] = useState<"individual" | "company">("individual");
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (owner) {
      reset({
        email: owner.email || "",
        full_name: owner.full_name || "",
        phone: owner.phone || "",
        country: owner.country || "",
        entity_type: owner.entity_type || "individual",
        company_name: owner.company_name || "",
        company_registration_number: owner.company_registration_number || "",
        company_pin: owner.company_pin || "",
      });
      setEntityType(owner.entity_type || "individual");
    }
  }, [owner, reset]);

  const updateFleetOwnerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!owner) throw new Error("No owner selected");

      // Update profile
      const profileData: any = {
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        country: data.country,
        entity_type: data.entity_type,
      };

      if (data.entity_type === "company") {
        profileData.company_name = data.company_name;
        profileData.company_registration_number = data.company_registration_number;
        profileData.company_pin = data.company_pin;
      } else {
        // Clear company fields if switching to individual
        profileData.company_name = null;
        profileData.company_registration_number = null;
        profileData.company_pin = null;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", owner.id);

      if (profileError) throw profileError;

      // Update auth user email if changed
      if (data.email !== owner.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          owner.id,
          { email: data.email }
        );
        if (authError) throw authError;
      }
    },
    onSuccess: () => {
      toast.success("Fleet owner updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error updating fleet owner:", error);
      toast.error(error.message || "Failed to update fleet owner");
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.entity_type === "company" && (!data.company_name || !data.company_registration_number)) {
      toast.error("Company name and registration number are required for companies");
      return;
    }

    updateFleetOwnerMutation.mutate(data);
  };

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value as "individual" | "company");
    setValue("entity_type", value as "individual" | "company");
  };

  if (!owner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fleet Owner</DialogTitle>
          <DialogDescription>
            Update fleet owner information and contact details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Entity Type *</Label>
            <RadioGroup
              value={entityType}
              onValueChange={handleEntityTypeChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="edit-individual" />
                <Label htmlFor="edit-individual" className="font-normal cursor-pointer">
                  Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="edit-company" />
                <Label htmlFor="edit-company" className="font-normal cursor-pointer">
                  Company
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                {...register("email", { required: true })}
                placeholder="owner@example.com"
              />
              {errors.email && <span className="text-sm text-destructive">Email is required</span>}
            </div>

            {entityType === "individual" ? (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-full_name">Full Name *</Label>
                <Input
                  id="edit-full_name"
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
                  <Label htmlFor="edit-company_name">Company Name *</Label>
                  <Input
                    id="edit-company_name"
                    {...register("company_name")}
                    placeholder="Safari Tours Ltd"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company_registration_number">Registration Number *</Label>
                  <Input
                    id="edit-company_registration_number"
                    {...register("company_registration_number")}
                    placeholder="REG123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company_pin">Company PIN</Label>
                  <Input
                    id="edit-company_pin"
                    {...register("company_pin")}
                    placeholder="PIN123456"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-full_name">Contact Person Name *</Label>
                  <Input
                    id="edit-full_name"
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
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                type="tel"
                {...register("phone", { required: true })}
                placeholder="+254712345678"
              />
              {errors.phone && (
                <span className="text-sm text-destructive">Phone is required</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-country">Country *</Label>
              <Select
                defaultValue={owner.country}
                onValueChange={(value) => setValue("country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateFleetOwnerMutation.isPending}>
              {updateFleetOwnerMutation.isPending ? "Updating..." : "Update Fleet Owner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
