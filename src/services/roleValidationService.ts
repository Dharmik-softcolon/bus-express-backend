import { User } from '../models/User';
import { USER_ROLES, ROLE_HIERARCHY, ROLE_LIMITS } from '../constants';

export class RoleValidationService {
  /**
   * Check if a user can create another user with the specified role
   */
  static async canCreateRole(creatorId: string, targetRole: string): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      const creator = await User.findById(creatorId);
      if (!creator) {
        return { canCreate: false, reason: 'Creator user not found' };
      }

      // Check if the creator can create this role according to hierarchy
      const allowedRoles = ROLE_HIERARCHY[creator.role];
      if (!allowedRoles || !allowedRoles.includes(targetRole)) {
        return { canCreate: false, reason: `${creator.role} cannot create ${targetRole}` };
      }

      // Check role limits
      if (targetRole === USER_ROLES.MASTER_ADMIN) {
        const existingMasterAdmin = await User.findOne({ role: USER_ROLES.MASTER_ADMIN });
        if (existingMasterAdmin) {
          return { canCreate: false, reason: 'Only one MASTER_ADMIN is allowed' };
        }
      }

      if (targetRole === USER_ROLES.BUS_ADMIN) {
        // Check if creator is BUS_OWNER and has reached the limit
        if (creator.role === USER_ROLES.BUS_OWNER) {
          const existingBusAdmins = await User.countDocuments({ 
            role: USER_ROLES.BUS_ADMIN, 
            createdBy: creatorId 
          });
          if (existingBusAdmins >= ROLE_LIMITS[USER_ROLES.BUS_ADMIN]) {
            return { canCreate: false, reason: 'BUS_OWNER can only create 2 BUS_ADMIN users' };
          }
        }
      }

      return { canCreate: true };
    } catch (error) {
      return { canCreate: false, reason: 'Error validating role creation' };
    }
  }

  /**
   * Get all roles that a user can create
   */
  static getCreatableRoles(userRole: string): string[] {
    return ROLE_HIERARCHY[userRole] || [];
  }

  /**
   * Check if a role has subroles
   */
  static hasSubroles(role: string): boolean {
    return role === USER_ROLES.BUS_EMPLOYEE;
  }

  /**
   * Get subroles for a given role
   */
  static getSubroles(role: string): string[] {
    if (role === USER_ROLES.BUS_EMPLOYEE) {
      return ['DRIVER', 'HELPER'];
    }
    return [];
  }

  /**
   * Validate if a subrole is valid for a given role
   */
  static isValidSubrole(role: string, subrole: string): boolean {
    const validSubroles = this.getSubroles(role);
    return validSubroles.includes(subrole);
  }

  /**
   * Get role hierarchy information
   */
  static getRoleHierarchy() {
    return ROLE_HIERARCHY;
  }

  /**
   * Get role limits
   */
  static getRoleLimits() {
    return ROLE_LIMITS;
  }
}
