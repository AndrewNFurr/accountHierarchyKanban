public with sharing class UserRoleController {
    public static UserWrapper getUsersUnderCurrentUserInHierarchy() {
        UserWrapper userWrapper = new UserWrapper();
        Id currentUserId = UserInfo.getUserId();
        
        // Get the current user's role
        User currentUser = [SELECT Id, Name, UserRoleId, UserRole.Name FROM User WHERE Id = :currentUserId LIMIT 1];
        userWrapper.currentUser = currentUser;
        
        if (currentUser.UserRoleId == null) {
            userWrapper.subordinateUsers = new List<User>();
            return userWrapper;
        }
        // Get all roles below the current user's role
        Set<Id> subordinateRoleIds = new Set<Id>();
        subordinateRoleIds = getSubordinateRoles(currentUser.UserRoleId, subordinateRoleIds);
        
        // Get all users in those subordinate roles
        List<User> subordinateUsers = new List<User>();
        for (User u : [SELECT Id, Name, UserRoleId, UserRole.Name FROM User WHERE UserRoleId IN :subordinateRoleIds AND IsActive = true]) {
            subordinateUsers.add(u);
        }
        System.debug('SubordinateUsers: ' + subordinateUsers);
        userWrapper.subordinateUsers = subordinateUsers;
        return userWrapper;
    }

    private static Set<Id> getSubordinateRoles(Id roleId, Set<Id> subordinateRoleIds) {
        // Query for direct child roles
        List<UserRole> childRoles = [SELECT Id FROM UserRole WHERE ParentRoleId = :roleId];
        
        for (UserRole role : childRoles) {
            subordinateRoleIds.add(role.Id);
            // Recursively get children of this role
            getSubordinateRoles(role.Id, subordinateRoleIds);
        }
        return subordinateRoleIds;
    }

    public class UserWrapper {
        @AuraEnabled
        public Map<Id, Account> accountMap;
        @AuraEnabled
        public User currentUser;
        @AuraEnabled
        public List<User> subordinateUsers;
    }
}