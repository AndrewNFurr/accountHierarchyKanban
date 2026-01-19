public with sharing class AccountHierarchyListController {
    
    @AuraEnabled(cacheable=true)
    public static AccountWrapper getAccounts() {
        AccountWrapper accountWrapper = new AccountWrapper();
        Map<Id, List<Account>> accountMap = new Map<Id, List<Account>>();
        
        UserRoleController.UserWrapper userWrapper = UserRoleController.getUsersUnderCurrentUserInHierarchy();
        User currentUser = userWrapper.currentUser;
        List<User> subordinateUsers = userWrapper.subordinateUsers;

        Set<Id> userIds = new Set<Id>{currentUser.Id};
        for (User u : subordinateUsers) {
            userIds.add(u.Id);
        }

        // Pre-populate map with empty lists for all userIds to avoid containsKey checks
        for(Id userId : userIds) {
            accountMap.put(userId, new List<Account>());
        }

        // Query and populate
        for(Account a : [
            SELECT Id, Name, OwnerId, Industry__c, CreatedDate 
            FROM Account 
            WHERE OwnerId IN :userIds
        ]) {
            accountMap.get(a.OwnerId).add(a);
        }
        System.debug('AccountMap: ' + accountMap);
        accountWrapper.accountMap = accountMap;
        accountWrapper.currentUser = currentUser;
        accountWrapper.subordinateUsers = subordinateUsers;
        return accountWrapper;
    }

    public class AccountWrapper {
        @AuraEnabled
        public Map<Id, List<Account>> accountMap;
        @AuraEnabled
        public User currentUser;
        @AuraEnabled
        public List<User> subordinateUsers;
    }

}