public with sharing class AccountHierarchyListController {
    //ConnectApi.RecordUi.getPicklistValuesByRecordType('Opportunity', recordTypeId);
    
    @AuraEnabled(cacheable=true)
    public static List<FieldMetadata> getAccountFields() {
        List<FieldMetadata> fieldMetadataList = new List<FieldMetadata>();
        
        Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Account.fields.getMap();
        
        for(String fieldName : fieldMap.keySet()) {
            Schema.SObjectField field = fieldMap.get(fieldName);
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            
            FieldMetadata fieldMeta = new FieldMetadata();
            fieldMeta.label = fieldDescribe.getLabel();
            fieldMeta.apiName = fieldDescribe.getName();
            fieldMeta.fieldType = String.valueOf(fieldDescribe.getType());
            
            if(fieldDescribe.getType() == Schema.DisplayType.PICKLIST || 
               fieldDescribe.getType() == Schema.DisplayType.MULTIPICKLIST) {
                List<PicklistOption> options = new List<PicklistOption>();
                for(Schema.PicklistEntry entry : fieldDescribe.getPicklistValues()) {
                    if(entry.isActive()) {
                        PicklistOption option = new PicklistOption();
                        option.label = entry.getLabel();
                        option.value = entry.getValue();
                        options.add(option);
                    }
                }
                fieldMeta.picklistOptions = options;
            }
            
            fieldMetadataList.add(fieldMeta);
        }
        
        return fieldMetadataList;
    }

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

        // Get field metadata
        List<FieldMetadata> fieldMetadataList = getAccountFields();
        
        // Build dynamic SOQL with all queryable fields
        Set<String> fieldNames = new Set<String>();
        Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Account.fields.getMap();
        for(String fieldName : fieldMap.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
            if(fieldDescribe.isAccessible()) {
                fieldNames.add(fieldDescribe.getName());
            }
        }
        
        String queryString = 'SELECT ' + String.join(new List<String>(fieldNames), ', ') + 
                           ' FROM Account WHERE OwnerId IN :userIds';
        
        // Query and populate
        for(Account a : Database.query(queryString)) {
            accountMap.get(a.OwnerId).add(a);
        }
        
        System.debug('AccountMap: ' + accountMap);
        accountWrapper.accountMap = accountMap;
        accountWrapper.currentUser = currentUser;
        accountWrapper.subordinateUsers = subordinateUsers;
        accountWrapper.fieldMetadataList = fieldMetadataList;
        return accountWrapper;
    }

    public class AccountWrapper {
        @AuraEnabled
        public Map<Id, List<Account>> accountMap { get; set; }
        @AuraEnabled
        public User currentUser { get; set; }
        @AuraEnabled
        public List<User> subordinateUsers { get; set; }
        @AuraEnabled
        public List<FieldMetadata> fieldMetadataList { get; set; }
    }

    public class FieldMetadata {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String apiName { get; set; }       
        @AuraEnabled
        public String fieldType { get; set; } 
        @AuraEnabled
        public List<PicklistOption> picklistOptions { get; set; }
    }

    public class PicklistOption {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }
    }


}