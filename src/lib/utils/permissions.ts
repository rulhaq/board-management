export type Permission = 
  | 'documents.read' 
  | 'documents.create' 
  | 'documents.edit' 
  | 'documents.delete'
  | 'meetings.read' 
  | 'meetings.create' 
  | 'meetings.edit' 
  | 'meetings.delete'
  | 'users.read' 
  | 'users.create' 
  | 'users.edit' 
  | 'users.delete'
  | 'reports.read' 
  | 'reports.create'
  | 'votes.cast' 
  | 'votes.create'
  | 'admin.*'
  | '*';

export type Role = 'admin' | 'board_member' | 'secretary' | 'viewer';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['*'], // Admin has all permissions
  
  board_member: [
    'documents.read',
    'meetings.read',
    'votes.cast',
    'reports.read'
  ],
  
  secretary: [
    'documents.read',
    'documents.create',
    'documents.edit',
    'meetings.read',
    'meetings.create',
    'meetings.edit',
    'votes.create',
    'reports.read',
    'reports.create'
  ],
  
  viewer: [
    'documents.read',
    'meetings.read',
    'reports.read'
  ]
};

export const hasPermission = (userRole: Role, userPermissions: Permission[], requiredPermission: Permission): boolean => {
  // Admin has all permissions
  if (userRole === 'admin' || userPermissions.includes('*')) {
    return true;
  }
  
  // Check specific permission
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check wildcard permissions
  const [category] = requiredPermission.split('.');
  if (userPermissions.includes(`${category}.*` as Permission)) {
    return true;
  }
  
  return false;
};

export const canAccessDocument = (
  userRole: Role, 
  userPermissions: Permission[], 
  documentAccessList: string[], 
  userId: string,
  confidentialityLevel: string
): boolean => {
  // Admin can access all documents
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if user is in document access list
  if (!documentAccessList.includes(userId)) {
    return false;
  }
  
  // Check if user has read permission
  if (!hasPermission(userRole, userPermissions, 'documents.read')) {
    return false;
  }
  
  // Additional confidentiality checks
  switch (confidentialityLevel) {
    case 'top-secret':
      return userRole === 'admin' || userRole === 'board_member';
    case 'restricted':
      return userRole === 'admin' || userRole === 'board_member' || userRole === 'secretary';
    case 'confidential':
      return true; // All authenticated users with access
    case 'public':
      return true;
    default:
      return false;
  }
};

export const canJoinMeeting = (
  userRole: Role, 
  meetingAttendees: string[], 
  userId: string,
  organizerId: string
): boolean => {
  // Admin can join all meetings
  if (userRole === 'admin') {
    return true;
  }
  
  // Organizer can join their own meetings
  if (userId === organizerId) {
    return true;
  }
  
  // Check if user is in attendees list
  return meetingAttendees.includes(userId);
};

export const canCastVote = (
  userRole: Role, 
  userPermissions: Permission[], 
  meetingAttendees: string[], 
  userId: string
): boolean => {
  // Must have voting permission
  if (!hasPermission(userRole, userPermissions, 'votes.cast')) {
    return false;
  }
  
  // Must be meeting attendee or admin
  return meetingAttendees.includes(userId) || userRole === 'admin';
};

export const canCreateMeeting = (userRole: Role, userPermissions: Permission[]): boolean => {
  return hasPermission(userRole, userPermissions, 'meetings.create');
};

export const canUploadDocument = (userRole: Role, userPermissions: Permission[]): boolean => {
  return hasPermission(userRole, userPermissions, 'documents.create');
};

export const canViewReports = (userRole: Role, userPermissions: Permission[]): boolean => {
  return hasPermission(userRole, userPermissions, 'reports.read');
};

export const canManageUsers = (userRole: Role, userPermissions: Permission[]): boolean => {
  return hasPermission(userRole, userPermissions, 'users.create') || userRole === 'admin';
};

export const getMaxConfidentialityLevel = (userRole: Role): string[] => {
  switch (userRole) {
    case 'admin':
      return ['public', 'confidential', 'restricted', 'top-secret'];
    case 'board_member':
      return ['public', 'confidential', 'restricted', 'top-secret'];
    case 'secretary':
      return ['public', 'confidential', 'restricted'];
    case 'viewer':
      return ['public', 'confidential'];
    default:
      return ['public'];
  }
}; 