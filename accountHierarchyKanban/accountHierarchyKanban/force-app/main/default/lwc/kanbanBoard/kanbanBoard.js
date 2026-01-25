import { LightningElement, wire, track, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class KanbanBoard extends NavigationMixin(LightningElement) {
    _accountOwners = [];
    shownOwners = [];
    //@api filterList = [];
    @api currentUser;
    @api fieldMetadataMap = {};
    currentFilterList = [];

    @api
    get accountOwners() {
        return this._accountOwners;
    }

    set accountOwners(value) {
        this._accountOwners = value;
        this.shownOwners = structuredClone(value);
        if (this.currentFilterList && this.currentFilterList.length > 0) {
            this.setFilters(false);
        }
    }

    filterField;
    filterOperator;
    filterValue;
    filterValueOptions = [];
    filterOptions = [];
    inputType;
    isPicklistFilter = false;
    isBooleanFilter = false;

    _filterList = [];

    @api
    get filterList() {
        return this._filterList;
    }

    set filterList(value) {
        console.log('Setting filters - new value:', JSON.stringify(value));
        console.log('Setting filters - old value:', JSON.stringify(this._filterList));
        
        this._filterList = value;
        this.currentFilterList = structuredClone(this._filterList);
        console.log('About to call setFilters with currentFilterList:', JSON.stringify(this.currentFilterList));
        this.setFilters(false);
    }

    filterOperatorOptions = [
        { label: 'Equal To', value: 'equalTo', compatible: ['picklist', 'text', 'number', 'date', 'boolean']},
        { label: 'Contains', value: 'contains', compatible: ['text']},
        { label: 'Greater Than', value: 'greaterThan', compatible: ['number', 'date']},
        { label: 'Less Than', value: 'lessThan', compatible: ['number', 'date']},
        { label: 'Starts With', value: 'startsWith', compatible: ['text']},
        { label: 'Ends With', value: 'endsWith', compatible: ['text']},
        { label: 'Not Equal To', value: 'notEqualTo', compatible: ['picklist', 'text', 'number', 'date', 'boolean']},
        { label: 'Is Empty', value: 'isEmpty', compatible: ['picklist', 'text', 'number', 'date']}
    ];

    booleanValueOptions = [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' }
    ];

    shownFilterOperators = [];

    connectedCallback() {
        this.setFilterOptions();
    }

    setFilterOptions() {
        Object.keys(this.fieldMetadataMap).forEach(key => {
            this.filterOptions.push({ label: this.fieldMetadataMap[key].label, value: key });
        });
    }
    
    handleCardClick(event) {
        let accountId = event.currentTarget.dataset.id;
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: accountId,
                objectApiName: 'Account',
                actionName: 'view'
            }
        }).then(url => {
            window.open(url, '_blank');
        });
    }

    applyFilter() {
        let filterEntry = {
            id: this.createUUID(),
            field: this.filterField,
            operator: this.filterOperator,
            value: this.filterValue
        };
        this.currentFilterList.push(filterEntry);
        this.setFilters(true);
    }

    setFilters(applyingFilter) {
        console.log('In setting filters with currentFilterList: ', JSON.stringify(this.currentFilterList));
        try {
            this.shownOwners = this.shownOwners.map(ownerEntry => {
                let filteredAccounts = structuredClone(ownerEntry.accounts);
                //No filters, show all accounts
                if (this.currentFilterList && this.currentFilterList.length > 0) {
                    this.currentFilterList.forEach(filter => {
                        filteredAccounts = filteredAccounts.filter(account => {
                            return this.applyFilterOperator(account, filter.field, filter.operator, filter.value);
                        });
                    });
                }
                return {
                    ...ownerEntry,
                    filteredAccounts: filteredAccounts
                };
            });
            if (applyingFilter) {
                this.dispatchEvent(new CustomEvent('filterapplied', { detail: structuredClone(this.currentFilterList) }));
                this.clearValues();
            }

        } catch (error) {
            console.error('Error applying filter:', error);
        }
    }

    applyFilterOperator(account, field, operator, value) {
        console.log(`Applying filter on field: ${field}, operator: ${operator}, value: ${value} for account: ${account.Id}`);
        let accountValue = account[field];
        console.log('account: ', JSON.stringify(account));
        if (accountValue === null || accountValue === undefined) {
            return operator === 'isEmpty';
        }
        
        let accountValueStr = String(accountValue).toLowerCase();
        let filterValueStr = String(value).toLowerCase();
        console.log('accountValueStr: ', accountValueStr);
        console.log('filterValueStr: ', filterValueStr);
        
        switch(operator) {
            case 'equalTo':
                return accountValueStr === filterValueStr;
            case 'contains':
                return accountValueStr.includes(filterValueStr);
            case 'greaterThan':
                return Number(accountValue) > Number(value);
            case 'lessThan':
                return Number(accountValue) < Number(value);
            case 'startsWith':
                return accountValueStr.startsWith(filterValueStr);
            case 'endsWith':
                return accountValueStr.endsWith(filterValueStr);
            case 'notEqualTo':
                return accountValueStr !== filterValueStr;
            case 'isEmpty':
                return accountValue === null || accountValue === undefined || accountValue === '';
            default:
                return true;
        }
    }

    handleFilterFieldChange(event) {
        this.isBooleanFilter = false;
        this.isPicklistFilter = false;

        this.filterField = event.detail.value;
        let filterFieldEntry = this.fieldMetadataMap[this.filterField];
        this.isPicklistFilter = filterFieldEntry.picklistOptions && filterFieldEntry.picklistOptions.length > 0;
        if (this.isPicklistFilter) {
            this.filterValueOptions = filterFieldEntry.picklistOptions;
            this.inputType = 'picklist';
        } else {
            let fieldType = filterFieldEntry.fieldType.toUpperCase();
            
            // Map Salesforce field types to lightning-input types
            // Boolean/Checkbox
            if (fieldType === 'BOOLEAN') {
                this.isBooleanFilter = true;
                this.inputType = 'boolean';
            }
            // Numeric Types
            else if (fieldType === 'CURRENCY' || fieldType === 'DOUBLE' || 
                     fieldType === 'INTEGER' || fieldType === 'PERCENT') {
                this.inputType = 'number';
            }
            // Date/Time Types
            else if (fieldType === 'DATE') {
                this.inputType = 'date';
            } else if (fieldType === 'DATETIME') {
                this.inputType = 'datetime';
            } else if (fieldType === 'TIME') {
                this.inputType = 'time';
            }
            // Text/String Types - all default to text
            else if (fieldType === 'ANYTYPE' || fieldType === 'EMAIL' || 
                     fieldType === 'ENCRYPTEDSTRING' || fieldType === 'ID' || 
                     fieldType === 'MULTIPICKLIST' || fieldType === 'PHONE' || 
                     fieldType === 'PICKLIST' || fieldType === 'REFERENCE' || 
                     fieldType === 'STRING' || fieldType === 'TEXTAREA' || 
                     fieldType === 'URL' || fieldType === 'COMBOBOX' ||
                     fieldType === 'DATACATEGORYGROUPREFERENCE') {
                this.inputType = 'text';
            }
            // Special Types - default to text
            else if (fieldType === 'ADDRESS' || fieldType === 'BASE64' || 
                     fieldType === 'LOCATION') {
                this.inputType = 'text';
            }
            // Fallback for any unmapped types
            else {
                this.inputType = 'text';
            }
        }
        console.log('inputType: ', this.inputType);
        console.log('filterOperators: ', this.filterOperatorOptions);
        this.shownFilterOperators = this.filterOperatorOptions.filter(operator =>
            operator.compatible.includes(this.inputType)
        );
    }

    handleFilterOperatorChange(event) {
        this.filterOperator = event.detail.value;

    }

    handleFilterValueChange(event) {
        this.filterValue = event.detail.value;
    }
    
    clearValues() {
        this.filterField = '';
        this.filterOperator = '';
        this.filterValue = '';
        this.filterValueOptions = {};
        this.inputType = '';
        this.isPicklistFilter = false;
    }

    createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}