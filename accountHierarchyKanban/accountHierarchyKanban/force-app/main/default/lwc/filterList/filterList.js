import { LightningElement, api, wire } from 'lwc';

export default class FilterList extends LightningElement {

    _filterList = [];
    selectedList = [];
    hasFilters = false;
    showCombinationButtons = false;

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
        let removedFilter = this._filterList.find(filter => filter.id === filterId);
        this.hasFilters = this._filterList.length - 1 > 0;
        this.dispatchEvent(new CustomEvent('filterremoved', { detail: removedFilter }));
    }  
    
    handleEntryClick(event) {
        const filterId = event.currentTarget.dataset.id;
        console.log('Filter clicked with id:', filterId);
        
        // Create new array with updated selected state to trigger reactivity
        this._filterList = this._filterList.map(filter => {
            if (filter.id === filterId) {
                const isCurrentlySelected = filter.selected === true;
                return {
                    ...filter,
                    selected: !isCurrentlySelected
                };
            }
            return filter;
        });
        
        // Update selectedList based on new state
        let selectedFilter = this._filterList.find(filter => filter.id === filterId);
        if (selectedFilter.selected) {
            this.selectedList.push(selectedFilter);
        } else {
            this.selectedList = this.selectedList.filter(filter => filter.id !== filterId);
        }
        
        // Show combination buttons if 2 or more filters are selected
        this.showCombinationButtons = this.selectedList.length >= 2;
    }
}