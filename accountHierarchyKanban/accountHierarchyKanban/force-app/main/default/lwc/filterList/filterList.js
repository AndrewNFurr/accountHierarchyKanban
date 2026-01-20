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
        console.log('Removing filter with id:', filterId);
        let removedFilter = this._filterList.find(filter => filter.id === filterId);
        console.log('Removed filter details:', removedFilter);
        this.hasFilters = this._filterList.length - 1 > 0;
        this.dispatchEvent(new CustomEvent('filterremoved', { detail: removedFilter }));
    }   
}