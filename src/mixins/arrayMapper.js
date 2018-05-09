import {arrayReduce, arrayMap, arrayMax} from './../helpers/array';
import {defineGetter} from './../helpers/object';
import {rangeEach} from './../helpers/number';

const MIXIN_NAME = 'arrayMapper';

/**
 * @type {Object}
 */
const arrayMapper = {
  /**
   * Array is storing indexes in the below form:
   *
   * VISUAL_INDEX¹ => PHYSICAL_INDEX²
   *
   * It maps from visible row / column to its representation in the data source. For example, when we sorted data, our 1st visible row can represent 4th row from the original data,
   * 2nd can be mapped to 3rd, 3rd to 2nd, etc. (keep in mind that array is indexed from the zero).
   *
   * ¹ internally stored as array index; from 0 to n, where n is number of visible cells in the axis
   * ² internally stored as array value, contains some indexes (just for not hidden / not trimmed cells) from data source
   *
   */
  _arrayMap: [],

  /**
   * Get physical index by its visual index.
   *
   * @param {Number} visualIndex Visual index.
   * @return {Number|null} Returns translated index mapped by passed visual index.
   */
  getValueByIndex(visualIndex) {
    const length = this._arrayMap.length;
    let physicalIndex = null;

    if (visualIndex < length) {
      physicalIndex = this._arrayMap[visualIndex];
    }

    return physicalIndex;
  },

  /**
   * Get visual index by its physical index.
   *
   * @param {*} physicalIndex Physical index to search.
   * @returns {Number|null} Returns a visual index of the index mapper.
   */
  getIndexByValue(physicalIndex) {
    let visualIndex = null;

    if (this._arrayMap.includes(physicalIndex)) {
      visualIndex = this._arrayMap.indexOf(physicalIndex);
    }

    return visualIndex;
  },

  /**
   * Insert new items to index mapper starting at passed index. New entries will be a continuation of last value in the array.
   *
   * @param {Number} visualIndex Visual index
   * @param {Number} [amount=1] Defines how many items will be added to index mapper.
   * @returns {Array} Returns added items.
   */
  insertItems(visualIndex, amount = 1) {
    let newIndex = arrayMax(this._arrayMap) + 1;
    let addedItems = [];

    rangeEach(amount - 1, (count) => {
      addedItems.push(this._arrayMap.splice(visualIndex + count, 0, newIndex + count));
    });

    return addedItems;
  },

  /**
   * Remove items from index mapper.
   *
   * @param {Number} visualIndex Visual index
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   * @returns {Array} Returns removed items.
   */
  removeItems(visualIndex, amount = 1) {
    let removedItems = [];

    if (Array.isArray(visualIndex)) {
      let mapCopy = [].concat(this._arrayMap);

      // Sort descending
      visualIndex.sort((a, b) => b - a);

      removedItems = arrayReduce(visualIndex, (acc, item) => {
        this._arrayMap.splice(item, 1);

        return acc.concat(mapCopy.slice(item, item + 1));
      }, []);

    } else {
      removedItems = this._arrayMap.splice(visualIndex, amount);
    }

    return removedItems;
  },

  /**
   * Unshift items (remove and shift chunk of array to the left).
   *
   * @param {Number|Array} itemIndex Visual index or Array of visual indexes to unshift.
   * @param {Number} [amount=1] Defines how many items will be removed from an array (when index is passed as number).
   */
  unshiftItems(itemIndex, amount = 1) {
    let removedItems = this.removeItems(itemIndex, amount);

    function countIndexShift(index) {
      // Todo: compare perf between reduce vs sort->each->brake
      return arrayReduce(removedItems, (count, removedIndex) => {
        if (index > removedIndex) {
          count += 1;
        }

        return count;
      }, 0);
    }

    this._arrayMap = arrayMap(this._arrayMap, (visualIndex) => {
      let indexShift = countIndexShift(visualIndex);

      if (indexShift) {
        visualIndex -= indexShift;
      }

      return visualIndex;
    });
  },

  /**
   * Shift (right shifting) items starting at passed index.
   *
   * @param {Number} itemIndex Visual index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   */
  shiftItems(itemIndex, amount = 1) {
    this._arrayMap = arrayMap(this._arrayMap, (visualIndex) => {
      if (visualIndex >= itemIndex) {
        visualIndex += amount;
      }

      return visualIndex;
    });

    rangeEach(amount - 1, (count) => {
      this._arrayMap.splice(itemIndex + count, 0, itemIndex + count);
    });
  },

  /**
   * Swap indexes in arrayMapper.
   *
   * @param {Number} visualIndexFrom index to move.
   * @param {Number} visualIndexTo index to.
   */
  swapIndexes(visualIndexFrom, visualIndexTo) {
    this._arrayMap.splice(visualIndexTo, 0, ...this._arrayMap.splice(visualIndexFrom, 1));
  },

  /**
   * Clear all stored index<->value information from an array.
   */
  clearMap() {
    this._arrayMap.length = 0;
  }
};

defineGetter(arrayMapper, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default arrayMapper;
