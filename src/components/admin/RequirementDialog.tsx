import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Requirement {
  id: string;
  name: string;
  description: string | null;
  requirement_type: string;
  is_mandatory: boolean;
  is_active: boolean;
}

interface RequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: Requirement | null;
  onSuccess: () => void;
}

export const RequirementDialog = ({
  open,
  onOpenChange,
  requirement,
  onSuccess,
}: RequirementDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requirementType, setRequirementType] = useState("certification");
  const [isMandatory, setIsMandatory] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (requirement) {
      setName(requirement.name);
      setDescription(requirement.description || "");
      setRequirementType(requirement.requirement_type);
      setIsMandatory(requirement.is_mandatory);
      setIsActive(requirement.is_active);
    } else {
      resetForm();
    }
  }, [requirement, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setRequirementType("certification");
    setIsMandatory(false);
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        description: description || null,
        requirement_type: requirementType,
        is_mandatory: isMandatory,
        is_active: isActive,
      };

      if (requirement) {
        const { error } = await supabase
          .from("driver_requirements")
          .update(data)
          .eq("id", requirement.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Requirement updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("driver_requirements")
          .insert(data);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Requirement added successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requirement ? "Edit Requirement" : "Add Requirement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., First Aid Certificate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this requirement"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={requirementType} onValueChange={setRequirementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mandatory</Label>
              <p className="text-sm text-muted-foreground">
                Is this requirement mandatory for all drivers?
              </p>
            </div>
            <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Is this requirement currently active?
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? "Saving..." : requirement ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
