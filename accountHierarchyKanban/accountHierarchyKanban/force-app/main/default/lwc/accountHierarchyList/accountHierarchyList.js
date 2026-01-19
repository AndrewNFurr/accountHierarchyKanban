import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getAccounts from '@salesforce/apex/AccountHierarchyListController.getAccounts';

export default class AccountHierarchyList extends NavigationMixin(LightningElement) {

    @track shownAccounts = []
    accountMap = {};
    currentUser;
    subordinateUsers = [];
    ownersWithAccounts = [];
    fieldMetadataList = [];
    fieldMetadataMap = {};
    showKanban = true;
    dataProcessed = false;

    @api filterList = [];

    constructor() {
        super();
        getAccounts().then(result => {
            console.log('result: ' + structuredClone(result));
            this.accountMap = result.accountMap;
            console.log('accountMap: ' + structuredClone(this.accountMap));
            this.currentUser = result.currentUser;
            console.log('currentUser: ' + structuredClone(this.currentUser));
            this.subordinateUsers = result.subordinateUsers;
            console.log('subordinateUsers: ' + structuredClone(this.subordinateUsers));
            this.fieldMetadataList = result.fieldMetadataList;
            console.log('fieldMetadataList: ' + JSON.stringify(this.fieldMetadataList));
            this.createOwnerObjects();
            this.processFields();
        });
    }

    createOwnerObjects() {
        //Handle current User separately in case something unique wants to be done with them.
        let currentUserAccounts = this.accountMap[this.currentUser.Id];
        this.ownersWithAccounts.push({
            owner: this.currentUser,
            accounts: currentUserAccounts,
            filteredAccounts: []
        });
        this.subordinateUsers.forEach((user) => {
            let userAccounts = this.accountMap[user.Id];
            this.ownersWithAccounts.push({
                owner: user,
                accounts: userAccounts,
                filteredAccounts: structuredClone(userAccounts)
            });
        });

        console.log('Owners with Account: ', JSON.stringify(this.ownersWithAccounts));
    }

    processFields() {
        this.fieldMetadataList.forEach((field) => {
            this.fieldMetadataMap[field.apiName] = field;
        });
        console.log('fieldMetadataMap: ' + JSON.stringify(this.fieldMetadataMap));
        this.dataProcessed = true;
    }

    handleFilterApplied(event) {
        this.filterList = event.detail.filterList;
    }
}