import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { getRoleLabel, getRoleIcon, getDefaultRoute } from "@/lib/routingHelpers";

interface RoleSwitcherProps {
  roles: string[];
  currentRole: string;
}

export const RoleSwitcher = ({ roles, currentRole }: RoleSwitcherProps) => {
  const navigate = useNavigate();

  if (roles.length <= 1) return null;

  const handleRoleSwitch = (role: string) => {
    const route = getDefaultRoute([role]);
    navigate(route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>{getRoleIcon(currentRole)}</span>
          <span>{getRoleLabel(currentRole)}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleSwitch(role)}
            className={currentRole === role ? 'bg-accent' : ''}
          >
            <span className="mr-2">{getRoleIcon(role)}</span>
            <span>{getRoleLabel(role)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
