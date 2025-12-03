import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseRoleVerificationOptions {
  requiredRole: AppRole;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

interface UseRoleVerificationResult {
  loading: boolean;
  isAuthorized: boolean;
  session: Session | null;
  userRoles: AppRole[];
}

export function useRoleVerification({
  requiredRole,
  redirectTo = "/dashboard",
  onUnauthorized,
}: UseRoleVerificationOptions): UseRoleVerificationResult {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!currentSession) {
          navigate("/auth");
          return;
        }

        setSession(currentSession);

        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentSession.user.id);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to verify access permissions",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const roleList = roles?.map(r => r.role) || [];
        setUserRoles(roleList);

        const hasRequiredRole = roleList.includes(requiredRole);

        if (!hasRequiredRole) {
          toast({
            title: "Access Denied",
            description: `You don't have ${requiredRole} privileges`,
            variant: "destructive",
          });
          
          if (onUnauthorized) {
            onUnauthorized();
          } else {
            navigate(redirectTo);
          }
          return;
        }

        setIsAuthorized(true);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An error occurred during verification",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [requiredRole, redirectTo, navigate, toast, onUnauthorized]);

  return { loading, isAuthorized, session, userRoles };
}
