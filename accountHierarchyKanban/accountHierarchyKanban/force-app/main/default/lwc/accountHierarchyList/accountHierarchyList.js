import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/showToastEvent';
import getAccounts from '@salesforce/apex/AccountHierarchyListController.getAccounts';
import { reduceErrors } from '.c/ldsUtils';

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
            this.accountMap = result.accountMap;
            this.currentUser = result.currentUser;
            this.subordinateUsers = result.subordinateUsers;
            this.fieldMetadataList = result.fieldMetadataList;
            this.createOwnerObjects();
            this.processFields();
        })
        .catch(error) {
             const errorMessages = reduceErrors(error);
             this.showErrorToastMessage(errorMessages);
        };
    }

    createOwnerObjects() {
        //Handle current User separately in case something unique wants to be done with them.
        let currentUserAccounts = this.accountMap[this.currentUser.Id];
        this.ownersWithAccounts.push({
            owner: this.currentUser,
            accounts: currentUserAccounts,
            hasAccounts: currentUserAccounts && currentUserAccounts.length > 0,
            filteredAccounts: structuredClone(currentUserAccounts)
        });
        this.subordinateUsers.forEach((user) => {
            let userAccounts = this.accountMap[user.Id];
            this.ownersWithAccounts.push({
                owner: user,
                accounts: userAccounts,
                hasAccounts: userAccounts && userAccounts.length > 0,
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
        console.log('filterApplied', JSON.stringify(event.detail));
        this.filterList = [...event.detail];
    }

    handleFilterRemoved(event) {
        console.log('filterRemoved', JSON.stringify(event.detail));
        let removedFilter = event.detail;
        this.filterList = this.filterList.filter(filter => {
            return filter.id !== removedFilter.id;
        });
    }

    showErrorToastMessage(errors) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error Messages',
                message: errors.join(', '),
                variant: 'error',
                mode: 'sticky'
            })
        );
    }
}