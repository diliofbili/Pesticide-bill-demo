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

    // Immediately display "No items selected" message in the cart
    updateSelectedItemsList();
    
    // Add scroll event listener for floating cart
    window.addEventListener('scroll', handleScroll);

    const arrowBtn = document.getElementById('toggle-cart-arrow');
    arrowBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent any other cart click actions
        toggleCartCollapse();
    });
    
    // Hide the green arrow on initial load
    if (arrowBtn) {
        arrowBtn.style.display = 'none';
    }
    
    // Set up cart click handler for modal view
    setupCartClickHandler();
    
    // Fetch data
    fetchPesticideData();

    // Add setup for better scrolling on iOS
    setupIOSScrollFix();
    
    // Initialize the expand cart overlay
    updateExpandCartOverlay();
    
    // Ensure full screen layout
    ensureFullScreenLayout();
    
    // Prevent zoom on double tap/click
    preventZoom();

    // IMPORTANT: Prevent pull-to-refresh behavior
    preventPullToRefresh();
    
    // Add scroll event listener for fixed search bar with passive option for performance
    window.addEventListener('scroll', handleSearchBarScroll, { passive: true });
    
    // Also call once on initial load
    setTimeout(handleSearchBarScroll, 0);
    
    // Set up resize handler
    setupResizeHandler();

    // Handle closing of expanded item names when tapping elsewhere
    document.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.selected-item-name')) {
            document.querySelectorAll('.selected-item-name.expanded').forEach(el => {
                el.classList.remove('expanded');
            });
        }
    });

    // Global event handler for edit buttons
    document.addEventListener('click', function(event) {
        const editButton = event.target.closest('.edit-price-btn');
        if (editButton) {
            event.stopPropagation();
            const index = parseInt(editButton.getAttribute('data-index'));
            toggleEditOptionsMenu(index, event);
        }
    });

    // Hide menus when clicking elsewhere
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.edit-price-btn') && 
            !event.target.closest('.edit-options-menu')) {
            hideAllEditMenus();
        }
    });

    // Hide menus when scrolling
    document.addEventListener('scroll', function() {
        hideAllEditMenus();
    }, { passive: true });
}

// Prevent pull-to-refresh functionality
function preventPullToRefresh() {
    // For modern browsers
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    // For iOS Safari specifically
    document.addEventListener('touchstart', function(e) {
        // Store the initial touch position
        if (e.touches.length === 1) {
            // Single touch only
            this.touchStartY = e.touches[0].clientY;
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        // If we're at the top of the page and trying to scroll up/down
        if (e.touches.length === 1) {
            const touchY = e.touches[0].clientY;
            const touchDiff = touchY - this.touchStartY;

            // If we're at the top and trying to scroll down (refresh gesture)
            if (window.scrollY === 0 && touchDiff > 5) {
                // Prevent the default behavior
                e.preventDefault();
            }

            // Also prevent overscroll from bottom when already at bottom
            if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight && touchDiff < 0) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // Remove bounce effect in iOS Safari
    document.addEventListener('scroll', function() {
        if (window.scrollY === 0) {
            document.body.classList.add('at-top');
        } else {
            document.body.classList.remove('at-top');
        }
    });

    // Handle orientation changes which might trigger unwanted refreshes
    window.addEventListener('orientationchange', function() {
        window.scrollTo(0, 0);
    });
    
    // Additional handler for Android Chrome
    let lastTouchY = 0;
    let startTouchY = 0;
    
    document.addEventListener('touchstart', function(e) {
        startTouchY = e.touches[0].clientY;
        lastTouchY = startTouchY;
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        const touchDiff = touchY - lastTouchY;
        lastTouchY = touchY;
        
        // If we're at the top of the page and user is pulling down
        if (window.scrollY <= 0 && (touchY - startTouchY > 10)) {
            e.preventDefault();
            return false;
        }
        
        // If we're at the bottom and user is pulling up
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY + window.innerHeight;
        if (scrollHeight - scrollPosition <= 1 && touchDiff < 0) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Add momentum scrolling for iOS but prevent refresh
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.WebkitOverflowScrolling = 'touch';
        appContainer.style.overscrollBehavior = 'none';
    }
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
    // Don't modify the search bar in this function - we have a separate handler
    
    const scrollPosition = window.scrollY;
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Adjust the threshold to account for the new positioning
    const cartThreshold = selectedItemsContainer.offsetHeight + 20; // Cart height plus some padding
    const arrowBtn = document.getElementById('toggle-cart-arrow');
    
    const isScrollingDown = scrollPosition > lastScrollPosition;
    lastScrollPosition = scrollPosition;
    
    // CRITICAL FIX: ALWAYS hide the arrow in the top cart (non-floating state), no exceptions
    if (!isCartFloating && arrowBtn) {
        arrowBtn.style.display = 'none';
    }
    
    // Check if we're at the bottom of the page to auto-collapse the cart
    const isAtBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 50;
    
    // Auto-collapse the cart when we reach the bottom
    if (isAtBottom && isCartFloating && !userCollapsed) {
        selectedItemsContainer.classList.add('cart-collapsed');
        if (arrowBtn) arrowBtn.textContent = '↑';
        // Don't set userCollapsed flag here since this is auto-collapse, not user action
    }
    
    // Auto-expand the cart when scrolling up from the bottom (but only if it was auto-collapsed)
    if (!isScrollingDown && isAtBottom && isCartFloating && 
        selectedItemsContainer.classList.contains('cart-collapsed') && !userCollapsed) {
        selectedItemsContainer.classList.remove('cart-collapsed');
        if (arrowBtn) arrowBtn.textContent = '↓';
    }
    
    // Floating cart logic - update the threshold value to account for new layout
    if (isScrollingDown && scrollPosition > cartThreshold && !isCartFloating && selectedItems.length > 0) {
        // Add view-state-reset class to ensure clean transition
        selectedItemsContainer.classList.add('view-state-reset');
        selectedItemsContainer.classList.add('transitioning');
        
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
            
            // IMPORTANT: Only show the arrow when we're in floating cart mode
            if (arrowBtn && isCartFloating) {
                arrowBtn.style.display = 'inline-block';
            }
            
            // Remove transitioning class after animation
            setTimeout(() => {
                selectedItemsContainer.classList.remove('transitioning');
            }, 300);
        }, 50);
    } else if ((!isScrollingDown && scrollPosition < cartThreshold) || selectedItems.length === 0) {
        // Add view-state-reset class to ensure clean transition
        selectedItemsContainer.classList.add('view-state-reset');
        selectedItemsContainer.classList.add('transitioning');
        
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
        
        // CRITICAL FIX: ALWAYS hide arrow when returning to non-floating state
        if (arrowBtn) {
            arrowBtn.style.display = 'none';
        }
        
        // Re-apply overlay when returning to static cart if needed
        // Small delay to ensure DOM is updated first
        setTimeout(() => {
            selectedItemsContainer.classList.remove('view-state-reset');
            if (!isCartFloating && selectedItems.length > 4) {
                updateTopCartOverlay();
            }
            
            // Remove transitioning class after animation
            setTimeout(() => {
                selectedItemsContainer.classList.remove('transitioning');
            }, 300);
        }, 100);
    }
    
    // IMPORTANT: Remove the original conditional display logic that was causing the flicker
    // Instead, only show arrow in floating cart mode
    if (arrowBtn) {
        if (isCartFloating) {
            arrowBtn.style.display = 'inline-block';
        } else {
            arrowBtn.style.display = 'none';
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
                            <button class="edit-price-btn" data-index="${originalIndex}" title="Edit options">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <div class="edit-options-menu" id="edit-menu-${originalIndex}">
                                <button class="edit-option edit-price-option" data-index="${originalIndex}">
                                    <i class="fas fa-rupee-sign"></i>Edit Price
                                </button>
                                <button class="edit-option edit-quantity-option" data-index="${originalIndex}">
                                    <i class="fas fa-balance-scale"></i>Edit Quantity
                                </button>
                            </div>
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
            
            // The edit button click is now handled by the global click handler
            
            // Add event listeners for the edit options
            itemElement.querySelector('.edit-price-option').addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent menu from closing
                const idx = parseInt(this.getAttribute('data-index'));
                hideAllEditMenus();
                editPrice(idx);
            });
            
            itemElement.querySelector('.edit-quantity-option').addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent menu from closing
                const idx = parseInt(this.getAttribute('data-index'));
                hideAllEditMenus();
                editItemQuantity(idx);
            });
        }
    });
    
    // Add a global click handler to close the edit options menu when clicking elsewhere
    document.addEventListener('click', function() {
        hideAllEditMenus();
    });
}

// Function to toggle the edit options menu
function toggleEditOptionsMenu(index, event) {
    // Hide all other menus first
    hideAllEditMenus();
    
    const menu = document.getElementById(`edit-menu-${index}`);
    if (menu) {
        // Position the menu absolutely in the viewport
        menu.style.position = 'fixed';
        
        // Get button position relative to viewport
        const button = event.currentTarget || event.target.closest('.edit-price-btn');
        const buttonRect = button.getBoundingClientRect();
        
        // Default positioning (below and centered on the button)
        const menuWidth = 160; // Approximated menu width
        let leftPos = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2);
        let topPos = buttonRect.bottom + 5; // 5px below the button
        
        // Check if menu would go off the right edge of the screen
        if (leftPos + menuWidth > window.innerWidth) {
            leftPos = window.innerWidth - menuWidth - 10; // 10px from right edge
        }
        
        // Check if menu would go off the left edge of the screen
        if (leftPos < 10) {
            leftPos = 10; // 10px from left edge
        }
        
        // Check if menu would go off the bottom of the screen
        const estimatedMenuHeight = 80; // Approximated height (2 options)
        if (topPos + estimatedMenuHeight > window.innerHeight) {
            // Position above the button if it would go off the bottom
            topPos = buttonRect.top - estimatedMenuHeight - 5;
            
            // If that would go off the top, position to the side
            if (topPos < 0) {
                topPos = Math.max(5, buttonRect.top);
                leftPos = buttonRect.right + 5; // Position to the right of the button
                
                // If that would go off the right edge, position to the left
                if (leftPos + menuWidth > window.innerWidth) {
                    leftPos = Math.max(5, buttonRect.left - menuWidth - 5);
                }
            }
        }
        
        // Set the calculated position
        menu.style.left = `${leftPos}px`;
        menu.style.top = `${topPos}px`;
        
        // Show the menu
        menu.classList.add('show');
        
        // Prevent the click from propagating and closing the menu immediately
        event.stopPropagation();
    }
}

// Hide all edit option menus
function hideAllEditMenus() {
    const menus = document.querySelectorAll('.edit-options-menu');
    menus.forEach(menu => {
        menu.classList.remove('show');
    });
}

// New function to edit item quantity
function editItemQuantity(index) {
    const item = pesticideData[index];
    
    // Don't process if it's a salt category
    if (item.price === 0) return;
    
    // Get the original name to display in the prompt
    const originalName = item.name;
    
    // Enhanced regex to detect more quantity patterns:
    // - Handles spaces or no spaces between number and unit (1kg, 1 kg)
    // - Handles quantities that might not be at the end (3kg drum)
    // - Supports more unit formats and abbreviations
    const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|gm|gms|gram|grams|g|l|lt|ltr|ltrs|liter|litre|liters|litres|ml|mls|milliliter|millilitre|mg|mgs|milligram|milligrams|tablets|tabs|pcs|pieces|capsules|caps)\b/i;
    const match = originalName.match(quantityRegex);
    
    if (match) {
        let originalQuantity = match[1]; // The numeric part
        let originalUnit = match[2].toLowerCase(); // The unit part
        
        // Standardize unit names
        if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(originalUnit)) {
            originalUnit = 'kg';
        } else if (['gm', 'gms', 'gram', 'grams', 'g'].includes(originalUnit)) {
            originalUnit = 'gm';
        } else if (['l', 'lt', 'ltr', 'ltrs', 'liter', 'litre', 'liters', 'litres'].includes(originalUnit)) {
            originalUnit = 'l';
        } else if (['ml', 'mls', 'milliliter', 'millilitre'].includes(originalUnit)) {
            originalUnit = 'ml';
        }
        
        // Extract the base name (everything except the matched quantity)
        let baseName = originalName.replace(match[0], '').trim();
        
        // If we removed the quantity from the middle, clean up any double spaces
        baseName = baseName.replace(/\s+/g, ' ').trim();
        
        // Convert kg to grams and l/liter/litre to ml for the edit dialog
        let displayQuantity = originalQuantity;
        let displayUnit = originalUnit;
        
        if (originalUnit === 'kg') {
            // Convert kg to grams for editing
            displayQuantity = parseFloat(originalQuantity) * 1000;
            displayUnit = 'gm';
        } 
        else if (originalUnit === 'l') {
            // Convert l/liter/litre to ml for editing
            displayQuantity = parseFloat(originalQuantity) * 1000;
            displayUnit = 'ml';
        }
        
        // Prompt with the original quantity if detected, with conversions applied
        let promptMessage = `Enter new quantity for ${baseName} (current: ${displayQuantity} ${displayUnit}):`;
        
        showEditModal({
            title: 'Edit Quantity',
            label: promptMessage,
            inputType: 'number',
            defaultValue: displayQuantity,
            placeholder: `Enter new quantity in ${displayUnit}`,
            confirmText: 'Update Quantity'
        }).then(newQuantityInput => {
            if (newQuantityInput !== null && newQuantityInput.trim() !== '') {
                // Clean up the input - accept only numbers
                const newQuantity = newQuantityInput.trim();
                
                if (isNaN(parseFloat(newQuantity))) {
                    showToast('Please enter a valid number for quantity', 'error');
                    return;
                }
                
                // Calculate new price based on the ratio of quantities, accounting for unit conversions
                let newPrice = item.price;
                let finalQuantity = parseFloat(newQuantity);
                let finalUnit = displayUnit;
                
                // Calculate the price ratio correctly based on the converted units
                if (originalUnit === 'kg') {
                    // Convert input grams to original kg for ratio calculation
                    const ratio = finalQuantity / (parseFloat(originalQuantity) * 1000);
                    newPrice = Math.round(item.price * ratio);
                    
                    // For display, convert back to appropriate units if needed
                    if (finalQuantity >= 1000) {
                        finalQuantity = finalQuantity / 1000;
                        finalUnit = 'kg';
                    }
                } 
                else if (originalUnit === 'l' || originalUnit === 'liter' || originalUnit === 'litre') {
                    // Convert input ml to original l for ratio calculation
                    const ratio = finalQuantity / (parseFloat(originalQuantity) * 1000);
                    newPrice = Math.round(item.price * ratio);
                    
                    // For display, convert back to appropriate units if needed
                    if (finalQuantity >= 1000) {
                        finalQuantity = finalQuantity / 1000;
                        finalUnit = originalUnit; // Keep original l/liter/litre unit
                    }
                } 
                else {
                    // Standard calculation for other units
                    const ratio = parseFloat(newQuantity) / parseFloat(originalQuantity);
                    newPrice = Math.round(item.price * ratio);
                }
                
                // Check if this item is already in the cart
                const cartItemIndex = selectedItems.findIndex(i => i.index === index);
                
                if (cartItemIndex !== -1) {
                    // Item is already in cart, update its display name and price
                    const oldCartItem = selectedItems[cartItemIndex];
                    
                    // Construct the new name with custom quantity
                    let newName = `${baseName} ${finalQuantity} ${finalUnit}`;
                    
                    // Store the original name and custom quantity details
                    selectedItems[cartItemIndex] = {
                        ...oldCartItem,
                        displayName: newName,
                        originalName: originalName,
                        customQuantity: true,
                        customQuantityValue: finalQuantity,
                        customQuantityUnit: finalUnit,
                        originalPrice: item.price,
                        price: newPrice
                    };
                    
                    // Update cart display
                    updateSelectedItemsList();
                    
                    // Show success message
                    showToast(`Updated quantity to ${finalQuantity} ${finalUnit} and adjusted price to ₹${newPrice}`);
                } else {
                    // Item not in cart yet, add it with quantity 1
                    const quantityDisplay = document.getElementById(`quantity-${index}`);
                    const currentQuantity = parseInt(quantityDisplay.textContent);
                    
                    if (currentQuantity === 0) {
                        // Add item to cart with quantity 1
                        quantityDisplay.textContent = "1";
                        
                        // Construct the new name with custom quantity
                        let newName = `${baseName} ${finalQuantity} ${finalUnit}`;
                        
                        // Add to selected items with custom quantity
                        selectedItems.push({
                            index: index,
                            name: originalName,  // Keep the original name for reference
                            displayName: newName, // New name to display in cart
                            company: item.company,
                            price: newPrice,
                            originalPrice: item.price,
                            quantity: 1,
                            customQuantity: true,
                            customQuantityValue: finalQuantity,
                            customQuantityUnit: finalUnit
                        });
                        
                        // Update UI
                        updateSelectedItemsList();
                        showFloatingCartOnAdd();
                        
                        // Show success message
                        showToast(`Added ${newName} to cart with adjusted price ₹${newPrice}`);
                    } else {
                        // Item is in counting but not in cart (shouldn't happen normally)
                        showToast('Please add this item to the cart first', 'info');
                    }
                }
            }
        });
        return; // Exit after handling matched quantity
    }
    
    // Default handling for items without detected quantities
    let promptMessage = `Enter new quantity for ${originalName}:`;
    
    showEditModal({
        title: 'Edit Quantity',
        label: promptMessage,
        inputType: 'number',
        defaultValue: originalQuantity,
        placeholder: 'Enter new quantity',
        confirmText: 'Update Quantity'
    }).then(newQuantityInput => {
        if (newQuantityInput !== null && newQuantityInput.trim() !== '') {
            // Clean up the input - accept only numbers
            const newQuantity = newQuantityInput.trim();
            
            if (isNaN(parseInt(newQuantity))) {
                showToast('Please enter a valid number for quantity', 'error');
                return;
            }
            
            // Calculate new price based on the ratio of quantities
            let newPrice = item.price;
            
            if (originalQuantity && parseFloat(originalQuantity) > 0) {
                const ratio = parseFloat(newQuantity) / parseFloat(originalQuantity);
                newPrice = Math.round(item.price * ratio);
            }
            
            // Check if this item is already in the cart
            const cartItemIndex = selectedItems.findIndex(i => i.index === index);
            
            if (cartItemIndex !== -1) {
                // Item is already in cart, update its display name and price
                const oldCartItem = selectedItems[cartItemIndex];
                
                // Construct the new name with custom quantity
                let newName = originalName;
                if (originalQuantity && originalUnit) {
                    newName = `${baseName} ${newQuantity} ${originalUnit}`;
                }
                
                // Store the original name and custom quantity details
                selectedItems[cartItemIndex] = {
                    ...oldCartItem,
                    displayName: newName,
                    originalName: originalName,
                    customQuantity: true,
                    customQuantityValue: newQuantity,
                    customQuantityUnit: originalUnit,
                    originalPrice: item.price,
                    price: newPrice
                };
                
                // Update cart display
                updateSelectedItemsList();
                
                // Show success message
                showToast(`Updated quantity to ${newQuantity} ${originalUnit} and adjusted price to ₹${newPrice}`);
            } else {
                // Item not in cart yet, add it with quantity 1
                const quantityDisplay = document.getElementById(`quantity-${index}`);
                const currentQuantity = parseInt(quantityDisplay.textContent);
                
                if (currentQuantity === 0) {
                    // Add item to cart with quantity 1
                    quantityDisplay.textContent = "1";
                    
                    // Construct the new name with custom quantity
                    let newName = originalName;
                    if (originalQuantity && originalUnit) {
                        newName = `${baseName} ${newQuantity} ${originalUnit}`;
                    }
                    
                    // Add to selected items with custom quantity
                    selectedItems.push({
                        index: index,
                        name: originalName,  // Keep the original name for reference
                        displayName: newName, // New name to display in cart
                        company: item.company,
                        price: newPrice,
                        originalPrice: item.price,
                        quantity: 1,
                        customQuantity: true,
                        customQuantityValue: newQuantity,
                        customQuantityUnit: originalUnit
                    });
                    
                    // Update UI
                    updateSelectedItemsList();
                    showFloatingCartOnAdd();
                    
                    // Show success message
                    showToast(`Added ${newName} to cart with adjusted price ₹${newPrice}`);
                } else {
                    // Item is in counting but not in cart (shouldn't happen normally)
                    showToast('Please add this item to the cart first', 'info');
                }
            }
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
    
    // Add a subtle animation effect
    quantityDisplay.classList.add('updating');
    
    // Update the quantity display without causing reflow
    requestAnimationFrame(() => {
        quantityDisplay.textContent = newQuantity;
        
        // Remove animation class after update completes
        setTimeout(() => {
            quantityDisplay.classList.remove('updating');
        }, 150);
    });
    
    // Update selected items
    const existingItem = selectedItems.find(i => i.index === index);
    if (existingItem) {
        existingItem.quantity = newQuantity;
        
        // Update only the specific cart item without redrawing the entire cart
        updateSingleCartItem(existingItem);
    } else {
        selectedItems.push({
            index: index,
            name: item.name,
            company: item.company,
            price: item.price,
            quantity: newQuantity
        });
        
        // For new item we need to update the entire cart
        updateSelectedItemsList();
    }
    
    // Update grand total without full redraw
    updateGrandTotalOnly();
    
    // Show floating cart if needed
    if (currentQuantity === 0) { // First item added
        showFloatingCartOnAdd();
    }
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
        
        // Add a subtle animation effect
        quantityDisplay.classList.add('updating');
        
        // Update the quantity display without causing reflow
        requestAnimationFrame(() => {
            quantityDisplay.textContent = newQuantity;
            
            // Remove animation class after update completes
            setTimeout(() => {
                quantityDisplay.classList.remove('updating');
            }, 150);
        });
        
        // Update selected items
        const itemIndex = selectedItems.findIndex(i => i.index === index);
        if (itemIndex !== -1) {
            if (newQuantity === 0) {
                // Use optimized removal without full cart redraw
                removeItemWithAnimation(itemIndex);
            } else {
                // Update existing cart item quantity
                selectedItems[itemIndex].quantity = newQuantity;
                updateSingleCartItem(selectedItems[itemIndex]);
            }
        }
        
        // Update grand total without full redraw
        updateGrandTotalOnly();
    }
}

// Remove item completely from cart - IMPROVED for instant visual feedback
function removeItem(index) {
    // Find the item in selected items
    const itemIndex = selectedItems.findIndex(i => i.index === index);
    if (itemIndex !== -1) {
        // Reset quantity display in the main list
        const quantityDisplay = document.getElementById(`quantity-${index}`);
        if (quantityDisplay) {
            quantityDisplay.textContent = "0";
        }
        
        // Use the optimized removal with instantaneous animation
        removeItemWithAnimation(itemIndex);
        
        // Update grand total without full redraw
        updateGrandTotalOnly();
    }
}

// New function to remove item with instant visual feedback
function removeItemWithAnimation(itemIndex) {
    const item = selectedItems[itemIndex];
    const cartItemElement = document.querySelector(`.selected-item[data-index="${item.index}"]`);
    const selectedItemsList = document.getElementById('selected-items-list');
    
    if (cartItemElement) {
        // Add a class to the list during removal to prevent layout shifts
        selectedItemsList?.classList.add('removing-item');
        
        // Get the height and position before removal for smoother transition
        const itemHeight = cartItemElement.offsetHeight;
        const itemPosition = cartItemElement.offsetTop;
        
        // Mark the element as being removed instantly
        cartItemElement.classList.add('removing');
        cartItemElement.style.height = `${itemHeight}px`;
        cartItemElement.style.top = `${itemPosition}px`;
        
        // Make the item disappear visually INSTANTLY
        cartItemElement.style.opacity = '0';
        cartItemElement.style.visibility = 'hidden';
        
        // Remove from selected items array immediately
        selectedItems.splice(itemIndex, 1);
        
        // Very short timeout to complete the animation and DOM removal
        setTimeout(() => {
            // If cart is now empty, update everything
            if (selectedItems.length === 0) {
                updateSelectedItemsList();
                
                // If no more items, remove floating cart
                if (isCartFloating) {
                    const selectedItemsContainer = document.querySelector('.selected-items-container');
                    selectedItemsContainer.classList.remove('floating-cart');
                    selectedItemsContainer.classList.remove('bottom-floating-cart');
                    isCartFloating = false;
                }
            } else {
                // Remove element from DOM
                cartItemElement.remove();
                
                // Update scroll indicator if needed
                if (isCartFloating) {
                    updateFloatingCartScrollIndicator();
                }
            }
            
            // Remove helper class from list
            selectedItemsList?.classList.remove('removing-item');
        }, 50); // Much shorter timeout - just enough for the browser to process
    } else {
        // Fallback if element not found
        selectedItems.splice(itemIndex, 1);
        updateSelectedItemsList();
    }
}

// Clear the entire cart - IMPROVED to properly clean up UI elements
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
    
    // Properly clean up all UI states
    const selectedItemsContainer = document.querySelector('.selected-items-container');
    
    // Remove floating cart state if active
    if (isCartFloating) {
        selectedItemsContainer.classList.remove('floating-cart');
        selectedItemsContainer.classList.remove('bottom-floating-cart');
        isCartFloating = false;
    }
    
    // Remove expanded state if active
    selectedItemsContainer.classList.remove('expanded');
    
    // Remove any expand cart overlay
    const existingOverlay = document.querySelector('.expand-cart-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Remove any collapse button
    const existingCollapseButton = document.querySelector('.collapse-cart-button');
    if (existingCollapseButton) {
        existingCollapseButton.remove();
    }
    
    // Remove any scroll indicators
    const existingIndicator = document.querySelector('.scroll-more-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Reset all classes related to items list
    const selectedItemsList = document.getElementById('selected-items-list');
    if (selectedItemsList) {
        selectedItemsList.classList.remove('has-more-items');
        selectedItemsList.classList.remove('top-cart-has-more-items');
        // Reset any inline styles
        selectedItemsList.style = '';
    }
    
    // Update UI to show empty state
    updateSelectedItemsList();
    updateModalCartItems(); // Update modal cart if open
    
    // Hide the modal cart if it's open
    if (document.querySelector('.cart-modal-overlay.active')) {
        hideModalCart();
    }
    
    // Show toast notification
    showToast('Cart cleared successfully', 'info');
}

// Update the function to check for more items in the top cart
function updateSelectedItemsList() {
    const selectedItemsList = document.getElementById('selected-items-list');
    selectedItemsList.innerHTML = '';

    let grandTotal = 0;

    if (selectedItems.length === 0) {
        // Enhanced empty state message with improved styling
        selectedItemsList.innerHTML = '<p class="no-items">No items selected</p>';
        document.getElementById('grand-total-value').textContent = '0';
        
        // Clear any special cart states
        const container = document.querySelector('.selected-items-container');
        container.classList.remove('expanded');
        
        // Remove any overlay or indicator when empty
        cleanupScrollIndicators(container);
        
        return;
    }

    selectedItems.forEach((item) => {
        const total = item.price * item.quantity;
        grandTotal += total;

        const itemElement = document.createElement('div');
        itemElement.className = 'selected-item';
        itemElement.setAttribute('data-index', item.index);

        // Use displayName if available, otherwise use name
        const displayName = item.displayName || item.name;

        // Updated structure with improved layout
        itemElement.innerHTML = `
        <div class="selected-item-row">
          <!-- Item name with full width -->
          <span class="selected-item-name" title="${displayName}">${displayName}</span>
          
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
        
        // Add click handler for quantity display to edit quantity directly
        const quantityDisplay = itemElement.querySelector('.cart-quantity');
        if (quantityDisplay) {
            quantityDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                editQuantity(item.index);
            });
        }
        
        // Add click handler for item name to show full text when long
        const itemName = itemElement.querySelector('.selected-item-name');
        if (itemName) {
            // Check if the text is actually truncated
            itemName.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // First, remove expanded class from any other item names
                document.querySelectorAll('.selected-item-name.expanded').forEach(el => {
                    if (el !== this) el.classList.remove('expanded');
                });
                
                // Check if name is truncated (clientWidth < scrollWidth means text is truncated)
                if (this.offsetWidth < this.scrollWidth) {
                    this.classList.toggle('expanded');
                    
                    // Add click handler to body to close expanded name when clicking elsewhere
                    if (this.classList.contains('expanded')) {
                        setTimeout(() => {
                            const closeExpandedName = (e) => {
                                if (!itemName.contains(e.target)) {
                                    itemName.classList.remove('expanded');
                                    document.body.removeEventListener('click', closeExpandedName);
                                }
                            };
                            document.body.addEventListener('click', closeExpandedName);
                        }, 10);
                    }
                }
            });
        }
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

// Separated function to ONLY handle floating cart scroll indicator - Revert to original version
function updateFloatingCartScrollIndicator() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    // Clean up any existing indicators
    const existingIndicator = container.querySelector('.scroll-more-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Make sure we don't have top cart classes
    itemsList.classList.remove('top-cart-has-more-items');
    
    // Check if we have more than 4 items and content is scrollable
    if (selectedItems.length > 4 && itemsList.scrollHeight > itemsList.clientHeight) {
        // Add has-more-items class to container
        container.classList.add('has-more-items');
        
        // Create and add a scroll indicator for floating cart
        const indicator = document.createElement('div');
        indicator.className = 'scroll-more-indicator';
        indicator.id = 'scroll-more-indicator';
        container.appendChild(indicator);
        
        // Show the indicator with a fade-in effect
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // Calculate the scroll threshold - consider it "at end" when we're 20px from the bottom
        const endThreshold = 20;
        
        // IMPROVED: Only hide when scrolled almost to the very end
        const onScrollHandler = function() {
            const scrollBottom = itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight;
            
            if (scrollBottom < endThreshold) {
                // User has scrolled near the end, hide the indicator
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
                itemsList.removeEventListener('scroll', onScrollHandler);
            } else if (itemsList.scrollTop < 10) {
                // IMPROVED: User has scrolled back to top, show indicator again
                indicator.style.opacity = '1';
            }
        };
        
        // Remove any existing listeners before adding a new one
        itemsList.removeEventListener('scroll', onScrollHandler);
        itemsList.addEventListener('scroll', onScrollHandler);
    } else {
        container.classList.remove('has-more-items');
    }
}

// Helper function to clean up scroll indicators - Enhanced to handle all overlay elements
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
    
    // Also remove any has-more-items classes
    const selectedItemsList = document.getElementById('selected-items-list');
    if (selectedItemsList) {
        selectedItemsList.classList.remove('has-more-items');
        selectedItemsList.classList.remove('top-cart-has-more-items');
    }
}

// Add a flag to track if the list was hidden before searching
let listWasHiddenBeforeSearch = false;

// Handle search functionality - Fix to show salt categories with matching items
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const itemsContainer = document.getElementById('all-items-container');
    const toggleButton = document.getElementById('toggle-list-btn');
    
    // If starting a search and list is hidden, remember this state
    if (searchTerm && itemsContainer.classList.contains('hidden')) {
        listWasHiddenBeforeSearch = true;
        // Show the list when searching
        itemsContainer.classList.remove('hidden');
    }
    
    // If search is cleared and list was hidden before searching, hide it again
    if (!searchTerm && listWasHiddenBeforeSearch) {
        itemsContainer.classList.add('hidden');
        toggleButton.textContent = 'Show List';
        listWasHiddenBeforeSearch = false;
    } else if (searchTerm) {
        // Keep correct button text while searching
        toggleButton.textContent = 'Hide List';
    }
    
    // Step 1: First pass to identify all matching items and categories
    const matchingItems = new Set(); // Track the indices of matching items
    const matchingSaltCategories = new Set(); // Track matching salt categories
    
    // Find all direct matches first
    pesticideData.forEach((item, index) => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm) || 
            (item.company && item.company.toLowerCase().includes(searchTerm)) ||
            (item.saltComposition && item.saltComposition.toLowerCase().includes(searchTerm));
            
        if (matchesSearch) {
            matchingItems.add(index);
            
            // If this is a salt category, add it to matching categories
            if (item.price === 0) {
                matchingSaltCategories.add(item.name);
            }
        }
    });
    
    // Step 2: Second pass to include all items belonging to matching salt categories
    let currentSaltCategory = null;
    pesticideData.forEach((item, index) => {
        // Track the current salt category
        if (item.price === 0) {
            currentSaltCategory = item.name;
        }
        
        // If this item's salt category is in our matching set but the item itself wasn't a direct match
        if (currentSaltCategory && 
            matchingSaltCategories.has(currentSaltCategory) && 
            !matchingItems.has(index)) {
            matchingItems.add(index);
        }
    });
    
    // Step 3: Construct final filtered list preserving order and salt categories
    const filteredItems = [];
    let includeNextItems = false;
    let lastAddedSaltCategory = null;
    
    pesticideData.forEach((item, index) => {
        // Always reset includeNextItems when we hit a new salt category
        if (item.price === 0) {
            includeNextItems = matchingSaltCategories.has(item.name);
            lastAddedSaltCategory = null; // Reset last added category
        }
        
        if (matchingItems.has(index)) {
            // If this is a regular item and we haven't added its salt category yet, add it first
            if (item.price > 0) {
                let saltCategoryForItem = null;
                // Find this item's salt category by scanning backward
                for (let i = index - 1; i >= 0; i--) {
                    if (pesticideData[i].price === 0) {
                        saltCategoryForItem = pesticideData[i];
                        break;
                    }
                }
                
                // If we found a salt category and haven't added it yet, add it first
                if (saltCategoryForItem && saltCategoryForItem.name !== lastAddedSaltCategory) {
                    filteredItems.push(saltCategoryForItem);
                    lastAddedSaltCategory = saltCategoryForItem.name;
                }
            } else {
                // This is a salt category, remember its name
                lastAddedSaltCategory = item.name;
            }
            
            // Add the matching item
            filteredItems.push(item);
        }
    });
    
    renderItemsList(filteredItems);
}

// Toggle items list visibility - Updated to reset search state
function toggleItemsList() {
    const itemsContainer = document.getElementById('all-items-container');
    const toggleButton = document.getElementById('toggle-list-btn');
    const searchInput = document.getElementById('search-input');
    
    if (itemsContainer.classList.contains('hidden')) {
        itemsContainer.classList.remove('hidden');
        toggleButton.textContent = 'Hide List';
        // Reset the flag when explicitly showing the list
        listWasHiddenBeforeSearch = false;
    } else {
        itemsContainer.classList.add('hidden');
        toggleButton.textContent = 'Show List';
        // Reset search when hiding the list
        if (searchInput.value) {
            searchInput.value = '';
            renderItemsList(pesticideData);
        }
    }
}

// Edit price functionality
function editPrice(index) {
    const item = pesticideData[index];
    
    // Find if this item is in the cart with custom quantity
    const cartItem = selectedItems.find(i => i.index === index);
    const currentPrice = cartItem && cartItem.customQuantity ? cartItem.price : item.price;
    const itemName = cartItem && cartItem.displayName ? cartItem.displayName : item.name;
    
    showEditModal({
        title: 'Edit Price',
        label: `Current price for ${itemName}:`,
        inputType: 'number',
        defaultValue: currentPrice,
        placeholder: 'Enter new price',
        confirmText: 'Update Price'
    }).then(newPrice => {
        if (newPrice !== null && !isNaN(newPrice) && newPrice.trim() !== '') {
            const parsedPrice = parseInt(newPrice.trim());
            const oldPrice = currentPrice;
            
            if (cartItem && cartItem.customQuantity) {
                // Update price in the cart for custom quantity item
                cartItem.price = parsedPrice;
                updateSelectedItemsList();
                
                // Show toast notification with price change details
                const priceDiff = parsedPrice - oldPrice;
                const priceChangeText = priceDiff > 0 ? `increased by ₹${priceDiff}` : `reduced by ₹${Math.abs(priceDiff)}`;
                showToast(`${itemName} price temporarily ${priceChangeText} to ₹${parsedPrice}`);
            } else {
                // Standard behavior for regular items
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
    });
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
        
        showEditModal({
            title: 'Edit Quantity',
            label: `Current quantity for ${item.name}:`,
            inputType: 'number',
            defaultValue: item.quantity,
            placeholder: 'Enter new quantity',
            confirmText: 'Update Quantity'
        }).then(newQuantity => {
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
        });
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
    
    // Clear any existing handlers
    cartItemsList.onwheel = null;
    
    // Make sure the cart has proper overflow handling
    cartItemsList.style.overflowY = 'auto';
    cartItemsList.style.WebkitOverflowScrolling = 'touch'; // Enable momentum scrolling on iOS
    
    // Add these attributes to improve scroll behavior
    cartItemsList.setAttribute('role', 'region');
    cartItemsList.setAttribute('aria-label', 'Selected items');
    
    // Track if we've scrolled down past threshold
    let hasScrolledDown = false;
    
    // Add scroll listener to detect when user scrolls back to top
    cartItemsList.addEventListener('scroll', function() {
        // If user has scrolled down past threshold
        if (this.scrollTop > 10) {
            hasScrolledDown = true;
        } 
        // If user has previously scrolled down and now scrolled back to top
        else if (hasScrolledDown && this.scrollTop <= 2) {
            // Reset flag
            hasScrolledDown = false;
            // Reapply scroll indicator
            updateFloatingCartScrollIndicator();
        }
    });
    
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
        updateFloatingCartScrollIndicator();
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
    clearBtn.textContent = 'Clear';
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
    
    // Track if we've scrolled down past threshold
    let hasScrolledDown = false;
    let lastScrollTop = 0;
    
    // Add scroll listener to detect when user scrolls back to top
    cartItemsList.addEventListener('scroll', function() {
        const scrollingUp = this.scrollTop < lastScrollTop;
        lastScrollTop = this.scrollTop;
        
        // If user has scrolled down past threshold
        if (this.scrollTop > 10) {
            hasScrolledDown = true;
        } 
        // IMPROVED: If user has scrolled back to top, show indicator again
        else if (hasScrolledDown && this.scrollTop <= 2 && scrollingUp) {
            // Reset flag
            hasScrolledDown = false;
            // Reapply scroll indicator
            updateFloatingCartScrollIndicator();
        }
        
        // IMPROVED: Handle scroll indicator visibility
        const indicator = document.getElementById('scroll-more-indicator');
        if (indicator) {
            const scrollBottom = this.scrollHeight - this.scrollTop - this.clientHeight;
            // Show indicator when near top or hide when near bottom
            if (this.scrollTop < 10) {
                indicator.style.opacity = '1';
            } else if (scrollBottom < 20) {
                indicator.style.opacity = '0';
            }
        }
    });
    
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
        updateFloatingCartScrollIndicator();
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
                const header = selectedItemsContainer.querySelector('.selected-items-header');
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

// Function to ensure the app takes full screen width
function ensureFullScreenLayout() {
    // Set the viewport properly
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    // Ensure the app container takes full width
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.width = '100%';
        appContainer.style.maxWidth = '100%';
        appContainer.style.margin = '0';
        appContainer.style.boxSizing = 'border-box';
    }
    
    // Add event listener to ensure layout is maintained on resize
    window.addEventListener('resize', () => {
        if (appContainer) {
            appContainer.style.width = '100%';
            appContainer.style.maxWidth = '100%';
        }
    });
    
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('refreshing');
            
            // Store a reference to the original fetchPesticideData function
            const originalFetchPesticideData = fetchPesticideData;
            
            // Create a new function that wraps fetchPesticideData and adds proper callback handling
            const fetchDataWithCallback = () => {
                return new Promise((resolve, reject) => {
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
                            // Hide loading indicator
                            document.getElementById('loading-indicator').style.display = 'none';
                            
                            // Update data and render list
                            pesticideData = data;
                            renderItemsList(pesticideData);
                            
                            // Resolve the promise to indicate success
                            resolve();
                        })
                        .catch(error => {
                            // Hide loading, show error
                            document.getElementById('loading-indicator').style.display = 'none';
                            document.getElementById('items-list').innerHTML = 
                                `<div class="error-message">Failed to load data: ${error.message}</div>`;
                            console.error("Error fetching data:", error);
                            
                            // Reject the promise to indicate failure
                            reject(error);
                        });
                });
            };
            
            // Call our wrapped function with proper promise handling
            fetchDataWithCallback()
                .then(() => {
                    // Success: stop spinning and show success state
                    refreshBtn.classList.remove('refreshing');
                    refreshBtn.classList.add('updated');
                    setTimeout(() => {
                        refreshBtn.classList.remove('updated');
                    }, 2000);
                })
                .catch(() => {
                    // Error: stop spinning and show error state
                    refreshBtn.classList.remove('refreshing');
                    refreshBtn.classList.add('error');
                    setTimeout(() => {
                        refreshBtn.classList.remove('error');
                    }, 2000);
                });
        });
    }
}

// Completely revised search bar handler to eliminate gap when scrolling up
function handleSearchBarScroll() {
    const searchSection = document.querySelector('.search-section');
    const searchSpacer = document.querySelector('.search-spacer');
    
    // Get the search bar's position relative to viewport
    const rect = searchSection.getBoundingClientRect();
    
    // Track scroll direction
    const currentScrollY = window.scrollY;
    const isScrollingUp = currentScrollY < (handleSearchBarScroll.lastScrollY || 0);
    handleSearchBarScroll.lastScrollY = currentScrollY;
    
    // If scrolling down and the search bar's top edge is at or above viewport top
    if (!isScrollingUp && rect.top <= 0) {
        if (!searchSection.classList.contains('fixed')) {
            // Measure height BEFORE any class changes
            if (searchSpacer && !searchSpacer._heightSet) {
                searchSpacer.style.height = `${rect.height}px`;
                searchSpacer._heightSet = true;
            }
            
            // Add fixed class and activate spacer synchronously
            searchSection.classList.add('fixed');
            if (searchSpacer) {
                searchSpacer.classList.add('active');
            }
        }
    } 
    // If scrolling up, use a buffer zone to ensure a clean transition
    else if (isScrollingUp && rect.top >= -10) {
        if (searchSection.classList.contains('fixed')) {
            // Remove fixed class and deactivate spacer synchronously
            searchSection.classList.remove('fixed');
            
            // Set height to zero immediately
            if (searchSpacer) {
                searchSpacer.classList.remove('active');
                searchSpacer.style.height = '0px';
                // Reset the height set flag to ensure proper recalculation next time
                searchSpacer._heightSet = false;
            }
            
            // Force layout recalculation to prevent gap
            document.body.offsetHeight;
        }
    }
}

// Simplified resize handler that works with the improved scroll handler
function setupResizeHandler() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        // Clear the timeout if it exists
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Set a timeout to avoid excessive recalculations
        resizeTimeout = setTimeout(function() {
            const searchSection = document.querySelector('.search-section');
            const searchSpacer = document.querySelector('.search-spacer');
            
            // Reset spacer completely
            if (searchSpacer) {
                searchSpacer._heightSet = false;
                searchSpacer.style.height = '0px';
                searchSpacer.classList.remove('active');
            }
            
            // Reset all positioning to natural state
            searchSection.classList.remove('fixed');
            searchSection.style.position = '';
            searchSection.style.top = '';
            searchSection.style.left = '';
            searchSection.style.width = '';
            
            // Force layout recalculation right away
            document.body.offsetHeight;
            
            // Recalculate based on current scroll position
            handleSearchBarScroll.lastScrollY = null;
            handleSearchBarScroll();
        }, 100);
    });
}

// Improved search bar handler to prevent premature disappearance when scrolling up
function handleSearchBarScroll() {
    const searchSection = document.querySelector('.search-section');
    const searchSpacer = document.querySelector('.search-spacer');
    
    // Store original position on first run
    if (handleSearchBarScroll.originalTop === undefined) {
        handleSearchBarScroll.originalTop = searchSection.getBoundingClientRect().top + window.scrollY;
    }
    
    // Get the search bar's position relative to viewport
    const rect = searchSection.getBoundingClientRect();
    
    // Track scroll direction and position
    const currentScrollY = window.scrollY;
    const isScrollingUp = currentScrollY < (handleSearchBarScroll.lastScrollY || 0);
    handleSearchBarScroll.lastScrollY = currentScrollY;
    
    // If scrolling down and the search bar's top edge is at or above viewport top
    if (!isScrollingUp && rect.top <= 0) {
        if (!searchSection.classList.contains('fixed')) {
            // Measure height BEFORE any class changes
            if (searchSpacer && !searchSpacer._heightSet) {
                searchSpacer.style.height = `${rect.height}px`;
                searchSpacer._heightSet = true;
            }
            
            // Add fixed class and activate spacer synchronously
            searchSection.classList.add('fixed');
            if (searchSpacer) {
                searchSpacer.classList.add('active');
            }
        }
    } 
    // IMPROVED: Only release fixed position when we've scrolled back to original position
    else if (isScrollingUp && window.scrollY <= handleSearchBarScroll.originalTop) {
        if (searchSection.classList.contains('fixed')) {
            // Remove fixed class and deactivate spacer synchronously
            searchSection.classList.remove('fixed');
            
            // Set height to zero immediately
            if (searchSpacer) {
                searchSpacer.classList.remove('active');
                searchSpacer.style.height = '0px';
                // Reset the height set flag to ensure proper recalculation next time
                searchSpacer._heightSet = false;
            }
            
            // Force layout recalculation to prevent gap
            document.body.offsetHeight;
        }
    }
}

// Improved resize handler to correctly reset search bar position tracking
function setupResizeHandler() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        // Clear the timeout if it exists
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Set a timeout to avoid excessive recalculations
        resizeTimeout = setTimeout(function() {
            const searchSection = document.querySelector('.search-section');
            const searchSpacer = document.querySelector('.search-spacer');
            
            // Reset spacer completely
            if (searchSpacer) {
                searchSpacer._heightSet = false;
                searchSpacer.style.height = '0px';
                searchSpacer.classList.remove('active');
            }
            
            // Reset all positioning to natural state
            searchSection.classList.remove('fixed');
            searchSection.style.position = '';
            searchSection.style.top = '';
            searchSection.style.left = '';
            searchSection.style.width = '';
            
            // Force layout recalculation right away
            document.body.offsetHeight;
            
            // IMPORTANT: Reset the original position tracker
            handleSearchBarScroll.originalTop = undefined;
            
            // Recalculate based on current scroll position
            handleSearchBarScroll.lastScrollY = null;
            handleSearchBarScroll();
        }, 100);
    });
}

// Improved function to handle floating cart scroll indicator behavior
function updateFloatingCartScrollIndicator() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    // Clean up any existing indicators
    const existingIndicators = container.querySelectorAll('.scroll-more-indicator');
    existingIndicators.forEach(indicator => {
        indicator.remove();
    });
    
    // Make sure we don't have top cart classes
    itemsList.classList.remove('top-cart-has-more-items');
    
    // Check if content is truly scrollable
    const isScrollable = itemsList.scrollHeight > itemsList.clientHeight + 5;
    
    if (selectedItems.length > 4 && isScrollable) {
        // Add has-more-items class to container
        container.classList.add('has-more-items');
        
        // Create and add scroll indicator
        const indicator = document.createElement('div');
        indicator.className = 'scroll-more-indicator';
        indicator.id = 'scroll-more-indicator';
        container.appendChild(indicator);
        
        // Show indicator
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // Track scroll position and direction
        let lastScrollTop = itemsList.scrollTop;
        let wasAtBottom = false;
        
        const onScrollHandler = function() {
            const scrollTop = itemsList.scrollTop;
            const scrollBottom = itemsList.scrollHeight - scrollTop - itemsList.clientHeight;
            const isScrollingUp = scrollTop < lastScrollTop;
            
            // Update last scroll position for next check
            lastScrollTop = scrollTop;
            
            // Check if we're at the bottom of the scroll (within 5px)
            if (scrollBottom <= 5) {
                indicator.style.opacity = '0';
                wasAtBottom = true;
            } 
            // Show indicator when scrolling up from bottom
            else if (wasAtBottom && isScrollingUp) {
                indicator.style.opacity = '1';
                wasAtBottom = false;
            }
        };
        
        // Call immediately to check initial position
        onScrollHandler();
        
        // Add scroll listener - don't remove it so we can detect scrolling up
        itemsList.removeEventListener('scroll', onScrollHandler);
        itemsList.addEventListener('scroll', onScrollHandler);
    } else {
        container.classList.remove('has-more-items');
    }
}

// COMPLETELY FIXED: Guaranteed working solution to make scroll indicator disappear at bottom
function updateFloatingCartScrollIndicator() {
    const itemsList = document.getElementById('selected-items-list');
    const container = document.querySelector('.floating-cart');
    
    if (!itemsList || !container) return;
    
    // First delete ANY existing indicators to start clean
    const existingIndicators = document.querySelectorAll('.scroll-more-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Only proceed if content is truly scrollable
    const isScrollable = itemsList.scrollHeight > itemsList.clientHeight + 5;
    
    if (selectedItems.length > 4 && isScrollable) {
        // Create fresh indicator with direct DOM manipulation
        const indicator = document.createElement('div');
        indicator.className = 'scroll-more-indicator';
        indicator.id = 'scroll-more-indicator';
        indicator.style.display = 'flex'; // Start visible
        indicator.style.opacity = '1';
        container.appendChild(indicator);
        
        // Check initial position - hide immediately if already at bottom
        const initialScrollBottom = itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight;
        if (initialScrollBottom < 5) {
            indicator.style.display = 'none';
            indicator.style.opacity = '0';
        }
        
        // Simple scroll handler with direct DOM manipulation
        function scrollHandler() {
            const scrollBottom = itemsList.scrollHeight - itemsList.scrollTop - itemsList.clientHeight;
            
            // DEFINITELY hide at bottom - using multiple properties to ensure it works
            if (scrollBottom < 5) {
                indicator.style.display = 'none';
                indicator.style.opacity = '0';
                this.wasAtBottom = true;
            } 
            // Show indicator when scrolling up from bottom
            else if (this.wasAtBottom && this.lastScrollTop > itemsList.scrollTop) {
                indicator.style.display = 'flex';
                indicator.style.opacity = '1';
                this.wasAtBottom = false;
            }
            
            // Update scroll position for next check
            this.lastScrollTop = itemsList.scrollTop;
        }
        
        // Set up scroll state object
        const scrollState = {
            lastScrollTop: itemsList.scrollTop,
            wasAtBottom: initialScrollBottom < 5
        };
        
        // Clean up any existing handler to prevent duplicates
        if (itemsList._scrollHandler) {
            itemsList.removeEventListener('scroll', itemsList._scrollHandler);
        }
        
        // Create bound function and store reference for cleanup
        itemsList._scrollHandler = function() {
            scrollHandler.call(scrollState);
        };
        
        // Add new scroll listener
        itemsList.addEventListener('scroll', itemsList._scrollHandler);
        
        // Run once to set initial state
        scrollHandler.call(scrollState);
    }
}

// New function to remove item with smooth animation
function removeItemWithAnimation(itemIndex) {
    const item = selectedItems[itemIndex];
    const cartItemElement = document.querySelector(`.selected-item[data-index="${item.index}"]`);
    
    if (cartItemElement) {
        // Add the removing class to start the fade-out animation
        cartItemElement.classList.add('removing');
        
        // Wait for animation to complete before actually removing
        setTimeout(() => {
            // Remove from selected items array
            selectedItems.splice(itemIndex, 1);
            
            // If cart is now empty, update everything
            if (selectedItems.length === 0) {
                updateSelectedItemsList();
                
                // If no more items, remove floating cart
                if (isCartFloating) {
                    const selectedItemsContainer = document.querySelector('.selected-items-container');
                    selectedItemsContainer.classList.remove('floating-cart');
                    selectedItemsContainer.classList.remove('bottom-floating-cart');
                    isCartFloating = false;
                }
            } else {
                // Remove element from DOM directly without redrawing cart
                cartItemElement.remove();
                
                // Update scroll indicator if needed
                if (isCartFloating) {
                    updateFloatingCartScrollIndicator();
                }
            }
        }, 200); // Match the CSS transition duration
    } else {
        // Fallback if element not found
        selectedItems.splice(itemIndex, 1);
        updateSelectedItemsList();
    }
}

// New function to update a single cart item without redrawing the entire cart
function updateSingleCartItem(item) {
    const cartItemElement = document.querySelector(`.selected-item[data-index="${item.index}"]`);
    
    if (cartItemElement) {
        // Update quantity display
        const qtyElement = cartItemElement.querySelector('.cart-quantity');
        if (qtyElement) {
            qtyElement.textContent = item.quantity;
            
            // Add a subtle highlight effect
            qtyElement.classList.add('updating');
            setTimeout(() => {
                qtyElement.classList.remove('updating');
            }, 150);
        }
        
        // Update total price
        const totalElement = cartItemElement.querySelector('.selected-item-total');
        if (totalElement) {
            const total = item.price * item.quantity;
            totalElement.textContent = `₹${total}`;
            
            // Add a subtle highlight effect
            totalElement.classList.add('updating');
            setTimeout(() => {
                totalElement.classList.remove('updating');
            }, 150);
        }
    }
}

// New function to only update the grand total without redrawing the cart
function updateGrandTotalOnly() {
    const grandTotalElement = document.getElementById('grand-total-value');
    
    if (grandTotalElement) {
        // Calculate grand total
        let grandTotal = 0;
        selectedItems.forEach(item => {
            grandTotal += item.price * item.quantity;
        });
        
        // Add animation class
        grandTotalElement.classList.add('updating');
        
        // Update the value
        grandTotalElement.textContent = grandTotal;
        
        // Remove animation class after update
        setTimeout(() => {
            grandTotalElement.classList.remove('updating');
        }, 150);
    }
    
    // Also update in modal if it's open
    const modalGrandTotalElement = document.getElementById('modal-grand-total-value');
    if (modalGrandTotalElement) {
        let grandTotal = 0;
        selectedItems.forEach(item => {
            grandTotal += item.price * item.quantity;
        });
        modalGrandTotalElement.textContent = grandTotal;
    }
}

// New function to create and display a custom modal dialog
function showEditModal(options) {
    // Remove any existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'edit-modal-header';
    
    const title = document.createElement('div');
    title.className = 'edit-modal-title';
    title.textContent = options.title || 'Edit';
    header.appendChild(title);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'edit-modal-body';
    
    // Create input group
    const inputGroup = document.createElement('div');
    inputGroup.className = 'edit-modal-input-group';
    
    const label = document.createElement('label');
    label.className = 'edit-modal-label';
    label.textContent = options.label || '';
    inputGroup.appendChild(label);
    
    const input = document.createElement('input');
    input.className = 'edit-modal-input';
    input.type = options.inputType || 'text';
    input.value = options.defaultValue || '';
    input.placeholder = options.placeholder || '';
    if (options.inputType === 'number') {
        input.min = '0';
        input.step = '1';
    }
    inputGroup.appendChild(input);
    
    body.appendChild(inputGroup);
    
    // Create buttons
    const buttons = document.createElement('div');
    buttons.className = 'edit-modal-buttons';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'edit-modal-button cancel';
    cancelButton.textContent = 'Cancel';
    buttons.appendChild(cancelButton);
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'edit-modal-button confirm';
    confirmButton.textContent = options.confirmText || 'Apply';
    buttons.appendChild(confirmButton);
    
    body.appendChild(buttons);
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Animation timing
    setTimeout(() => {
        modalOverlay.classList.add('active');
        setTimeout(() => {
            modalContent.classList.add('active');
            // Focus and select input text
            input.focus();
            input.select();
            // Add animation class to highlight the input
            input.classList.add('focus-animation');
        }, 50);
    }, 10);
    
    // Return a promise that resolves when the user makes a decision
    return new Promise((resolve) => {
        // Handle confirm button
        confirmButton.addEventListener('click', () => {
            const value = input.value.trim();
            closeModal(modalOverlay, modalContent);
            resolve(value);
        });
        
        // Handle cancel button
        cancelButton.addEventListener('click', () => {
            closeModal(modalOverlay, modalContent);
            resolve(null);
        });
        
        // Handle click outside modal to cancel
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal(modalOverlay, modalContent);
                resolve(null);
            }
        });
        
        // Handle Enter key to confirm
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = input.value.trim();
                closeModal(modalOverlay, modalContent);
                resolve(value);
            } else if (e.key === 'Escape') {
                closeModal(modalOverlay, modalContent);
                resolve(null);
            }
        });
    });
}

// Helper function to close modal with animation
function closeModal(overlay, modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }, 100);
}

// Replace edit price functionality with custom modal
function editPrice(index) {
    const item = pesticideData[index];
    
    // Find if this item is in the cart with custom quantity
    const cartItem = selectedItems.find(i => i.index === index);
    const currentPrice = cartItem && cartItem.customQuantity ? cartItem.price : item.price;
    const itemName = cartItem && cartItem.displayName ? cartItem.displayName : item.name;
    
    showEditModal({
        title: 'Edit Price',
        label: `Current price for ${itemName}:`,
        inputType: 'number',
        defaultValue: currentPrice,
        placeholder: 'Enter new price',
        confirmText: 'Update Price'
    }).then(newPrice => {
        if (newPrice !== null && !isNaN(newPrice) && newPrice.trim() !== '') {
            const parsedPrice = parseInt(newPrice.trim());
            const oldPrice = currentPrice;
            
            if (cartItem && cartItem.customQuantity) {
                // Update price in the cart for custom quantity item
                cartItem.price = parsedPrice;
                updateSelectedItemsList();
                
                // Show toast notification with price change details
                const priceDiff = parsedPrice - oldPrice;
                const priceChangeText = priceDiff > 0 ? `increased by ₹${priceDiff}` : `reduced by ₹${Math.abs(priceDiff)}`;
                showToast(`${itemName} price temporarily ${priceChangeText} to ₹${parsedPrice}`);
            } else {
                // Standard behavior for regular items
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
    });
}

// New function to edit item quantity with custom modal
function editItemQuantity(index) {
    const item = pesticideData[index];
    
    // Don't process if it's a salt category
    if (item.price === 0) return;
    
    // Get the original name to display in the modal
    const originalName = item.name;
    const originalNameParts = originalName.split(' ');
    
    // Try to identify if the last part contains a quantity (like "80 gm", "500 ml", etc.)
    let originalQuantity = '';
    let originalUnit = '';
    let baseName = originalName;
    
    // Enhanced regex to detect common quantity patterns including kg and l/liter/litre
    const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|gm|gms|gram|grams|g|l|lt|ltr|ltrs|liter|litre|liters|litres|ml|mls|milliliter|millilitre|mg|mgs|milligram|milligrams|tablets|tabs|pcs|pieces|capsules|caps)\b/i;
    const match = originalName.match(quantityRegex);
    
    if (match) {
        originalQuantity = match[1];
        originalUnit = match[2].toLowerCase();
        
        // Base name is everything before the quantity
        baseName = originalName.replace(match[0], '').trim();
        
        // Convert kg to grams and l/liter/litre to ml for the edit dialog
        let displayQuantity = originalQuantity;
        let displayUnit = originalUnit;
        
        if (originalUnit === 'kg') {
            // Convert kg to grams for editing
            displayQuantity = parseFloat(originalQuantity) * 1000;
            displayUnit = 'gm';
        } 
        else if (originalUnit === 'l' || originalUnit === 'liter' || originalUnit === 'litre') {
            // Convert l/liter/litre to ml for editing
            displayQuantity = parseFloat(originalQuantity) * 1000;
            displayUnit = 'ml';
        }
        
        // Prompt with the original quantity if detected, with conversions applied
        let promptMessage = `Enter new quantity for ${baseName} (current: ${displayQuantity} ${displayUnit}):`;
        
        showEditModal({
            title: 'Edit Quantity',
            label: promptMessage,
            inputType: 'number',
            defaultValue: displayQuantity,
            placeholder: `Enter new quantity in ${displayUnit}`,
            confirmText: 'Update Quantity'
        }).then(newQuantityInput => {
            if (newQuantityInput !== null && newQuantityInput.trim() !== '') {
                // Clean up the input - accept only numbers
                const newQuantity = newQuantityInput.trim();
                
                if (isNaN(parseFloat(newQuantity))) {
                    showToast('Please enter a valid number for quantity', 'error');
                    return;
                }
                
                // Calculate new price based on the ratio of quantities, accounting for unit conversions
                let newPrice = item.price;
                let finalQuantity = parseFloat(newQuantity);
                let finalUnit = displayUnit;
                
                // Calculate the price ratio correctly based on the converted units
                if (originalUnit === 'kg') {
                    // Convert input grams to original kg for ratio calculation
                    const ratio = finalQuantity / (parseFloat(originalQuantity) * 1000);
                    newPrice = Math.round(item.price * ratio);
                    
                    // For display, convert back to appropriate units if needed
                    if (finalQuantity >= 1000) {
                        finalQuantity = finalQuantity / 1000;
                        finalUnit = 'kg';
                    }
                } 
                else if (originalUnit === 'l' || originalUnit === 'liter' || originalUnit === 'litre') {
                    // Convert input ml to original l for ratio calculation
                    const ratio = finalQuantity / (parseFloat(originalQuantity) * 1000);
                    newPrice = Math.round(item.price * ratio);
                    
                    // For display, convert back to appropriate units if needed
                    if (finalQuantity >= 1000) {
                        finalQuantity = finalQuantity / 1000;
                        finalUnit = originalUnit; // Keep original l/liter/litre unit
                    }
                } 
                else {
                    // Standard calculation for other units
                    const ratio = parseFloat(newQuantity) / parseFloat(originalQuantity);
                    newPrice = Math.round(item.price * ratio);
                }
                
                // Check if this item is already in the cart
                const cartItemIndex = selectedItems.findIndex(i => i.index === index);
                
                if (cartItemIndex !== -1) {
                    // Item is already in cart, update its display name and price
                    const oldCartItem = selectedItems[cartItemIndex];
                    
                    // Construct the new name with custom quantity
                    let newName = `${baseName} ${finalQuantity} ${finalUnit}`;
                    
                    // Store the original name and custom quantity details
                    selectedItems[cartItemIndex] = {
                        ...oldCartItem,
                        displayName: newName,
                        originalName: originalName,
                        customQuantity: true,
                        customQuantityValue: finalQuantity,
                        customQuantityUnit: finalUnit,
                        originalPrice: item.price,
                        price: newPrice
                    };
                    
                    // Update cart display
                    updateSelectedItemsList();
                    
                    // Show success message
                    showToast(`Updated quantity to ${finalQuantity} ${finalUnit} and adjusted price to ₹${newPrice}`);
                } else {
                    // Item not in cart yet, add it with quantity 1
                    const quantityDisplay = document.getElementById(`quantity-${index}`);
                    const currentQuantity = parseInt(quantityDisplay.textContent);
                    
                    if (currentQuantity === 0) {
                        // Add item to cart with quantity 1
                        quantityDisplay.textContent = "1";
                        
                        // Construct the new name with custom quantity
                        let newName = `${baseName} ${finalQuantity} ${finalUnit}`;
                        
                        // Add to selected items with custom quantity
                        selectedItems.push({
                            index: index,
                            name: originalName,  // Keep the original name for reference
                            displayName: newName, // New name to display in cart
                            company: item.company,
                            price: newPrice,
                            originalPrice: item.price,
                            quantity: 1,
                            customQuantity: true,
                            customQuantityValue: finalQuantity,
                            customQuantityUnit: finalUnit
                        });
                        
                        // Update UI
                        updateSelectedItemsList();
                        showFloatingCartOnAdd();
                        
                        // Show success message
                        showToast(`Added ${newName} to cart with adjusted price ₹${newPrice}`);
                    } else {
                        // Item is in counting but not in cart (shouldn't happen normally)
                        showToast('Please add this item to the cart first', 'info');
                    }
                }
            }
        });
        return; // Exit after handling matched quantity
    }
    
    // Default handling for items without detected quantities
    let promptMessage = `Enter new quantity for ${originalName}:`;
    
    showEditModal({
        title: 'Edit Quantity',
        label: promptMessage,
        inputType: 'number',
        defaultValue: originalQuantity,
        placeholder: 'Enter new quantity',
        confirmText: 'Update Quantity'
    }).then(newQuantityInput => {
        if (newQuantityInput !== null && newQuantityInput.trim() !== '') {
            // Clean up the input - accept only numbers
            const newQuantity = newQuantityInput.trim();
            
            if (isNaN(parseInt(newQuantity))) {
                showToast('Please enter a valid number for quantity', 'error');
                return;
            }
            
            // Calculate new price based on the ratio of quantities
            let newPrice = item.price;
            
            if (originalQuantity && parseFloat(originalQuantity) > 0) {
                const ratio = parseFloat(newQuantity) / parseFloat(originalQuantity);
                newPrice = Math.round(item.price * ratio);
            }
            
            // Check if this item is already in the cart
            const cartItemIndex = selectedItems.findIndex(i => i.index === index);
            
            if (cartItemIndex !== -1) {
                // Item is already in cart, update its display name and price
                const oldCartItem = selectedItems[cartItemIndex];
                
                // Construct the new name with custom quantity
                let newName = originalName;
                if (originalQuantity && originalUnit) {
                    newName = `${baseName} ${newQuantity} ${originalUnit}`;
                }
                
                // Store the original name and custom quantity details
                selectedItems[cartItemIndex] = {
                    ...oldCartItem,
                    displayName: newName,
                    originalName: originalName,
                    customQuantity: true,
                    customQuantityValue: newQuantity,
                    customQuantityUnit: originalUnit,
                    originalPrice: item.price,
                    price: newPrice
                };
                
                // Update cart display
                updateSelectedItemsList();
                
                // Show success message
                showToast(`Updated quantity to ${newQuantity} ${originalUnit} and adjusted price to ₹${newPrice}`);
            } else {
                // Item not in cart yet, add it with quantity 1
                const quantityDisplay = document.getElementById(`quantity-${index}`);
                const currentQuantity = parseInt(quantityDisplay.textContent);
                
                if (currentQuantity === 0) {
                    // Add item to cart with quantity 1
                    quantityDisplay.textContent = "1";
                    
                    // Construct the new name with custom quantity
                    let newName = originalName;
                    if (originalQuantity && originalUnit) {
                        newName = `${baseName} ${newQuantity} ${originalUnit}`;
                    }
                    
                    // Add to selected items with custom quantity
                    selectedItems.push({
                        index: index,
                        name: originalName,  // Keep the original name for reference
                        displayName: newName, // New name to display in cart
                        company: item.company,
                        price: newPrice,
                        originalPrice: item.price,
                        quantity: 1,
                        customQuantity: true,
                        customQuantityValue: newQuantity,
                        customQuantityUnit: originalUnit
                    });
                    
                    // Update UI
                    updateSelectedItemsList();
                    showFloatingCartOnAdd();
                    
                    // Show success message
                    showToast(`Added ${newName} to cart with adjusted price ₹${newPrice}`);
                } else {
                    // Item is in counting but not in cart (shouldn't happen normally)
                    showToast('Please add this item to the cart first', 'info');
                }
            }
        }
    });
}
