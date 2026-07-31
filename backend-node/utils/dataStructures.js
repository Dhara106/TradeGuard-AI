/**
 * Data Structures Utility for TradeGuard AI
 * Used to satisfy college requirements for Data Structures (CSE-DS Sem 4)
 */

/**
 * 1. PRIORITY QUEUE (Max-Heap implementation)
 * Used to rank shipments by risk score. The shipment with the highest risk score
 * is kept at the top of the queue for priority auditing.
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Helper methods to get parent, left child, and right child indices
  getParentIndex(index) { return Math.floor((index - 1) / 2); }
  getLeftChildIndex(index) { return 2 * index + 1; }
  getRightChildIndex(index) { return 2 * index + 2; }

  // Swap two elements in the heap
  swap(index1, index2) {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  // Insert a new item with a priority (risk score)
  insert(item, priority) {
    const node = { item, priority };
    this.heap.push(node);
    this.heapifyUp();
  }

  // Maintain heap property after insertion
  heapifyUp() {
    let index = this.heap.length - 1;
    while (
      index > 0 && 
      this.heap[this.getParentIndex(index)].priority < this.heap[index].priority
    ) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  // Remove and return the item with the highest priority (highest risk score)
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop().item;

    const max = this.heap[0].item;
    this.heap[0] = this.heap.pop();
    this.heapifyDown();
    return max;
  }

  // Maintain heap property after extracting the maximum element
  heapifyDown() {
    let index = 0;
    while (this.getLeftChildIndex(index) < this.heap.length) {
      let largerChildIndex = this.getLeftChildIndex(index);
      const rightChildIndex = this.getRightChildIndex(index);

      if (
        rightChildIndex < this.heap.length && 
        this.heap[rightChildIndex].priority > this.heap[largerChildIndex].priority
      ) {
        largerChildIndex = rightChildIndex;
      }

      if (this.heap[index].priority >= this.heap[largerChildIndex].priority) {
        break;
      }

      this.swap(index, largerChildIndex);
      index = largerChildIndex;
    }
  }

  // See the highest priority item without removing it
  peek() {
    return this.heap.length > 0 ? this.heap[0].item : null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

/**
 * 2. HASH MAP (Custom implementation with Chaining for Collision Resolution)
 * Used to cache predictions. Caching saves server load by avoiding calling
 * the Django ML microservice for the exact same input features multiple times.
 */
class HashMap {
  constructor(size = 53) { // Prime number for better distribution
    this.keyMap = new Array(size);
  }

  // Simple hash function
  _hash(key) {
    let total = 0;
    const WEIRD_PRIME = 31;
    for (let i = 0; i < Math.min(key.length, 100); i++) {
      const char = key[i];
      const value = char.charCodeAt(0) - 96;
      total = (total * WEIRD_PRIME + value) % this.keyMap.length;
    }
    return Math.abs(total);
  }

  // Set key-value pair
  set(key, value) {
    const index = this._hash(key);
    if (!this.keyMap[index]) {
      this.keyMap[index] = [];
    }
    // Check if key already exists, update it
    for (let i = 0; i < this.keyMap[index].length; i++) {
      if (this.keyMap[index][i][0] === key) {
        this.keyMap[index][i][1] = value;
        return;
      }
    }
    this.keyMap[index].push([key, value]);
  }

  // Get value by key
  get(key) {
    const index = this._hash(key);
    if (this.keyMap[index]) {
      for (let i = 0; i < this.keyMap[index].length; i++) {
        if (this.keyMap[index][i][0] === key) {
          return this.keyMap[index][i][1];
        }
      }
    }
    return undefined;
  }

  // Check if key exists
  has(key) {
    return this.get(key) !== undefined;
  }

  // Delete key-value pair
  delete(key) {
    const index = this._hash(key);
    if (this.keyMap[index]) {
      for (let i = 0; i < this.keyMap[index].length; i++) {
        if (this.keyMap[index][i][0] === key) {
          this.keyMap[index].splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * 3. MERGE SORT (Recursive Divide & Conquer)
 * Used to sort shipments by riskScore, weight, distance, or date.
 * Offers O(N log N) time complexity, which is optimal for sorting.
 */
function mergeSort(arr, key, order = 'desc') {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), key, order);
  const right = mergeSort(arr.slice(mid), key, order);

  return merge(left, right, key, order);
}

function merge(left, right, key, order) {
  let result = [];
  let lIndex = 0;
  let rIndex = 0;

  while (lIndex < left.length && rIndex < right.length) {
    let comparison = false;
    
    // Support nested keys
    const getVal = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
    
    const valL = key.includes('.') ? getVal(left[lIndex], key) : left[lIndex][key];
    const valR = key.includes('.') ? getVal(right[rIndex], key) : right[rIndex][key];

    if (order === 'asc') {
      comparison = valL < valR;
    } else { // desc
      comparison = valL > valR;
    }

    if (comparison) {
      result.push(left[lIndex]);
      lIndex++;
    } else {
      result.push(right[rIndex]);
      rIndex++;
    }
  }

  return result.concat(left.slice(lIndex)).concat(right.slice(rIndex));
}

/**
 * 4. BINARY SEARCH (Divide & Conquer Search)
 * Used to search for a shipment with a specific threshold value in a sorted list.
 * Run-time complexity is O(log N).
 */
function binarySearch(sortedArr, targetVal, key) {
  let start = 0;
  let end = sortedArr.length - 1;

  const getVal = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    const midVal = key.includes('.') ? getVal(sortedArr[mid], key) : sortedArr[mid][key];

    if (midVal === targetVal) {
      return sortedArr[mid];
    } else if (midVal < targetVal) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  return null; // Not found
}

module.exports = {
  PriorityQueue,
  HashMap,
  mergeSort,
  binarySearch
};
