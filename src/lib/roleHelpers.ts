import { supabase } from "@/integrations/supabase/client";

export const getUserRoles = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  
  if (error) throw error;
  return data.map(r => r.role);
};

export const hasRole = async (userId: string, role: string): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
};

export const addRole = async (userId: string, role: string) => {
  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, role: role as any },
      { onConflict: "user_id,role" }
    );
  
  if (error) throw error;
};

export const isDriverOwner = async (userId: string): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes('driver') && roles.includes('owner');
};

export const getPrimaryRole = (roles: string[]): string => {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('driver')) return 'driver';
  if (roles.includes('owner')) return 'owner';
  if (roles.includes('client_corporate')) return 'client_corporate';
  if (roles.includes('client_individual')) return 'client_individual';
  return roles[0] || 'client_individual';
};
