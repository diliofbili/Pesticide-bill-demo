// Pesticide Calculator Application
let selectedItems = [];
let pesticideData = [];
let lastScrollPosition = 0;
let isCartFloating = false;
let cartIsCollapsed = false;
let userCollapsed = false;



// Initialize the application
function init() {
    // Set up event listeners
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('toggle-list-btn').addEventListener('click', toggleItemsList);
    document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
    // Disable click functionality on the selected item name (where the arrow used to be)
document.getElementById('selected-items-list').addEventListener('click', function(e) {
    if (e.target.classList.contains('selected-item-name')) {
        e.stopPropagation();
        e.preventDefault();
    }
});

    
    // Add scroll event listener for floating cart
    window.addEventListener('scroll', handleScroll);

    const arrowBtn = document.getElementById('toggle-cart-arrow');
    arrowBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent any other cart click actions
        toggleCartCollapse();
    });
    
    // Set up cart click handler for modal view
    setupCartClickHandler();
    
    // Fetch data
    fetchPesticideData();

    // Add setup for better scrolling on iOS
    setupIOSScrollFix();
    
    // Initialize the expand cart overlay
    updateExpandCartOverlay();
    
    // Prevent zoom on double tap/click
    preventZoom();
}

// Set up cart click handler for modal view
function setupCartClickHandler() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Add click event to open modal cart
    selectedItemsContainer.addEventListener('click', function(e) {
        // Don't open modal if clicking on buttons or controls
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
            e.target.classList.contains('cart-quantity')) {
            return;
        }
        
        // Only open if there are items in the cart
        // if (selectedItems.length > 0) {
        //     showModalCart();
        // }
    });
}

// Handle scrolling to show/hide floating cart
function handleScroll() {
    const scrollPosition = window.scrollY;
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    const cartThreshold = 100; // How far you need to scroll before cart floats
    const arrowBtn = document.getElementById('toggle-cart-arrow');
    
    const isScrollingDown = scrollPosition > lastScrollPosition;
    lastScrollPosition = scrollPosition;
    
    // Floating cart logic:
    if (isScrollingDown && scrollPosition > cartThreshold && !isCartFloating && selectedItems.length > 0) {
        // Add view-state-reset class to ensure clean transition
        selectedItemsContainer.classList.add('view-state-reset');
        
        // CRITICAL FIX: Always remove any expand overlay before converting to floating cart
        const existingOverlay = document.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Remove any collapse buttons
        const existingCollapseButton = document.querySelector('.collapse-cart-button');
        if (existingCollapseButton) {
            existingCollapseButton.remove();
        }
        
        // Remove the has-more-items class from the items list
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            selectedItemsList.classList.remove('has-more-items');
            selectedItemsList.classList.remove('top-cart-has-more-items');
        }
        
        // Force a small delay for clean transition
        setTimeout(() => {
            selectedItemsContainer.classList.remove('view-state-reset');
            selectedItemsContainer.classList.add('floating-cart');
            selectedItemsContainer.classList.add('bottom-floating-cart'); // Add new class for bottom positioning
            isCartFloating = true;
            
            // Ensure it's fixed to bottom with no gap
            selectedItemsContainer.style.bottom = '0';
            selectedItemsContainer.style.marginBottom = '0';
            
            // Apply user's last collapsed state if needed
            if (userCollapsed) {
                selectedItemsContainer.classList.add('cart-collapsed');
                if (arrowBtn) arrowBtn.textContent = '↑';
                
                // Ensure the header is properly styled in collapsed state
                const header = selectedItemsContainer.querySelector('.selected-items-header');
                if (header) {
                    header.style.paddingBottom = '5px';
                    header.style.marginBottom = '0';
                    header.style.borderBottom = 'none';
                }
            }
            
            // Only call floating cart scroll indicator logic if not collapsed
            if (!userCollapsed) {
                updateFloatingCartScrollIndicator();
            }
        }, 50);
    } else if ((!isScrollingDown && scrollPosition < cartThreshold) || selectedItems.length === 0) {
        // Add view-state-reset class to ensure clean transition
        selectedItemsContainer.classList.add('view-state-reset');
        
        // Remove any scroll indicators
        const existingIndicator = selectedItemsContainer.querySelector('.scroll-more-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Remove floating cart classes
        selectedItemsContainer.classList.remove('floating-cart');
        selectedItemsContainer.classList.remove('bottom-floating-cart'); // Remove bottom positioning class
        selectedItemsContainer.classList.remove('cart-collapsed');
        isCartFloating = false;
        
        // Reset styles that may have been applied
        selectedItemsContainer.style.bottom = '';
        selectedItemsContainer.style.marginBottom = '';
        
        // Re-apply overlay when returning to static cart if needed
        // Small delay to ensure DOM is updated first
        setTimeout(() => {
            selectedItemsContainer.classList.remove('view-state-reset');
            if (!isCartFloating && selectedItems.length > 4) {
                updateTopCartOverlay();
            }
        }, 100);
    }
    
    // Arrow visibility:
    if (scrollPosition > 0) {
        arrowBtn.style.display = 'inline-block';
    } else {
        arrowBtn.style.display = 'none';
    }
    
    // At the very top, force expansion so items show—even if the user had collapsed it.
    if (scrollPosition === 0) {
        selectedItemsContainer.classList.remove('cart-collapsed');
        arrowBtn.textContent = '↓';
        
        // Reset header styles
        const header = selectedItemsContainer.querySelector('.selected-items-header');
        if (header) {
            header.style.paddingTop = '';
            header.style.paddingBottom = '';
            header.style.marginBottom = '';
            header.style.borderBottom = '';
        }
    } else {
        // When scrolling down, reapply the user's last state with proper spacing
        if (userCollapsed && isCartFloating) {
            selectedItemsContainer.classList.add('cart-collapsed');
            arrowBtn.textContent = '↑';
            
            // Apply compact spacing to header
            const header = selectedItemsContainer.querySelector('.selected-items-header');
            if (header) {
                header.style.paddingTop = '5px';
                header.style.paddingBottom = '5px';
                header.style.marginBottom = '0';
                header.style.borderBottom = 'none';
            }
        }
    }
}


// Fetch data from our backend server
function fetchPesticideData() {
    // Show loading indicator
    document.getElementById('loading-indicator').style.display = 'block';
    document.getElementById('items-list').innerHTML = '';
    
    fetch('/api/pesticides')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // IMPORTANT: Hide loading indicator
            document.getElementById('loading-indicator').style.display = 'none';
            
            pesticideData = data;
            renderItemsList(pesticideData);
        })
        .catch(error => {
            // Hide loading, show error
            document.getElementById('loading-indicator').style.display = 'none';
            document.getElementById('items-list').innerHTML = 
                `<div class="error-message">Failed to load data: ${error.message}</div>`;
            console.error("Error fetching data:", error);
        });
}

// Render the list of items
function renderItemsList(items) {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';
    
    items.forEach((item) => {
        // Calculate the original index in pesticideData
        const originalIndex = pesticideData.indexOf(item);
        if (originalIndex === -1) return; // Safeguard: should not happen
        
        if (item.price === 0) {
            // Render salt category
            const saltHeading = document.createElement('div');
            saltHeading.className = 'salt-category';
            saltHeading.textContent = item.name + (item.saltComposition ? ` / ${item.saltComposition}` : '');
            itemsList.appendChild(saltHeading);
        } else {
            // Render regular item
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.setAttribute('data-index', originalIndex);
            itemElement.innerHTML = `
                <div class="item-info">
                    <div class="item-name">
                        ${item.name} 
                        <div class="price-container">
                            <span class="item-price">₹${item.price}</span>
                            <button class="edit-price-btn" data-index="${originalIndex}" title="Edit price">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </div>
                        <span class="item-company">${item.company}</span>
                    </div>
                    <div class="item-composition">${item.saltComposition}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-index="${originalIndex}">-</button>
                    <span class="quantity-display" id="quantity-${originalIndex}">0</span>
                    <button class="quantity-btn increase" data-index="${originalIndex}">+</button>
                </div>
            `;
            
            itemsList.appendChild(itemElement);
            
            // Add event listeners using the original index
            itemElement.querySelector('.increase').addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                increaseQuantity(idx);
                showFloatingCartOnAdd();
            });
            
            itemElement.querySelector('.decrease').addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                decreaseQuantity(idx);
            });
            
            itemElement.querySelector('.edit-price-btn').addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                editPrice(idx);
            });
        }
    });
}

// Show floating cart when item added - improved for better visibility and position at bottom
function showFloatingCartOnAdd() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only show floating cart if we've scrolled down enough
    if (window.scrollY > 100 && selectedItems.length > 0) {
        // Important: clear out any lingering transforms or transitions
        selectedItemsContainer.style.transform = '';
        selectedItemsContainer.style.transition = '';
        
        // Make sure any previous state is cleared
        selectedItemsContainer.classList.remove('floating-cart-fade');
        
        // CRITICAL FIX: Always remove any expand overlay before converting to floating cart
        const existingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Remove any collapse button
        const existingCollapseButton = selectedItemsContainer.querySelector('.collapse-cart-button');
        if (existingCollapseButton) {
            existingCollapseButton.remove();
        }
        
        // Remove the has-more-items class to disable blur effect
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            selectedItemsList.classList.remove('has-more-items');
            selectedItemsList.classList.remove('top-cart-has-more-items');
        }
        
        // Force a small delay to ensure previous style changes have been applied
        setTimeout(() => {
            // Fixed position styling - ensure it's at the bottom and fixed there
            selectedItemsContainer.classList.remove('view-state-reset');
            selectedItemsContainer.classList.add('floating-cart');
            selectedItemsContainer.classList.add('bottom-floating-cart'); // Add class for bottom positioning
            isCartFloating = true;
            
            // Ensure it's fixed to bottom with no gap
            selectedItemsContainer.style.bottom = '0';
            selectedItemsContainer.style.marginBottom = '0';
            
            // Double check for clean state
            const lateExistingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
            if (lateExistingOverlay) {
                lateExistingOverlay.remove();
            }
            
            // Fix spacing - remove excessive padding/margins
            if (selectedItemsList) {
                selectedItemsList.style.paddingBottom = '0';
                selectedItemsList.style.marginBottom = '0';
            }
            
            // Setup improved scroll handling
            setupImprovedCartScroll();
            
            // Add custom swipe dismiss only after it's displayed
            setupSwipeDismiss(selectedItemsContainer);
            
            // Only update floating cart scroll indicator
            updateFloatingCartScrollIndicator();
            
            // If cart was previously collapsed by user, apply collapsed state
            if (userCollapsed) {
                selectedItemsContainer.classList.add('cart-collapsed');
                const arrowBtn = document.getElementById('toggle-cart-arrow');
                if (arrowBtn) {
                    arrowBtn.textContent = '↑';
                }
                
                // Ensure the header is properly styled in collapsed state
                const header = selectedItemsContainer.querySelector('.selected-items-header');
                if (header) {
                    header.style.paddingBottom = '5px';
                    header.style.marginBottom = '0';
                    header.style.borderBottom = 'none';
                }
            }
            
            // Auto-hide after inactivity (except on mobile)
            if (window.innerWidth > 600 && !userCollapsed) {
                setupAutoHide();
            }
        }, 50);
    }
}

// Add scroll indicators to show user the cart is scrollable
function addScrollIndicators(container) {
    // Check if indicators already exist
    if (container.querySelector('.scroll-indicator-top')) {
        return;
    }
    
    const topIndicator = document.createElement('div');
    topIndicator.className = 'scroll-indicator-top';
    container.appendChild(topIndicator);
    
    const bottomIndicator = document.createElement('div');
    bottomIndicator.className = 'scroll-indicator-bottom';
    container.appendChild(bottomIndicator);
    
    // Add scroll event listener to show/hide indicators
    const itemsList = document.getElementById('selected-items-list');
    if (itemsList) {
        itemsList.addEventListener('scroll', updateScrollIndicators);
        // Initial update
        updateScrollIndicators();
    }
}

// Update scroll indicators based on scroll position
function updateScrollIndicators() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    const topIndicator = container.querySelector('.scroll-indicator-top');
    const bottomIndicator = container.querySelector('.scroll-indicator-bottom');
    
    if (!topIndicator || !bottomIndicator) return;
    
    // Show top indicator if not at the top
    if (itemsList.scrollTop > 5) {
        container.classList.add('can-scroll-up');
    } else {
        container.classList.remove('can-scroll-up');
    }
    
    // Show bottom indicator if not at the bottom
    const scrollBottom = itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight;
    if (scrollBottom > 5) {
        container.classList.add('can-scroll-down');
    } else {
        container.classList.remove('can-scroll-down');
    }
}

// Ensure the cart is fully visible on screen
function ensureCartVisibility() {
    const cart = document.querySelector('.floating-cart');
    if (!cart) return;
    
    // On mobile, ensure it's fixed to the bottom of the viewport
    if (window.innerWidth <= 600) {
        cart.style.bottom = '0';
        
        // For iOS devices, handle safe area issues
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            // Add bottom padding for safe area on newer iOS devices
            const safeAreaPadding = window.innerHeight > 700 ? '20px' : '10px';
            cart.style.paddingBottom = safeAreaPadding;
        }
    }
}

// Allow dismissing the cart with swipe on mobile - improved to ensure visibility
function setupSwipeDismiss(element) {
    let touchStartY = 0;
    let touchMoveY = 0;
    let cartScrollTop = 0;
    let isScrollingCart = false;
    
    // Get the scrollable cart items container
    const itemsList = document.getElementById('selected-items-list');
    
    // Helper to check if we're at the top or bottom of scroll
    function isAtTopOfScroll() {
        return !itemsList || itemsList.scrollTop <= 2;
    }
    
    function isAtBottomOfScroll() {
        if (!itemsList) return true;
        return Math.abs(itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight) <= 2;
    }
    
    // Touch start handler - improved to track scroll position
    element.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        
        if (itemsList) {
            cartScrollTop = itemsList.scrollTop;
            // Only consider it scrolling if we're not at either boundary
            isScrollingCart = !(isAtTopOfScroll() && isAtBottomOfScroll());
        } else {
            isScrollingCart = false;
        }
    }, { passive: true });
    
    // Touch move handler - fix scroll behavior
    element.addEventListener('touchmove', function(e) {
        touchMoveY = e.touches[0].clientY;
        const diff = touchMoveY - touchStartY;
        
        if (itemsList) {
            // If trying to scroll down and already at top, or
            // if trying to scroll up and already at bottom,
            // then handle the swipe dismiss gesture
            if ((diff > 0 && isAtTopOfScroll()) || (diff < 0 && isAtBottomOfScroll())) {
                // Only transform for downward swipe (dismiss gesture)
                if (diff > 0) {
                    element.style.transform = `translateY(${diff/2}px)`;
                    e.preventDefault();
                }
                isScrollingCart = false;
            } else {
                // We're scrolling within the cart
                isScrollingCart = true;
                element.style.transform = '';
                // Let the default scroll behavior happen
            }
        }
    }, { passive: false });
    
    // Touch end handler - improved for better cleanup
    element.addEventListener('touchend', function() {
        if (!isScrollingCart) {
            const diff = touchMoveY - touchStartY;
            
            // Only handle significant downward swipes for dismiss
            if (diff > 80) {
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = 'translateY(100%)';
                
                setTimeout(() => {
                    element.classList.remove('floating-cart');
                    element.style.transform = '';
                    element.style.transition = '';
                    isCartFloating = false;
                }, 300);
            } else {
                // Reset position
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = '';
                
                setTimeout(() => {
                    element.style.transition = '';
                }, 300);
            }
        }
        
        // Always reset the flag and transform
        isScrollingCart = false;
        if (element.style.transform === '') {
            element.style.transition = '';
        }
    }, { passive: true });
}

// Increase item quantity
function increaseQuantity(index) {
    const item = pesticideData[index];
    
    // Don't process if it's a salt category
    if (item.price === 0) return;
    
    const quantityDisplay = document.getElementById(`quantity-${index}`);
    const currentQuantity = parseInt(quantityDisplay.textContent);
    const newQuantity = currentQuantity + 1;
    
    quantityDisplay.textContent = newQuantity;
    
    // Update selected items
    const existingItem = selectedItems.find(i => i.index === index);
    if (existingItem) {
        existingItem.quantity = newQuantity;
    } else {
        selectedItems.push({
            index: index,
            name: item.name,
            company: item.company,
            price: item.price,
            quantity: newQuantity
        });
    }
    
    updateSelectedItemsList();
    updateModalCartItems(); // Update modal cart if open
}

// Decrease item quantity
function decreaseQuantity(index) {
    const item = pesticideData[index];
    
    // Don't process if it's a salt category
    if (item.price === 0) return;
    
    const quantityDisplay = document.getElementById(`quantity-${index}`);
    const currentQuantity = parseInt(quantityDisplay.textContent);
    
    if (currentQuantity > 0) {
        const newQuantity = currentQuantity - 1;
        quantityDisplay.textContent = newQuantity;
        
        // Update selected items
        const itemIndex = selectedItems.findIndex(i => i.index === index);
        if (itemIndex !== -1) {
            if (newQuantity === 0) {
                // Remove item if quantity becomes zero
                selectedItems.splice(itemIndex, 1);
            } else {
                selectedItems[itemIndex].quantity = newQuantity;
            }
        }
        
        updateSelectedItemsList();
        updateModalCartItems(); // Update modal cart if open
    }
}

// Remove item completely from cart
function removeItem(index) {
    // Find the item in selected items
    const itemIndex = selectedItems.findIndex(i => i.index === index);
    if (itemIndex !== -1) {
        // Reset quantity display in the main list
        const quantityDisplay = document.getElementById(`quantity-${index}`);
        if (quantityDisplay) {
            quantityDisplay.textContent = "0";
        }
        
        // Remove from selected items
        selectedItems.splice(itemIndex, 1);
        updateSelectedItemsList();
        updateModalCartItems(); // Update modal cart if open
        
        // If no more items, remove floating cart
        if (selectedItems.length === 0 && isCartFloating) {
            const selectedItemsContainer = document.querySelector('.selected-items-container');
            selectedItemsContainer.classList.remove('floating-cart');
            isCartFloating = false;
        }
    }
}

// Clear the entire cart
function clearCart() {
    // Reset all quantities in the main list
    selectedItems.forEach(item => {
        const quantityDisplay = document.getElementById(`quantity-${item.index}`);
        if (quantityDisplay) {
            quantityDisplay.textContent = "0";
        }
    });
    
    // Clear selected items array
    selectedItems = [];
    updateSelectedItemsList();
    updateModalCartItems(); // Update modal cart if open
    
    // Remove floating cart
    if (isCartFloating) {
        const selectedItemsContainer = document.querySelector('.selected-items-container');
        selectedItemsContainer.classList.remove('floating-cart');
        isCartFloating = false;
    }
    
    // Hide the modal cart if it's open
    if (document.querySelector('.cart-modal-overlay.active')) {
        hideModalCart();
    }
}

// Update the function to check for more items in the top cart
function updateSelectedItemsList() {
    const selectedItemsList = document.getElementById('selected-items-list');
    selectedItemsList.innerHTML = '';

    let grandTotal = 0;

    if (selectedItems.length === 0) {
        selectedItemsList.innerHTML = '<p class="no-items">No items selected</p>';
        document.getElementById('grand-total-value').textContent = '0';
        
        // Clear any special cart states
        const container = document.querySelector('.selected-items-container');
        container.classList.remove('expanded');
        
        // Hide the expand overlay when no items
        updateExpandCartOverlay();
        return;
    }

    selectedItems.forEach((item) => {
        const total = item.price * item.quantity;
        grandTotal += total;

        const itemElement = document.createElement('div');
        itemElement.className = 'selected-item';
        itemElement.setAttribute('data-index', item.index);

        // Updated structure with improved layout
        itemElement.innerHTML = `
        <div class="selected-item-row">
          <!-- Item name with full width -->
          <span class="selected-item-name">${item.name}</span>
          
          <!-- Controls group close to name -->
          <div class="selected-item-qty-controls">
            <button class="quantity-btn decrease-selected" data-index="${item.index}">-</button>
            <span class="cart-quantity" data-index="${item.index}">${item.quantity}</span>
            <button class="quantity-btn increase-selected" data-index="${item.index}">+</button>
            <span class="item-price-display">₹${item.price}</span>
            <button class="edit-price-btn cart-edit-price-btn" data-index="${item.index}" title="Edit price">
              <i class="fas fa-pencil-alt"></i>
            </button>
          </div>
          
          <!-- Total price and trash at far right -->
          <div class="selected-item-actions">
            <span class="equals-sign">=</span>
            <span class="selected-item-total">₹${total}</span>
            <button class="remove-item-btn" data-index="${item.index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;

        selectedItemsList.appendChild(itemElement);

        const editPriceBtn = itemElement.querySelector('.cart-edit-price-btn');
        if (editPriceBtn) {
          editPriceBtn.addEventListener('click', (e) => {
            e.stopPropagation();       // Avoid other click handlers
            const idx = parseInt(editPriceBtn.dataset.index);
            editPrice(idx);            // Reuse the same editPrice() you already have
          });
        }

        // Add event listener for remove button
        itemElement.querySelector('.remove-item-btn').addEventListener('click', function () {
            removeItem(item.index);
        });
        
        const increaseBtn = itemElement.querySelector('.increase-selected');
        const decreaseBtn = itemElement.querySelector('.decrease-selected');
        increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            increaseQuantity(item.index);
        });
        decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            decreaseQuantity(item.index);
        });
    });

    document.getElementById('grand-total-value').textContent = grandTotal;
    
    // Split the cart overlay logic based on current cart state
    if (isCartFloating) {
        // Only update floating cart scroll indicator
        updateFloatingCartScrollIndicator();
    } else {
        // Only update top cart overlay
        updateTopCartOverlay();
    }
}

// Function to add "Click to view more" overlay for top cart - FIXED to isolate from floating cart
function updateExpandCartOverlay() {
    if (isCartFloating) {
        updateFloatingCartScrollIndicator();
    } else {
        updateTopCartOverlay();
    }
}

// Function to expand the top cart to show all items - IMPROVED for smoother transition
function expandTopCart() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only proceed if it's not already expanded and not a floating cart
    if (!selectedItemsContainer.classList.contains('expanded') && 
        !selectedItemsContainer.classList.contains('floating-cart')) {
        
        // Remove any existing overlay first
        const existingOverlay = document.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Get the items list and prepare for smooth transition
        const selectedItemsList = document.getElementById('selected-items-list');
        
        // Store the starting height before any changes
        const startHeight = selectedItemsList.offsetHeight;
        
        // Apply transition for height to ensure smooth animation
        selectedItemsList.style.height = startHeight + 'px';
        selectedItemsList.style.overflow = 'hidden';
        selectedItemsList.style.transition = 'height 0.4s ease-in-out';
        
        // Add the expanded class to trigger CSS changes
        selectedItemsContainer.classList.add('expanded');
        
        // Calculate expanded height after a brief delay to allow the DOM to update
        setTimeout(() => {
            // Force it to show all items
            selectedItemsList.style.maxHeight = 'none';
            
            // Get the expanded height
            const expandedHeight = selectedItemsList.scrollHeight;
            
            // Animate to the expanded height
            selectedItemsList.style.height = expandedHeight + 'px';
            
            // Clean up styles after transition
            setTimeout(() => {
                selectedItemsList.style.height = '';
                selectedItemsList.style.transition = '';
                selectedItemsList.style.overflow = 'visible';
            }, 400); // Match transition duration
            
            // Re-apply overlay as collapse button
            updateExpandCartOverlay();
        }, 10);
    }
}

// Function to collapse the top cart - FIXED to show exactly 5 items
function collapseTopCart() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only proceed if it's expanded and not a floating cart
    if (selectedItemsContainer.classList.contains('expanded') && 
        !selectedItemsContainer.classList.contains('floating-cart')) {
        
        // Remove any existing collapse button
        const existingCollapseButton = document.querySelector('.collapse-cart-button');
        if (existingCollapseButton) {
            existingCollapseButton.remove();
        }
        
        const selectedItemsList = document.getElementById('selected-items-list');
        const selectedItems = selectedItemsList.querySelectorAll('.selected-item');
        
        // Calculate the exact height needed to show only 5 items
        let targetHeight = 0;
        if (selectedItems.length > 5) {
            // Measure the first 5 items to get their exact heights
            for (let i = 0; i < 5; i++) {
                if (selectedItems[i]) {
                    targetHeight += selectedItems[i].offsetHeight + 
                        parseInt(window.getComputedStyle(selectedItems[i]).marginBottom);
                }
            }
            
            // Add a small buffer for precision
            targetHeight += 10; 
        } else {
            // If fewer than 5 items, just use their natural height
            targetHeight = selectedItemsList.scrollHeight;
        }
        
        // Set the current expanded height explicitly before transitioning
        const startHeight = selectedItemsList.scrollHeight;
        selectedItemsList.style.height = startHeight + 'px';
        selectedItemsList.style.overflow = 'hidden';
        selectedItemsList.style.transition = 'height 0.4s ease-in-out';
        
        // Force reflow to ensure the initial height is applied
        selectedItemsList.offsetHeight;
        
        // Scroll back to top before collapsing
        selectedItemsList.scrollTop = 0;
        
        // Remove the expanded class first
        selectedItemsContainer.classList.remove('expanded');
        
        // Make sure the has-more-items class is added back for the blur effect
        if (selectedItems.length > 5) {
            selectedItemsList.classList.add('has-more-items');
            selectedItemsList.classList.add('top-cart-has-more-items');
        }
        
        // Apply the exact calculated height to show 5 items
        selectedItemsList.style.height = targetHeight + 'px';
        
        // Clean up styles and re-apply overlay after transition
        setTimeout(() => {
            selectedItemsList.style.maxHeight = targetHeight + 'px'; // Keep this height constraint
            selectedItemsList.style.transition = '';
            
            // Re-apply the view all overlay
            updateExpandCartOverlay();
        }, 400); // Match transition duration
    }
}

// Add function to check if cart needs scroll indicator
function updateScrollIndicator() {
    if (isCartFloating) {
        updateFloatingCartScrollIndicator();
    }
}

// Separated function to ONLY handle the top cart "View all items" overlay
function updateTopCartOverlay() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    const selectedItemsList = document.getElementById('selected-items-list');
    
    // Skip if it's a floating cart or no items or already processing
    if (selectedItemsContainer.classList.contains('floating-cart') || 
        selectedItemsContainer.classList.contains('view-state-reset') || 
        selectedItems.length === 0) {
        return;
    }
    
    // Remove any existing overlay
    const existingOverlay = document.querySelector('.expand-cart-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Remove any existing collapse button
    const existingCollapseButton = document.querySelector('.collapse-cart-button');
    if (existingCollapseButton) {
        existingCollapseButton.remove();
    }
    
    // Check if we have more than 5 items (CHANGED from 4 to 5)
    if (selectedItems.length > 5) {
        // Add the top-cart-has-more-items class for the blur gradient
        selectedItemsList.classList.add('has-more-items');
        selectedItemsList.classList.add('top-cart-has-more-items');
        
        // If cart is already expanded, show collapse button instead
        if (selectedItemsContainer.classList.contains('expanded')) {
            const collapseButton = document.createElement('div');
            collapseButton.className = 'collapse-cart-button';
            collapseButton.innerHTML = `<i class="fas fa-chevron-up"></i> Show less`;
            
            // Add after the items list
            selectedItemsList.insertAdjacentElement('afterend', collapseButton);
            
            // Add click handler to collapse the cart
            collapseButton.addEventListener('click', () => {
                collapseTopCart();
            });
            return; // Don't add overlay if already expanded
        }
        
        // Create the overlay with the "See all items" button
        const overlay = document.createElement('div');
        overlay.className = 'expand-cart-overlay';
        
        const expandButton = document.createElement('div');
        expandButton.className = 'expand-cart-button';
        expandButton.innerHTML = `<i class="fas fa-chevron-down"></i> See all items`;
        
        overlay.appendChild(expandButton);
        
        // Always append to the non-floating cart container
        selectedItemsContainer.appendChild(overlay);
        
        // Add click handler to expand the cart
        overlay.addEventListener('click', () => {
            expandTopCart();
        });
    } else {
        // Remove the has-more-items classes if 5 or fewer items (CHANGED from 4 to 5)
        selectedItemsList.classList.remove('has-more-items');
        selectedItemsList.classList.remove('top-cart-has-more-items');
    }
}

// Separated function to ONLY handle floating cart scroll indicator - IMPROVED to handle 4-item threshold
function updateFloatingCartScrollIndicator() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    // Clean up any existing indicators
    cleanupScrollIndicators(container);
    
    // Make sure we don't have top cart classes
    itemsList.classList.remove('top-cart-has-more-items');
    
    // Only proceed if we have more than 4 items and content exceeds visible area
    if (selectedItems.length > 4 && itemsList.scrollHeight > itemsList.clientHeight) {
        // Add has-more-items class to container
        container.classList.add('has-more-items');
        
        // Create and add a SINGLE scroll indicator for floating cart
        const indicator = document.createElement('div');
        indicator.className = 'scroll-more-indicator';
        indicator.innerHTML = 'Scroll for more items ↓';
        container.appendChild(indicator);
        
        // Show the indicator with a fade-in effect
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // Hide indicator when user starts scrolling
        const onScrollHandler = function() {
            if (itemsList.scrollTop > 10) { // If scrolled down at least a bit
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
                itemsList.removeEventListener('scroll', onScrollHandler);
            }
        };
        
        // Remove any existing listeners before adding a new one
        itemsList.removeEventListener('scroll', onScrollHandler);
        itemsList.addEventListener('scroll', onScrollHandler);
    } else {
        container.classList.remove('has-more-items');
    }
}

// Helper function to clean up ALL scroll indicators - NEW
function cleanupScrollIndicators(container) {
    // Remove any existing indicator
    const existingIndicators = container.querySelectorAll('.scroll-more-indicator');
    existingIndicators.forEach(indicator => {
        indicator.remove();
    });
    
    // Also clean up related elements that might interfere
    const existingOverlay = container.querySelector('.expand-cart-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const existingCollapseButton = container.querySelector('.collapse-cart-button');
    if (existingCollapseButton) {
        existingCollapseButton.remove();
    }
}

// Handle search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredItems = pesticideData.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm) || 
            (item.company && item.company.toLowerCase().includes(searchTerm)) ||
            (item.saltComposition && item.saltComposition.toLowerCase().includes(searchTerm));
        
        return matchesSearch;
    });
    
    renderItemsList(filteredItems);
}

// Toggle items list visibility
function toggleItemsList() {
    const itemsContainer = document.getElementById('all-items-container');
    const toggleButton = document.getElementById('toggle-list-btn');
    
    if (itemsContainer.classList.contains('hidden')) {
        itemsContainer.classList.remove('hidden');
        toggleButton.textContent = 'Hide List';
    } else {
        itemsContainer.classList.add('hidden');
        toggleButton.textContent = 'Show List';
    }
}

// Edit price functionality
function editPrice(index) {
    const item = pesticideData[index];
    const newPrice = prompt(`Enter new price for ${item.name}:`, item.price);
    
    if (newPrice !== null && !isNaN(newPrice) && newPrice.trim() !== '') {
        const parsedPrice = parseInt(newPrice.trim());
        const oldPrice = item.price;
        
        // Update the price in memory only (not in the database)
        pesticideData[index].price = parsedPrice;
        
        // Update the price display in the main list
        const itemElements = document.querySelectorAll(`.item`);
        itemElements.forEach(el => {
            const itemIndex = parseInt(el.getAttribute('data-index'));
            if (itemIndex === index) {
                const priceElement = el.querySelector('.item-price');
                priceElement.textContent = `₹${parsedPrice}`;
                
                // Add highlight animation
                priceElement.classList.add('price-changed');
                setTimeout(() => {
                    priceElement.classList.remove('price-changed');
                }, 1500);
            }
        });
        
        // Update item in cart if it exists
        const cartItemIndex = selectedItems.findIndex(i => i.index === index);
        if (cartItemIndex !== -1) {
            selectedItems[cartItemIndex].price = parsedPrice;
            updateSelectedItemsList();
        }
        
        // Show toast notification with price change details
        const priceDiff = parsedPrice - oldPrice;
        const priceChangeText = priceDiff > 0 ? `increased by ₹${priceDiff}` : `reduced by ₹${Math.abs(priceDiff)}`;
        showToast(`${item.name} price temporarily ${priceChangeText} to ₹${parsedPrice}`);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    let icon = 'check-circle';
    if (type === 'error') {
        icon = 'exclamation-circle';
    } else if (type === 'info') {
        icon = 'info-circle';
    }
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Edit quantity functionality
function editQuantity(index) {
    const itemIndex = selectedItems.findIndex(i => i.index === index);
    if (itemIndex !== -1) {
        const item = selectedItems[itemIndex];
        const newQuantity = prompt(`Enter new quantity for ${item.name}:`, item.quantity);
        
        if (newQuantity !== null && !isNaN(newQuantity) && newQuantity.trim() !== '') {
            const parsedQuantity = parseInt(newQuantity.trim());
            
            if (parsedQuantity > 0) {
                // Update in selected items
                selectedItems[itemIndex].quantity = parsedQuantity;
                
                // Update quantity display in main list
                const quantityDisplay = document.getElementById(`quantity-${index}`);
                if (quantityDisplay) {
                    quantityDisplay.textContent = parsedQuantity;
                }
                
                // Update the cart display
                updateSelectedItemsList();
                updateModalCartItems(); // Update modal cart if open
                
                showToast(`Updated ${item.name} quantity to ${parsedQuantity}`);
            } else if (parsedQuantity === 0) {
                // Remove item if quantity is zero
                removeItem(index);
                showToast(`Removed ${item.name} from cart`);
            }
        }
    }
}

// Improved floating cart management for mobile
function showFloatingCartOnAdd() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only show floating cart if we've scrolled down enough
    if (window.scrollY > 100 && selectedItems.length > 0) {
        // Add floating cart class
        selectedItemsContainer.classList.add('floating-cart');
        isCartFloating = true;
        
        // On mobile, add a touch handler to allow dismissing with swipe
        if (window.innerWidth <= 600) {
            setupSwipeDismiss(selectedItemsContainer);
        }
        
        // Auto-hide after inactivity (except on mobile)
        if (window.innerWidth > 600) {
            setupAutoHide();
        }
    }
}

// Auto-hide the cart after inactivity
function setupAutoHide() {
    clearTimeout(window.floatingCartTimeout);
    
    window.floatingCartTimeout = setTimeout(() => {
        const selectedItemsContainer = document.querySelector('.selected-items-container');
        
        if (isCartFloating && !selectedItemsContainer.matches(':hover')) {
            selectedItemsContainer.classList.add('floating-cart-fade');
            
            setTimeout(() => {
                selectedItemsContainer.classList.remove('floating-cart');
                selectedItemsContainer.classList.remove('floating-cart-fade');
                isCartFloating = false;
            }, 500);
        }
    }, 5000);
}

// Allow dismissing the cart with swipe on mobile - IMPROVED to fix scroll issues
function setupSwipeDismiss(element) {
    let touchStartY = 0;
    let touchMoveY = 0;
    let cartScrollTop = 0;
    let isScrollingCart = false;
    
    // Get the scrollable cart items container
    const itemsList = document.getElementById('selected-items-list');
    
    // Helper to check if we're at the top or bottom of scroll
    function isAtTopOfScroll() {
        return !itemsList || itemsList.scrollTop <= 2;
    }
    
    function isAtBottomOfScroll() {
        if (!itemsList) return true;
        return Math.abs(itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight) <= 2;
    }
    
    // Touch start handler - improved to track scroll position
    element.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        
        if (itemsList) {
            cartScrollTop = itemsList.scrollTop;
            // Only consider it scrolling if we're not at either boundary
            isScrollingCart = !(isAtTopOfScroll() && isAtBottomOfScroll());
        } else {
            isScrollingCart = false;
        }
    }, { passive: true });
    
    // Touch move handler - fix scroll behavior
    element.addEventListener('touchmove', function(e) {
        touchMoveY = e.touches[0].clientY;
        const diff = touchMoveY - touchStartY;
        
        if (itemsList) {
            // If trying to scroll down and already at top, or
            // if trying to scroll up and already at bottom,
            // then handle the swipe dismiss gesture
            if ((diff > 0 && isAtTopOfScroll()) || (diff < 0 && isAtBottomOfScroll())) {
                // Only transform for downward swipe (dismiss gesture)
                if (diff > 0) {
                    element.style.transform = `translateY(${diff/2}px)`;
                    e.preventDefault();
                }
                isScrollingCart = false;
            } else {
                // We're scrolling within the cart
                isScrollingCart = true;
                element.style.transform = '';
                // Let the default scroll behavior happen
            }
        }
    }, { passive: false });
    
    // Touch end handler - improved for better cleanup
    element.addEventListener('touchend', function() {
        if (!isScrollingCart) {
            const diff = touchMoveY - touchStartY;
            
            // Only handle significant downward swipes for dismiss
            if (diff > 80) {
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = 'translateY(100%)';
                
                setTimeout(() => {
                    element.classList.remove('floating-cart');
                    element.style.transform = '';
                    element.style.transition = '';
                    isCartFloating = false;
                }, 300);
            } else {
                // Reset position
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = '';
                
                setTimeout(() => {
                    element.style.transition = '';
                }, 300);
            }
        }
        
        // Always reset the flag and transform
        isScrollingCart = false;
        if (element.style.transform === '') {
            element.style.transition = '';
        }
    }, { passive: true });
}

// New function to improve scroll behavior within the cart
function setupImprovedCartScroll() {
    const cartItemsList = document.getElementById('selected-items-list');
    
    if (!cartItemsList) return;
    
    // Make sure the cart has proper overflow handling
    cartItemsList.style.overflowY = 'auto';
    cartItemsList.style.WebkitOverflowScrolling = 'touch'; // Enable momentum scrolling on iOS
    
    // Add these attributes to improve scroll behavior
    cartItemsList.setAttribute('role', 'region');
    cartItemsList.setAttribute('aria-label', 'Selected items');
    
    // Clear any existing handlers to avoid duplicates
    cartItemsList.onwheel = null;
    
    // Improved wheel event handling for desktop
    cartItemsList.addEventListener('wheel', function(e) {
        const isAtTop = cartItemsList.scrollTop === 0;
        const isAtBottom = cartItemsList.scrollHeight - cartItemsList.scrollTop === cartItemsList.clientHeight;
        
        // If at the top and trying to scroll up, or at the bottom and trying to scroll down,
        // let the parent page scroll
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            return; // Allow event to bubble up
        } else {
            // Otherwise, contain the scroll within the cart
            e.stopPropagation();
        }
    }, { passive: true });
    
    // Add a small delay before checking for overflow
    setTimeout(() => {
        updateScrollIndicator();
    }, 100);
}

// Function to show the modal cart
function showModalCart() {
    // Only create the modal if it doesn't exist
    if (!document.querySelector('.cart-modal-overlay')) {
        createModalCart();
    }
    
    // Show the modal with animation
    const overlay = document.querySelector('.cart-modal-overlay');
    const modal = document.querySelector('.cart-modal');
    
    overlay.classList.add('active');
    setTimeout(() => {
        modal.classList.add('active');
    }, 50);
    
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden';
}

// Function to hide the modal cart
function hideModalCart() {
    const overlay = document.querySelector('.cart-modal-overlay');
    const modal = document.querySelector('.cart-modal');
    
    if (!overlay || !modal) return;
    
    modal.classList.remove('active');
    
    setTimeout(() => {
        overlay.classList.remove('active');
        // Re-enable body scrolling
        document.body.style.overflow = '';
    }, 300);
}

// Function to create the modal cart DOM elements
function createModalCart() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'cart-modal-overlay';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    
    // Create modal header
    const header = document.createElement('div');
    header.className = 'cart-modal-header';
    
    const title = document.createElement('div');
    title.className = 'cart-modal-title';
    title.textContent = 'Your Cart';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cart-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', hideModalCart);
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create modal body
    const body = document.createElement('div');
    body.className = 'cart-modal-body';
    body.id = 'modal-cart-items';
    
    // Create modal footer
    const footer = document.createElement('div');
    footer.className = 'cart-modal-footer';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-cart-btn';
    clearBtn.textContent = 'Clear Cart';
    clearBtn.addEventListener('click', () => {
        clearCart();
        hideModalCart();
    });
    
    const total = document.createElement('div');
    total.className = 'modal-cart-total';
    total.innerHTML = `Grand Total = ₹<span id="modal-grand-total-value">0</span>`;
    
    footer.appendChild(clearBtn);
    footer.appendChild(total);
    
    // Assemble the modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    
    overlay.appendChild(modal);
    
    // Add click handler to close when clicking outside the modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideModalCart();
        }
    });
    
    // Add to the DOM
    document.body.appendChild(overlay);
    
    // Populate with current cart items
    updateModalCartItems();
}

// Function to update the items in the modal cart
function updateModalCartItems() {
    const modalCartItems = document.getElementById('modal-cart-items');
    const modalGrandTotal = document.getElementById('modal-grand-total-value');
    
    if (!modalCartItems || !modalGrandTotal) return;
    
    modalCartItems.innerHTML = '';
    
    let grandTotal = 0;
    
    // Check if there are any items
    if (selectedItems.length === 0) {
        modalCartItems.innerHTML = '<p class="no-items">No items selected</p>';
        modalGrandTotal.textContent = '0';
        return;
    }
    
    // Loop through all selected items
    selectedItems.forEach((item, idx) => {
        const total = item.price * item.quantity;
        grandTotal += total;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'modal-cart-item';
        
        // Full details layout
        itemElement.innerHTML = `
            <div class="modal-cart-item-header">
                <div class="modal-cart-item-name">${idx + 1}) ${item.name}</div>
                <button class="remove-item-btn" data-index="${item.index}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="modal-cart-item-details">
                <div class="modal-cart-item-controls">
                    <button class="quantity-btn decrease-selected" data-index="${item.index}">-</button>
                    <span class="cart-quantity" data-index="${item.index}">${item.quantity}</span>
                    <button class="quantity-btn increase-selected" data-index="${item.index}">+</button>
                    <span class="item-price-display">×${item.price}</span>
                </div>
                <span class="modal-cart-item-price">₹${total}</span>
            </div>
        `;
        
        modalCartItems.appendChild(itemElement);
        
        // Add event listeners
        const increaseBtn = itemElement.querySelector('.increase-selected');
        const decreaseBtn = itemElement.querySelector('.decrease-selected');
        const removeBtn = itemElement.querySelector('.remove-item-btn');
        const qtyDisplay = itemElement.querySelector('.cart-quantity');
        
        increaseBtn.addEventListener('click', () => {
            increaseQuantity(item.index);
            updateModalCartItems(); // Update modal cart after change
        });
        
        decreaseBtn.addEventListener('click', () => {
            decreaseQuantity(item.index);
            updateModalCartItems(); // Update modal cart after change
        });
        
        removeBtn.addEventListener('click', () => {
            removeItem(item.index);
            updateModalCartItems(); // Update modal cart after change
            
            // If no items left, close the modal
            if (selectedItems.length === 0) {
                hideModalCart();
            }
        });
        
        qtyDisplay.addEventListener('click', () => {
            editQuantity(item.index);
            updateModalCartItems(); // Update modal cart after change
        });
    });
    
    // Update grand total
    modalGrandTotal.textContent = grandTotal;
}
function toggleCartCollapse() {
    const container = document.querySelector('.selected-items-container');
    container.classList.toggle('cart-collapsed');
    
    const arrowBtn = document.getElementById('toggle-cart-arrow');
    if (container.classList.contains('cart-collapsed')) {
        userCollapsed = true;
        arrowBtn.textContent = '↑'; // Arrow indicates tapping will expand
    } else {
        userCollapsed = false;
        arrowBtn.textContent = '↓'; // Arrow indicates tapping will collapse
    }
}

// Helper function to fix iOS scrolling issues
function setupIOSScrollFix() {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // Add class to body for iOS-specific CSS
        document.body.classList.add('ios-device');
        
        // Set up iOS momentum scroll fix
        document.addEventListener('touchmove', function(e) {
            // Check if the touch is in a scrollable element
            let isInScrollableArea = false;
            let target = e.target;
            
            while (target && target !== document.body) {
                const style = window.getComputedStyle(target);
                const overflowY = style.getPropertyValue('overflow-y');
                
                if (overflowY === 'scroll' || overflowY === 'auto') {
                    // Check if we're at the top or bottom boundary
                    if ((target.scrollTop <= 0 && e.touches[0].screenY > e.touches[0].screenY) || 
                        (target.scrollTop + target.clientHeight >= target.scrollHeight && 
                         e.touches[0].screenY < e.touches[0].screenY)) {
                        // At boundary, let document handle it
                        isInScrollableArea = false;
                    } else {
                        isInScrollableArea = true;
                        break;
                    }
                }
                target = target.parentNode;
            }
            
            // If we're not in a scrollable area, prevent default
            if (!isInScrollableArea) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Initialize the app when window loads
window.onload = init;

// Allow dismissing the cart with swipe on mobile - completely rewritten for better stability
function setupSwipeDismiss(element) {
    // Get the scrollable cart items container
    const itemsList = document.getElementById('selected-items-list');
    const headerArea = element.querySelector('.selected-items-header');
    
    // The header area will be the only region that allows dismissal swipes
    if (headerArea) {
        let touchStartY = 0;
        let touchStartX = 0;
        let isDismissGesture = false;
        
        // Touch start only on the header area
        headerArea.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isDismissGesture = false;
            
            // Clear any existing transitions/transforms
            element.style.transition = '';
            element.style.transform = '';
        }, { passive: true });
        
        // Touch move - only act on very clear downward swipes from the header
        headerArea.addEventListener('touchmove', function(e) {
            if (e.touches.length !== 1) return;
            
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const diffY = touchY - touchStartY;
            const diffX = touchX - touchStartX;
            
            // Only consider vertical movements that are clearly downward
            // and much more vertical than horizontal
            if (diffY > 20 && Math.abs(diffY) > Math.abs(diffX) * 2) {
                isDismissGesture = true;
                // Apply transform for visual feedback
                element.style.transform = `translateY(${diffY/3}px)`;
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch end - only dismiss if it was a significant downward swipe
        headerArea.addEventListener('touchend', function(e) {
            if (isDismissGesture) {
                const touchEndY = e.changedTouches[0].clientY;
                const diffY = touchEndY - touchStartY;
                
                // Only dismiss on a very deliberate downward swipe
                if (diffY > 100) {
                    element.style.transition = 'transform 0.3s ease-out';
                    element.style.transform = 'translateY(100%)';
                    
                    setTimeout(() => {
                        element.classList.remove('floating-cart');
                        element.style.transform = '';
                        element.style.transition = '';
                        isCartFloating = false;
                    }, 300);
                } else {
                    // Not enough to dismiss, reset position
                    element.style.transition = 'transform 0.2s ease-out';
                    element.style.transform = '';
                    
                    // Always clear the transition after it completes
                    setTimeout(() => {
                        element.style.transition = '';
                    }, 200);
                }
                
                isDismissGesture = false;
            }
        });
    }
    
    // For the items list, completely separate touch handling
    if (itemsList) {
        // Simple fix to prevent the cart from getting dismissed when scrolling items
        itemsList.addEventListener('touchstart', function(e) {
            e.stopPropagation(); // Don't let these events bubble up to the container
        }, { passive: true });
        
        itemsList.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        itemsList.addEventListener('touchend', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
    
    // Make sure the toggle button doesn't trigger unwanted effects
    const toggleButton = element.querySelector('.toggle-cart-arrow');
    if (toggleButton) {
        toggleButton.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
}

// Improved floating cart display - thoroughly cleaned up to avoid any animation issues
function showFloatingCartOnAdd() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only show floating cart if we've scrolled down enough
    if (window.scrollY > 100 && selectedItems.length > 0) {
        // Important: clear out any lingering transforms or transitions
        selectedItemsContainer.style.transform = '';
        selectedItemsContainer.style.transition = '';
        
        // Make sure any previous state is cleared
        selectedItemsContainer.classList.remove('floating-cart-fade');
        
        // CRITICAL FIX: Always remove any expand overlay before converting to floating cart
        const existingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Remove the has-more-items class to disable blur effect
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            selectedItemsList.classList.remove('has-more-items');
        }
        
        // Force a small delay to ensure previous style changes have been applied
        setTimeout(() => {
            selectedItemsContainer.classList.add('floating-cart');
            isCartFloating = true;
            
            // Final check to make sure overlay is gone
            const lateExistingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
            if (lateExistingOverlay) {
                lateExistingOverlay.remove();
            }
            
            // Setup improved scroll handling
            setupImprovedCartScroll();
            
            // Add custom swipe dismiss only after it's displayed
            setupSwipeDismiss(selectedItemsContainer);
            
            // Check if we need to show scroll indicator
            updateScrollIndicator();
            
            // Auto-hide after inactivity (except on mobile)
            if (window.innerWidth > 600) {
                setupAutoHide();
            }
        }, 10);
    }
}

// Better improved cart scroll behavior with cleaner event handling
function setupImprovedCartScroll() {
    const cartItemsList = document.getElementById('selected-items-list');
    
    if (!cartItemsList) return;
    
    // Clear any existing handlers
    cartItemsList.onwheel = null;
    
    // Make sure the cart has proper overflow handling
    cartItemsList.style.overflowY = 'auto';
    cartItemsList.style.WebkitOverflowScrolling = 'touch'; // Enable momentum scrolling on iOS
    
    // Add these attributes to improve scroll behavior
    cartItemsList.setAttribute('role', 'region');
    cartItemsList.setAttribute('aria-label', 'Selected items');
    
    // Improved wheel event handling for desktop only
    cartItemsList.addEventListener('wheel', function(e) {
        const isAtTop = this.scrollTop === 0;
        const isAtBottom = this.scrollHeight - this.scrollTop - this.clientHeight <= 1;
        
        // If at the top and trying to scroll up, or at the bottom and trying to scroll down,
        // let the parent page scroll
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            return; // Allow event to bubble up
        } else {
            // Otherwise, contain the scroll within the cart
            e.stopPropagation();
        }
    }, { passive: true });
    
    // Add a small delay before checking for overflow
    setTimeout(() => {
        updateScrollIndicator();
    }, 100);
}

// Function to prevent zooming on double tap
function preventZoom() {
    // For iOS Safari
    document.addEventListener('touchend', function(event) {
        // If the event's target is an interactive element like a button or input,
        // then allow the default behavior
        if (event.target.tagName === 'BUTTON' || 
            event.target.tagName === 'INPUT' || 
            event.target.tagName === 'SELECT' || 
            event.target.tagName === 'TEXTAREA' ||
            event.target.classList.contains('cart-quantity')) {
            return;
        }
        
        // Check if this is a double-tap
        const now = Date.now();
        const lastTouch = this.lastTouchEnd || now;
        const delta = now - lastTouch;
        
        // If the time between touches is small enough to be considered a double tap
        if (delta < 300 && delta > 0) {
            event.preventDefault();
        }
        
        this.lastTouchEnd = now;
    }, { passive: false });

    // General touch handling
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            // Multi-touch gestures like pinch-to-zoom
            e.preventDefault();
        }
    }, { passive: false });

    // Add CSS styles to prevent certain zoom behaviors
    const style = document.createElement('style');
    style.textContent = `
        * {
            touch-action: pan-x pan-y; /* Allow only scrolling, not zooming via touch */
        }
    `;
    document.head.appendChild(style);
}

window.onload = init;

// Separated function to ONLY handle floating cart scroll indicator - IMPROVED for 4-item threshold
function updateFloatingCartScrollIndicator() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    // Clean up any existing indicators
    cleanupScrollIndicators(container);
    
    // Make sure we don't have top cart classes
    itemsList.classList.remove('top-cart-has-more-items');
    
    // Changed threshold from 6 to 4 items
    if (selectedItems.length > 4 && itemsList.scrollHeight > itemsList.clientHeight) {
        // Add has-more-items class to container
        container.classList.add('has-more-items');
        
        // Create and add a scroll indicator for floating cart
        const indicator = document.createElement('div');
        indicator.className = 'scroll-more-indicator';
        indicator.innerHTML = 'Scroll for more items ↓';
        container.appendChild(indicator);
        
        // Show the indicator with a fade-in effect
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // Set up scroll position tracking for better indicator display
        const onScrollHandler = function() {
            if (itemsList.scrollTop > 10) { // If scrolled down at least a bit
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
                itemsList.removeEventListener('scroll', onScrollHandler);
            }
        };
        
        // Remove any existing listeners before adding a new one
        itemsList.removeEventListener('scroll', onScrollHandler);
        itemsList.addEventListener('scroll', onScrollHandler);
    } else {
        container.classList.remove('has-more-items');
    }
}

// Updated function to ensure better positioning and spacing for floating cart
function showFloatingCartOnAdd() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only show floating cart if we've scrolled down enough
    if (window.scrollY > 100 && selectedItems.length > 0) {
        // Important: clear out any lingering transforms or transitions
        selectedItemsContainer.style.transform = '';
        selectedItemsContainer.style.transition = '';
        
        // Make sure any previous state is cleared
        selectedItemsContainer.classList.remove('floating-cart-fade');
        
        // CRITICAL FIX: Always remove any expand overlay before converting to floating cart
        const existingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Remove any collapse buttons
        const existingCollapseButton = selectedItemsContainer.querySelector('.collapse-cart-button');
        if (existingCollapseButton) {
            existingCollapseButton.remove();
        }
        
        // Remove the has-more-items class to disable blur effect
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            selectedItemsList.classList.remove('has-more-items');
            selectedItemsList.classList.remove('top-cart-has-more-items');
        }
        
        // Force a small delay to ensure previous style changes have been applied
        setTimeout(() => {
            // Fixed position styling - ensure it's at the bottom and fixed there
            selectedItemsContainer.classList.remove('view-state-reset');
            selectedItemsContainer.classList.add('floating-cart');
            selectedItemsContainer.classList.add('bottom-floating-cart'); // Add class for bottom positioning
            isCartFloating = true;
            
            // Ensure it's fixed to bottom with no gap
            selectedItemsContainer.style.bottom = '0';
            selectedItemsContainer.style.marginBottom = '0';
            
            // Double check for clean state
            const lateExistingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
            if (lateExistingOverlay) {
                lateExistingOverlay.remove();
            }
            
            // Fix spacing - remove excessive padding/margins
            selectedItemsList.style.paddingBottom = '0';
            selectedItemsList.style.marginBottom = '0';
            
            // Setup improved scroll handling
            setupImprovedCartScroll();
            
            // Add custom swipe dismiss only after it's displayed
            setupSwipeDismiss(selectedItemsContainer);
            
            // Only update floating cart scroll indicator
            updateFloatingCartScrollIndicator();
            
            // Auto-hide after inactivity (except on mobile)
            if (window.innerWidth > 600) {
                setupAutoHide();
            }
        }, 50);
    }
}

// Improved function for cart scroll handling
function setupImprovedCartScroll() {
    const cartItemsList = document.getElementById('selected-items-list');
    
    if (!cartItemsList) return;
    
    // Reset any previous styling that might cause spacing issues
    cartItemsList.style.paddingBottom = '0';
    cartItemsList.style.marginBottom = '0';
    
    // Make sure the cart has proper overflow handling
    cartItemsList.style.overflowY = 'auto';
    cartItemsList.style.WebkitOverflowScrolling = 'touch'; // Enable momentum scrolling on iOS
    cartItemsList.style.maxHeight = 'min(65vh, 220px)'; // Fix height to show exactly 4 items
    
    // Add these attributes to improve scroll behavior
    cartItemsList.setAttribute('role', 'region');
    cartItemsList.setAttribute('aria-label', 'Selected items');
    
    // Add a small delay before checking for overflow
    setTimeout(() => {
        updateScrollIndicator();
    }, 100);
}

window.onload = init;

// Improved function to toggle cart collapse with better spacing control
function toggleCartCollapse() {
    const container = document.querySelector('.selected-items-container');
    const arrowBtn = document.getElementById('toggle-cart-arrow');
    const header = container.querySelector('.selected-items-header');
    
    // Toggle the collapsed class
    container.classList.toggle('cart-collapsed');
    
    // Update the arrow and user state
    if (container.classList.contains('cart-collapsed')) {
        userCollapsed = true;
        arrowBtn.textContent = '↑'; // Arrow indicates tapping will expand
        
        // Force it to sit at the bottom with no gap
        container.style.bottom = '0';
        container.style.marginBottom = '0';
        container.style.paddingBottom = '0';
        
        // Optimize header spacing
        if (header) {
            header.style.paddingTop = '5px';
            header.style.paddingBottom = '5px';
            header.style.marginBottom = '0';
            header.style.borderBottom = 'none';
        }
    } else {
        userCollapsed = false;
        arrowBtn.textContent = '↓'; // Arrow indicates tapping will collapse
        
        // Reset styles when expanded
        if (header) {
            header.style.paddingTop = '';
            header.style.paddingBottom = '';
            header.style.marginBottom = '';
            header.style.borderBottom = '';
        }
        
        // Check if we need to show scroll indicator
        if (isCartFloating) {
            updateFloatingCartScrollIndicator();
        }
    }
}

// Ensure appropriate spacing is applied when showing floating cart
function showFloatingCartOnAdd() {
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Only show floating cart if we've scrolled down enough
    if (window.scrollY > 100 && selectedItems.length > 0) {
        // Important: clear out any lingering transforms or transitions
        selectedItemsContainer.style.transform = '';
        selectedItemsContainer.style.transition = '';
        
        // Make sure any previous state is cleared
        selectedItemsContainer.classList.remove('floating-cart-fade');
        
        // CRITICAL FIX: Always remove any expand overlay before converting to floating cart
        const existingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Remove any collapse buttons
        const existingCollapseButton = selectedItemsContainer.querySelector('.collapse-cart-button');
        if (existingCollapseButton) {
            existingCollapseButton.remove();
        }
        
        // Remove the has-more-items class to disable blur effect
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            selectedItemsList.classList.remove('has-more-items');
            selectedItemsList.classList.remove('top-cart-has-more-items');
        }
        
        // Force a small delay to ensure previous style changes have been applied
        setTimeout(() => {
            // Fixed position styling - ensure it's at the bottom and fixed there
            selectedItemsContainer.classList.remove('view-state-reset');
            selectedItemsContainer.classList.add('floating-cart');
            selectedItemsContainer.classList.add('bottom-floating-cart'); // Add class for bottom positioning
            isCartFloating = true;
            
            // Ensure it's fixed to bottom with no gap
            selectedItemsContainer.style.bottom = '0';
            selectedItemsContainer.style.marginBottom = '0';
            
            // Optimize header spacing
            const header = selectedItemsContainer.querySelector('.selected-items-header');
            if (header) {
                header.style.padding = '8px 15px 5px';
            }
            
            // Double check for clean state
            const lateExistingOverlay = selectedItemsContainer.querySelector('.expand-cart-overlay');
            if (lateExistingOverlay) {
                lateExistingOverlay.remove();
            }
            
            // Fix spacing - remove excessive padding/margins
            if (selectedItemsList) {
                selectedItemsList.style.paddingBottom = '0';
                selectedItemsList.style.marginBottom = '0';
            }
            
            // If cart was previously collapsed by user, apply collapsed state with proper spacing
            if (userCollapsed) {
                selectedItemsContainer.classList.add('cart-collapsed');
                const arrowBtn = document.getElementById('toggle-cart-arrow');
                if (arrowBtn) {
                    arrowBtn.textContent = '↑';
                }
                
                // Ensure the header is properly styled in collapsed state with minimal spacing
                if (header) {
                    header.style.paddingTop = '5px';
                    header.style.paddingBottom = '5px';
                    header.style.marginBottom = '0';
                    header.style.borderBottom = 'none';
                }
            }
            
            // Setup improved scroll handling
            setupImprovedCartScroll();
            
            // Add custom swipe dismiss only after it's displayed
            setupSwipeDismiss(selectedItemsContainer);
            
            // Only update floating cart scroll indicator if not collapsed
            if (!userCollapsed) {
                updateFloatingCartScrollIndicator();
            }
            
            // Auto-hide after inactivity (except on mobile)
            if (window.innerWidth > 600 && !userCollapsed) {
                setupAutoHide();
            }
        }, 50);
    }
}
