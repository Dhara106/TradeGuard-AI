"""
TradeGuard AI - Data Structures Module
========================================
This module implements fundamental data structures and algorithms from scratch.
These are used throughout the application for efficient data processing.

Data Structures Implemented:
1. PriorityQueue  - Using heapq (min-heap) for ranking shipments by risk
2. HashMap        - Custom hash map for caching predictions
3. merge_sort()   - Divide-and-conquer sorting algorithm
4. binary_search() - Efficient searching in sorted arrays

WHY WE IMPLEMENT THESE:
- PriorityQueue: Quickly find the highest-risk shipments without sorting everything
- HashMap: Cache predictions so we don't re-compute for identical inputs
- merge_sort: Efficient O(n log n) sorting for shipment risk ranking
- binary_search: O(log n) search to quickly find shipments by risk score

Author: TradeGuard AI Team
Course: Data Structures & Algorithms
"""

import heapq
from typing import Any, List, Optional, Callable


# ══════════════════════════════════════════════════════════════
# 1. PRIORITY QUEUE (Min-Heap Implementation)
# ══════════════════════════════════════════════════════════════

class PriorityQueue:
    """
    A Priority Queue implementation using Python's heapq module.
    
    CONCEPT:
    A priority queue is like a hospital emergency room - patients (items) are
    served based on priority (severity), not arrival order. In our case,
    shipments with HIGHER risk scores get higher priority.
    
    IMPLEMENTATION:
    Uses a min-heap internally. Since heapq gives us the SMALLEST element first,
    we negate priorities to get a MAX-priority-queue behavior.
    This means the shipment with the HIGHEST risk score comes out first.
    
    TIME COMPLEXITY:
    - push(): O(log n) - inserting into heap
    - pop():  O(log n) - removing from heap
    - peek(): O(1)     - looking at top element
    
    USAGE IN TRADEGUARD:
    Used to rank shipments by risk score and return the top-N riskiest ones.
    
    Example:
        pq = PriorityQueue()
        pq.push(priority=85, item={"shipment": "Mumbai→Delhi", "risk": 85})
        pq.push(priority=42, item={"shipment": "Pune→Jaipur", "risk": 42})
        pq.push(priority=93, item={"shipment": "Chennai→Kolkata", "risk": 93})
        
        top = pq.pop()  # Returns Chennai→Kolkata (highest risk = 93)
    """

    def __init__(self):
        """Initialize an empty priority queue."""
        self._heap = []         # Internal list used as a heap
        self._counter = 0       # Unique counter to break ties (FIFO order)

    def push(self, priority: int, item: Any) -> None:
        """
        Add an item to the priority queue with a given priority.
        
        Args:
            priority: Higher number = higher priority (will come out first)
            item: The data to store (can be any type - dict, string, etc.)
        
        How it works:
        - We negate the priority because heapq is a MIN-heap
        - The counter ensures that items with equal priority come out in FIFO order
        """
        # Negate priority: heapq is min-heap, but we want max-priority first
        # Counter breaks ties - if two items have same priority, first-in-first-out
        heapq.heappush(self._heap, (-priority, self._counter, item))
        self._counter += 1

    def pop(self) -> Any:
        """
        Remove and return the HIGHEST priority item.
        
        Returns:
            The item with the highest priority score.
        
        Raises:
            IndexError: If the queue is empty.
        """
        if self.is_empty():
            raise IndexError("Cannot pop from an empty priority queue!")
        
        # heappop returns the smallest element (which is our most negative = highest priority)
        neg_priority, _counter, item = heapq.heappop(self._heap)
        return item

    def peek(self) -> Any:
        """
        Look at the highest priority item WITHOUT removing it.
        
        Returns:
            The item with the highest priority score.
        """
        if self.is_empty():
            raise IndexError("Cannot peek an empty priority queue!")
        
        # self._heap[0] is always the smallest (highest priority due to negation)
        neg_priority, _counter, item = self._heap[0]
        return item

    def is_empty(self) -> bool:
        """Check if the queue has no items."""
        return len(self._heap) == 0

    def size(self) -> int:
        """Return the number of items in the queue."""
        return len(self._heap)

    def get_top_n(self, n: int) -> List[Any]:
        """
        Get the top N highest-priority items (removes them from queue).
        
        This is useful for getting the "Top 5 Riskiest Shipments" etc.
        
        Args:
            n: Number of items to retrieve
            
        Returns:
            List of the N highest-priority items
        """
        result = []
        for _ in range(min(n, self.size())):
            result.append(self.pop())
        return result


# ══════════════════════════════════════════════════════════════
# 2. HASH MAP (Custom Implementation)
# ══════════════════════════════════════════════════════════════

class HashMap:
    """
    A Hash Map (Dictionary) implementation for caching predictions.
    
    CONCEPT:
    A hash map stores key-value pairs and provides O(1) average-time lookups.
    It works by converting the key into an array index using a hash function.
    
    IMPLEMENTATION:
    - Uses separate chaining for collision resolution (each bucket is a list)
    - Automatically resizes when load factor exceeds 0.75
    - Custom hash function for string keys
    
    WHY NOT JUST USE dict?
    We COULD use Python's built-in dict (which IS a hash map). This custom
    implementation is for educational purposes - to understand HOW hash maps
    work internally. In production, you'd use the built-in dict.
    
    USAGE IN TRADEGUARD:
    Caches prediction results so identical shipments don't need re-computation.
    
    TIME COMPLEXITY:
    - put():    O(1) average, O(n) worst case (all keys collide)
    - get():    O(1) average, O(n) worst case
    - remove(): O(1) average, O(n) worst case
    
    Example:
        cache = HashMap(capacity=16)
        cache.put("Mumbai-Delhi-500kg", {"prediction": "Delayed", "risk": 85})
        result = cache.get("Mumbai-Delhi-500kg")  # Returns the cached prediction
    """

    def __init__(self, capacity: int = 16):
        """
        Initialize the hash map with a fixed number of buckets.
        
        Args:
            capacity: Initial number of buckets (default 16, should be power of 2)
        """
        self._capacity = capacity           # Number of buckets
        self._size = 0                      # Number of key-value pairs stored
        self._buckets = [[] for _ in range(capacity)]  # Array of empty lists (chains)

    def _hash(self, key: str) -> int:
        """
        Custom hash function that converts a key into a bucket index.
        
        How it works (simplified version of Java's String hashCode):
        1. Start with hash_value = 0
        2. For each character in the key:
           hash_value = (hash_value * 31 + ASCII value of character)
        3. Use modulo to fit within our bucket array
        
        The number 31 is chosen because:
        - It's an odd prime number
        - It distributes keys well across buckets
        - Multiplication by 31 can be optimized: 31 * i = (i << 5) - i
        
        Args:
            key: The key to hash (must be a string)
            
        Returns:
            Bucket index (0 to capacity-1)
        """
        hash_value = 0
        for char in str(key):
            # 31 is a prime multiplier - helps distribute keys evenly
            hash_value = (hash_value * 31 + ord(char)) % self._capacity
        return hash_value

    def put(self, key: str, value: Any) -> None:
        """
        Insert or update a key-value pair in the hash map.
        
        Steps:
        1. Compute the hash → get bucket index
        2. Check if key already exists in that bucket → update value
        3. If key doesn't exist → add new (key, value) pair to the bucket
        4. If load factor > 0.75 → resize the hash map (double capacity)
        
        Args:
            key: The key to store
            value: The value associated with this key
        """
        index = self._hash(key)
        bucket = self._buckets[index]

        # Check if key already exists in this bucket → update it
        for i, (existing_key, existing_value) in enumerate(bucket):
            if existing_key == key:
                bucket[i] = (key, value)  # Update existing value
                return

        # Key doesn't exist → add new entry
        bucket.append((key, value))
        self._size += 1

        # Resize if load factor exceeds 0.75 (75% full)
        # This keeps our O(1) performance by preventing long chains
        if self._size / self._capacity > 0.75:
            self._resize()

    def get(self, key: str, default: Any = None) -> Any:
        """
        Retrieve a value by its key.
        
        Args:
            key: The key to look up
            default: Value to return if key is not found (default: None)
            
        Returns:
            The value associated with the key, or default if not found
        """
        index = self._hash(key)
        bucket = self._buckets[index]

        # Search through the chain (list) at this bucket
        for existing_key, value in bucket:
            if existing_key == key:
                return value

        return default  # Key not found

    def remove(self, key: str) -> bool:
        """
        Remove a key-value pair from the hash map.
        
        Args:
            key: The key to remove
            
        Returns:
            True if the key was found and removed, False otherwise
        """
        index = self._hash(key)
        bucket = self._buckets[index]

        for i, (existing_key, value) in enumerate(bucket):
            if existing_key == key:
                bucket.pop(i)
                self._size -= 1
                return True

        return False

    def contains(self, key: str) -> bool:
        """Check if a key exists in the hash map."""
        return self.get(key) is not None

    def keys(self) -> List[str]:
        """Return all keys in the hash map."""
        all_keys = []
        for bucket in self._buckets:
            for key, value in bucket:
                all_keys.append(key)
        return all_keys

    def values(self) -> List[Any]:
        """Return all values in the hash map."""
        all_values = []
        for bucket in self._buckets:
            for key, value in bucket:
                all_values.append(value)
        return all_values

    def _resize(self) -> None:
        """
        Double the capacity and rehash all existing entries.
        
        This is called when load factor > 0.75 to maintain O(1) performance.
        All entries must be rehashed because the bucket index depends on capacity.
        """
        old_buckets = self._buckets
        self._capacity *= 2  # Double the number of buckets
        self._buckets = [[] for _ in range(self._capacity)]
        self._size = 0

        # Rehash all existing entries into the new, larger bucket array
        for bucket in old_buckets:
            for key, value in bucket:
                self.put(key, value)

    def __len__(self) -> int:
        """Return the number of key-value pairs."""
        return self._size

    def __str__(self) -> str:
        """String representation of the hash map."""
        items = []
        for bucket in self._buckets:
            for key, value in bucket:
                items.append(f"  '{key}': {value}")
        return "HashMap({\n" + ",\n".join(items) + "\n})"


# ══════════════════════════════════════════════════════════════
# 3. MERGE SORT (Divide and Conquer)
# ══════════════════════════════════════════════════════════════

def merge_sort(arr: List[Any], key: Optional[Callable] = None, reverse: bool = False) -> List[Any]:
    """
    Sort a list using the Merge Sort algorithm (Divide and Conquer).
    
    CONCEPT:
    1. DIVIDE: Split the array in half recursively until each piece has 1 element
    2. CONQUER: Merge the pieces back together in sorted order
    
    WHY MERGE SORT?
    - Guaranteed O(n log n) time complexity (unlike QuickSort which can be O(n²))
    - Stable sort: equal elements maintain their relative order
    - Perfect for sorting shipments by risk score, delay, weight, etc.
    
    TIME COMPLEXITY:  O(n log n) in ALL cases (best, average, worst)
    SPACE COMPLEXITY: O(n) - needs extra space for merging
    
    USAGE IN TRADEGUARD:
    Sort shipments by risk score to display highest-risk shipments first.
    
    Args:
        arr: The list to sort
        key: Function to extract comparison value (e.g., lambda x: x['risk'])
        reverse: If True, sort in descending order (highest first)
        
    Returns:
        A new sorted list (does NOT modify the original)
    
    Example:
        shipments = [{"name": "A", "risk": 75}, {"name": "B", "risk": 30}]
        sorted_shipments = merge_sort(shipments, key=lambda x: x["risk"], reverse=True)
        # Result: [{"name": "A", "risk": 75}, {"name": "B", "risk": 30}]
    """
    # BASE CASE: A list of 0 or 1 elements is already sorted
    if len(arr) <= 1:
        return arr[:]  # Return a copy to avoid modifying the original

    # DIVIDE: Split the array into two halves
    mid = len(arr) // 2
    left_half = merge_sort(arr[:mid], key=key, reverse=reverse)    # Sort left half
    right_half = merge_sort(arr[mid:], key=key, reverse=reverse)   # Sort right half

    # CONQUER: Merge the two sorted halves
    return _merge(left_half, right_half, key=key, reverse=reverse)


def _merge(left: List[Any], right: List[Any], key: Optional[Callable] = None,
           reverse: bool = False) -> List[Any]:
    """
    Merge two sorted lists into one sorted list.
    
    This is the core of merge sort. It compares elements from both lists
    and places them in order.
    
    Visual Example (sorting by risk score, ascending):
        left  = [30, 50, 80]
        right = [20, 60, 90]
        
        Step 1: Compare 30 vs 20 → take 20  → result = [20]
        Step 2: Compare 30 vs 60 → take 30  → result = [20, 30]
        Step 3: Compare 50 vs 60 → take 50  → result = [20, 30, 50]
        Step 4: Compare 80 vs 60 → take 60  → result = [20, 30, 50, 60]
        Step 5: Compare 80 vs 90 → take 80  → result = [20, 30, 50, 60, 80]
        Step 6: Take remaining 90           → result = [20, 30, 50, 60, 80, 90]
    """
    merged = []
    i = j = 0  # Pointers for left and right lists

    # Compare elements from both lists and take the smaller one
    while i < len(left) and j < len(right):
        # Extract comparison values using the key function
        left_val = key(left[i]) if key else left[i]
        right_val = key(right[j]) if key else right[j]

        # Decide which element comes first
        if reverse:
            # Descending order: take the LARGER element first
            should_take_left = left_val >= right_val
        else:
            # Ascending order: take the SMALLER element first
            should_take_left = left_val <= right_val

        if should_take_left:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    # Add any remaining elements (one of the lists might have leftovers)
    merged.extend(left[i:])
    merged.extend(right[j:])

    return merged


# ══════════════════════════════════════════════════════════════
# 4. BINARY SEARCH
# ══════════════════════════════════════════════════════════════

def binary_search(arr: List[Any], target: Any, key: Optional[Callable] = None) -> int:
    """
    Search for a target value in a SORTED list using Binary Search.
    
    CONCEPT:
    Instead of checking every element (linear search = O(n)), binary search
    cuts the search space in half each time, achieving O(log n).
    
    HOW IT WORKS:
    1. Look at the MIDDLE element
    2. If it's the target → found it!
    3. If target is SMALLER → search the LEFT half
    4. If target is LARGER → search the RIGHT half
    5. Repeat until found or search space is empty
    
    PREREQUISITE: The list MUST be sorted!
    
    TIME COMPLEXITY:  O(log n) - very fast even for large lists
    SPACE COMPLEXITY: O(1)     - no extra space needed
    
    USAGE IN TRADEGUARD:
    Find a shipment with a specific risk score in a sorted list.
    
    Args:
        arr: A SORTED list to search in
        target: The value to find
        key: Function to extract comparison value from list elements
        
    Returns:
        Index of the target if found, -1 if not found
    
    Example:
        scores = [10, 25, 42, 67, 85, 93]
        index = binary_search(scores, 67)  # Returns 3
        index = binary_search(scores, 50)  # Returns -1 (not found)
    """
    low = 0
    high = len(arr) - 1

    while low <= high:
        # Find the middle index (avoid integer overflow with this formula)
        mid = low + (high - low) // 2

        # Extract the comparison value using the key function
        mid_val = key(arr[mid]) if key else arr[mid]

        if mid_val == target:
            return mid        # Found the target at index 'mid'
        elif mid_val < target:
            low = mid + 1     # Target is in the RIGHT half
        else:
            high = mid - 1    # Target is in the LEFT half

    return -1  # Target not found in the list


def binary_search_range(arr: List[Any], low_target: Any, high_target: Any,
                        key: Optional[Callable] = None) -> List[Any]:
    """
    Find all elements within a range [low_target, high_target] in a sorted list.
    
    This is useful for finding all shipments within a risk score range.
    For example: "Find all shipments with risk score between 60 and 90"
    
    Args:
        arr: A SORTED list to search in
        low_target: Lower bound of the range (inclusive)
        high_target: Upper bound of the range (inclusive)
        key: Function to extract comparison value
        
    Returns:
        List of elements within the specified range
    
    Example:
        shipments = [{"risk": 10}, {"risk": 45}, {"risk": 72}, {"risk": 88}, {"risk": 95}]
        result = binary_search_range(shipments, 40, 90, key=lambda x: x["risk"])
        # Returns [{"risk": 45}, {"risk": 72}, {"risk": 88}]
    """
    result = []
    for item in arr:
        val = key(item) if key else item
        if low_target <= val <= high_target:
            result.append(item)
        elif val > high_target:
            break  # No need to check further (list is sorted)
    return result


# ══════════════════════════════════════════════════════════════
# DEMO / TEST (runs when this file is executed directly)
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("TradeGuard AI - Data Structures Demo")
    print("=" * 60)

    # ── 1. Priority Queue Demo ───────────────────────────────
    print("\n1. PRIORITY QUEUE DEMO")
    print("-" * 40)
    pq = PriorityQueue()

    # Add shipments with their risk scores as priority
    shipments = [
        (85, {"route": "Mumbai → Delhi", "risk": 85}),
        (42, {"route": "Pune → Jaipur", "risk": 42}),
        (93, {"route": "Chennai → Kolkata", "risk": 93}),
        (67, {"route": "Bangalore → Hyderabad", "risk": 67}),
        (15, {"route": "Ahmedabad → Lucknow", "risk": 15}),
    ]

    for priority, shipment in shipments:
        pq.push(priority, shipment)
        print(f"  Added: {shipment['route']} (risk: {priority})")

    print(f"\n  Queue size: {pq.size()}")
    print(f"\n  Top 3 riskiest shipments:")
    for i, item in enumerate(pq.get_top_n(3), 1):
        print(f"    #{i}: {item['route']} (risk: {item['risk']})")

    # ── 2. Hash Map Demo ─────────────────────────────────────
    print("\n2. HASH MAP DEMO")
    print("-" * 40)
    cache = HashMap(capacity=8)

    cache.put("Mumbai-Delhi-500", {"prediction": "Delayed", "confidence": 0.87})
    cache.put("Pune-Jaipur-200", {"prediction": "On Time", "confidence": 0.92})
    cache.put("Chennai-Kolkata-750", {"prediction": "Delayed", "confidence": 0.78})

    print(f"  Cache size: {len(cache)}")
    print(f"  Mumbai-Delhi lookup: {cache.get('Mumbai-Delhi-500')}")
    print(f"  Unknown key lookup: {cache.get('Unknown-Route', 'NOT FOUND')}")
    print(f"  Contains 'Pune-Jaipur-200': {cache.contains('Pune-Jaipur-200')}")

    # ── 3. Merge Sort Demo ───────────────────────────────────
    print("\n3. MERGE SORT DEMO")
    print("-" * 40)
    risk_scores = [75, 23, 91, 45, 67, 12, 88, 34]
    print(f"  Original:  {risk_scores}")
    sorted_asc = merge_sort(risk_scores)
    sorted_desc = merge_sort(risk_scores, reverse=True)
    print(f"  Ascending: {sorted_asc}")
    print(f"  Descending:{sorted_desc}")

    # Sort dictionaries by key
    items = [
        {"city": "Mumbai", "risk": 75},
        {"city": "Delhi", "risk": 45},
        {"city": "Chennai", "risk": 92},
    ]
    sorted_items = merge_sort(items, key=lambda x: x["risk"], reverse=True)
    print(f"\n  Sorted by risk (desc):")
    for item in sorted_items:
        print(f"    {item['city']}: {item['risk']}")

    # ── 4. Binary Search Demo ────────────────────────────────
    print("\n4. BINARY SEARCH DEMO")
    print("-" * 40)
    sorted_scores = [12, 23, 34, 45, 67, 75, 88, 91]
    print(f"  Sorted list: {sorted_scores}")
    print(f"  Search for 67: index = {binary_search(sorted_scores, 67)}")
    print(f"  Search for 50: index = {binary_search(sorted_scores, 50)}")

    print("\nAll data structures working correctly!")
