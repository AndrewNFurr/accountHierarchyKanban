import { LightningElement, api, wire } from 'lwc';

export default class FilterList extends LightningElement {

    _filterList = [];
    hasFilters = false;

    @api
    get filterList() {
        return this._filterList;
    }

    set filterList(value) {
        console.log('setting filterlist');
        this._filterList = value;
        this.handleFilterListChange();
    }

    handleFilterListChange() {
        console.log('Filter list updated:', this._filterList);
        this.hasFilters = this._filterList.length > 0;
    }

    handleRemoveFilter(event) {
        const filterId = event.currentTarget.dataset.id;
        this._filterList = this._filterList.filter(filter => filter.id !== filterId);
        this.hasFilters = this._filterList.length > 0;
        this.dispatchEvent(new CustomEvent('filterremoved', { detail: this._filterList }));
    }   
}