import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: AppRole;
  redirectTo?: string;
  unauthorizedRedirect?: string;
}

export function RoleProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth",
  unauthorizedRedirect = "/dashboard",
}: RoleProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!currentSession) {
          setLoading(false);
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
          setLoading(false);
          return;
        }

        const roleList = roles?.map(r => r.role) || [];
        const hasRequiredRole = roleList.includes(requiredRole);

        if (!hasRequiredRole) {
          toast({
            title: "Access Denied",
            description: `You don't have ${requiredRole} privileges`,
            variant: "destructive",
          });
        }

        setIsAuthorized(hasRequiredRole);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An error occurred during verification",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [requiredRole, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  return <>{children}</>;
}
