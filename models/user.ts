export type UserRole = 'Administrator' | 'GIS Analyst' | 'Field Officer' | 'Viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency: string;
}
