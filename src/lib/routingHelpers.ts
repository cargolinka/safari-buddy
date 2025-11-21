export const getDefaultRoute = (roles: string[]): string => {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('driver')) return '/driver/dashboard';
  if (roles.includes('owner')) return '/owner/dashboard';
  if (roles.includes('client_corporate') || roles.includes('client_individual')) {
    return '/vehicles';
  }
  return '/dashboard';
};

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: 'Admin Portal',
    driver: 'Driver Portal',
    owner: 'Owner Portal',
    client_corporate: 'Client Portal',
    client_individual: 'Client Portal'
  };
  return labels[role] || 'Portal';
};

export const getRoleIcon = (role: string): string => {
  const icons: Record<string, string> = {
    admin: '⚙️',
    driver: '🚗',
    owner: '🏢',
    client_corporate: '👔',
    client_individual: '👤'
  };
  return icons[role] || '👤';
};
