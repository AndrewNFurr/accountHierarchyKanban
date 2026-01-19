import { LightningElement, wire, track, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';

export default class KanbanBoard extends NavigationMixin(LightningElement) {
    @api accountOwners = [];
    @api filterList = [];
    @api currentUser;

    filterField;
    filterOperator;
    filterValue;
    filterValueOptions;
    inputType;
    isPicklistFilter;

    filterOperatorOptions = [
        { label: 'Equal To', value: 'equalTo', compatible: 'any'},
        { label: 'Contains', value: 'contains', compatible: 'text'},
        { label: 'Greater Than', value: 'greaterThan', compatible: 'number'},
        { label: 'Less Than', value: 'lessThan', compatible: 'number'},
        { label: 'Starts With', value: 'startsWith', compatible: 'text'},
        { label: 'Ends With', value: 'endsWith', compatible: 'text'},
        { label: 'Not Equal To', value: 'notEqualTo', compatible: 'any'},
        { label: 'Is Empty', value: 'isEmpty', compatible: 'any'}
    ]
    
    handleCardClick(event) {
        let accountId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: accountId,
                objectApiName: 'Account',
                actionName: 'view',
                target: '_target'
            }
        });
    }

    applyFilter() {
        this.filterList = this.filterList.filter(filter => filter.value !== '');
    }

    handleFilterFieldChange(event) {
        this.filterField = event.detail.value;
    }

    handleFilterOperatorChange(event) {
        this.filterOperator = event.detail.value;

    }

    handleFilterValueChange(event) {
        this.filterValue = event.detail.value;
    }
}