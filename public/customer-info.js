// Customer Information Feature
document.addEventListener('DOMContentLoaded', function() {
    // Elements for customer info
    const customerNameIcon = document.getElementById('customer-name-icon');
    const customerNameDisplay = document.getElementById('customer-name-display');
    const customerNameText = document.getElementById('customer-name-text');
    const customerNameClear = document.getElementById('customer-name-clear');
    const customerModalOverlay = document.getElementById('customer-modal-overlay');
    const customerModal = document.getElementById('customer-modal');
    const customerModalWarning = document.getElementById('customer-modal-warning');
    const customerNameInput = document.getElementById('customer-name-input');
    const customerDateInput = document.getElementById('customer-date-input');
    const customerModalClose = document.getElementById('customer-modal-close');
    const customerModalCancel = document.getElementById('customer-modal-cancel');
    const customerModalConfirm = document.getElementById('customer-modal-confirm');

    // Elements for saved bills
    const savedBillsIcon = document.getElementById('saved-bills-icon');
    const savedBillsOverlay = document.getElementById('saved-bills-overlay');
    const savedBillsClose = document.getElementById('saved-bills-close');
    const savedBillsList = document.getElementById('saved-bills-list');
    const savedBillsSearchInput = document.getElementById('saved-bills-search-input');
    const savedBillsSearchBtn = document.getElementById('saved-bills-search-btn');
    console.log('Search button element:', savedBillsSearchBtn);
    const billDetailsContainer = document.getElementById('bill-details-container');
    
    // Elements for bill popup
    const billPopupOverlay = document.getElementById('bill-popup-overlay');
    const billPopup = document.getElementById('bill-popup');
    const billPopupTitle = document.getElementById('bill-popup-title');
    const billPopupDate = document.getElementById('bill-popup-date');
    const billPopupAmount = document.getElementById('bill-popup-amount');
    const billPopupToggleInput = document.getElementById('bill-popup-toggle-input');
    const billPopupItems = document.getElementById('bill-popup-items');
    const billPopupClose = document.getElementById('bill-popup-close');
    const billPopupEdit = document.getElementById('bill-popup-edit');
    const billPopupDelete = document.getElementById('bill-popup-delete');
    
    // Variable to store the current bill index
    let currentBillIndex = -1;

    // Create autocomplete container for customer names
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.id = 'customer-name-autocomplete';
    // Insert after customer name input
    const customerNameInputGroup = customerNameInput ? customerNameInput.closest('.customer-modal-input-group') : null;
    if (customerNameInputGroup) {
        customerNameInputGroup.appendChild(autocompleteContainer);
    }

    // Ensure localStorage has required structures
    if (!localStorage.getItem('savedBills')) {
        localStorage.setItem('savedBills', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('customerNameHistory')) {
        localStorage.setItem('customerNameHistory', JSON.stringify([]));
    }
    
    // Check if customer name is stored and update display
    const storedCustomerName = localStorage.getItem('currentCustomerName');
    if (storedCustomerName && customerNameText && customerNameDisplay) {
        customerNameText.textContent = storedCustomerName;
        customerNameDisplay.classList.add('visible');
    }

    // Function to get stored customer names from localStorage
    function getStoredCustomerNames() {
        const storedNames = localStorage.getItem('customerNameHistory');
        return storedNames ? JSON.parse(storedNames) : [];
    }

    // Function to save a customer name to history
    function saveCustomerNameToHistory(name) {
        if (!name) return;
        
        let names = getStoredCustomerNames();
        
        // Remove the name if it already exists (to avoid duplicates)
        names = names.filter(n => n.toLowerCase() !== name.toLowerCase());
        
        // Add the new name to the beginning of the array
        names.unshift(name);
        
        // Limit the history to 20 names to prevent localStorage from getting too large
        if (names.length > 20) {
            names = names.slice(0, 20);
        }
        
        // Save back to localStorage
        localStorage.setItem('customerNameHistory', JSON.stringify(names));
    }

    // Function to show autocomplete suggestions
    function showAutocompleteSuggestions(input) {
        const inputValue = input.trim().toLowerCase();
        
        // Clear previous suggestions
        autocompleteContainer.innerHTML = '';
        
        // If input is empty, hide the container
        if (!inputValue) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Get stored names
        const storedNames = getStoredCustomerNames();
        
        // Filter names that match the input
        const matchingNames = storedNames.filter(name => 
            name.toLowerCase().includes(inputValue)
        );
        
        // If no matches, hide the container
        if (matchingNames.length === 0) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Create and append suggestion elements
        matchingNames.forEach(name => {
            const suggestion = document.createElement('div');
            suggestion.className = 'autocomplete-suggestion';
            suggestion.textContent = name;
            
            // Highlight the matching part
            const highlightedText = name.replace(
                new RegExp(inputValue, 'gi'),
                match => `<span class="highlight">${match}</span>`
            );
            suggestion.innerHTML = highlightedText;
            
            // Add click event to select this suggestion
            suggestion.addEventListener('click', () => {
                customerNameInput.value = name;
                // Apply capitalization to maintain consistency
                const capitalizedValue = capitalizeWords(name);
                if (capitalizedValue !== name) {
                    customerNameInput.value = capitalizedValue;
                }
                autocompleteContainer.style.display = 'none';
                // Also hide warning if it was visible
                customerModalWarning.classList.remove('visible');
                customerNameInput.style.borderColor = '';
            });
            
            autocompleteContainer.appendChild(suggestion);
        });
        
        // Show the container
        autocompleteContainer.style.display = 'block';
    }

    // Add input event listener to show suggestions as user types
    customerNameInput.addEventListener('input', function() {
        showAutocompleteSuggestions(this.value);
        
        // Original input event code
        this.style.borderColor = '';
        // Also hide warning if user starts typing
        if (this.value.trim().length > 0) {
            customerModalWarning.classList.remove('visible');
            
            // If this is the first character, capitalize it immediately
            if (this.value.length === 1) {
                const cursorPosition = this.selectionStart;
                this.value = this.value.toUpperCase();
                // Restore cursor position
                this.setSelectionRange(cursorPosition, cursorPosition);
            }
        }
    });

    // Show suggestions when input is focused
    customerNameInput.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            showAutocompleteSuggestions(this.value);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== customerNameInput && e.target !== autocompleteContainer) {
            autocompleteContainer.style.display = 'none';
        }
    });

    // Handle keyboard navigation in autocomplete
    customerNameInput.addEventListener('keydown', function(e) {
        const suggestions = autocompleteContainer.querySelectorAll('.autocomplete-suggestion');
        if (!suggestions.length) return;
        
        // Find currently selected suggestion
        const selectedIndex = Array.from(suggestions).findIndex(
            el => el.classList.contains('selected')
        );
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (selectedIndex < 0) {
                    // Select first suggestion
                    suggestions[0].classList.add('selected');
                } else if (selectedIndex < suggestions.length - 1) {
                    // Select next suggestion
                    suggestions[selectedIndex].classList.remove('selected');
                    suggestions[selectedIndex + 1].classList.add('selected');
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (selectedIndex > 0) {
                    // Select previous suggestion
                    suggestions[selectedIndex].classList.remove('selected');
                    suggestions[selectedIndex - 1].classList.add('selected');
                }
                break;
                
            case 'Enter':
                // If a suggestion is selected, use it
                if (selectedIndex >= 0) {
                    e.preventDefault();
                    customerNameInput.value = suggestions[selectedIndex].textContent;
                    autocompleteContainer.style.display = 'none';
                }
                break;
                
            case 'Escape':
                // Hide suggestions
                autocompleteContainer.style.display = 'none';
                break;
        }
    });

    // Elements for bill confirmation
    const confirmBillBtn = document.getElementById('confirm-bill-btn');
    const billModalOverlay = document.getElementById('bill-modal-overlay');
    const billModal = document.getElementById('bill-modal');
    const billCustomerName = document.getElementById('bill-customer-name');
    const billDate = document.getElementById('bill-date');
    const billTotalAmount = document.getElementById('bill-total-amount');
    const billItemsToggleInput = document.getElementById('bill-items-toggle-input');
    const billItemsList = document.getElementById('bill-items-list');
    const billModalClose = document.getElementById('bill-modal-close');
    const billModalCancel = document.getElementById('bill-modal-cancel');
    const billModalConfirm = document.getElementById('bill-modal-confirm');
    const toastMessage = document.getElementById('toast-message');
    const grandTotalValue = document.getElementById('grand-total-value');

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    customerDateInput.value = formattedDate;

    // Check if there's saved customer info in localStorage
    const savedCustomerName = localStorage.getItem('customerName');
    const billConfirmed = localStorage.getItem('billConfirmed');
    
    // Only display the customer name if a bill was confirmed
    if (savedCustomerName && billConfirmed) {
        customerNameText.textContent = savedCustomerName;
        customerNameDisplay.classList.add('visible');
        customerNameDisplay.classList.add('icon-hidden');
        customerNameIcon.classList.add('hidden');
        // Ensure the display width adjusts to the content
        adjustNameDisplayWidth();
        // Adjust container width
        document.querySelector('.customer-info-container').style.maxWidth = '85vw';
    } else if (savedCustomerName) {
        // If there's a customer name but no confirmed bill, clear it
        localStorage.removeItem('customerName');
        localStorage.removeItem('customerDate');
    }

    // Function to adjust the name display width based on content
    function adjustNameDisplayWidth() {
        // Reset any inline width first
        customerNameDisplay.style.width = 'auto';
        
        // Set responsive max-width based on screen size
        if (window.innerWidth <= 320) {
            customerNameDisplay.style.maxWidth = '60vw';
        } else if (window.innerWidth <= 375) {
            customerNameDisplay.style.maxWidth = '65vw';
        } else {
            customerNameDisplay.style.maxWidth = '70vw';
        }
        
        // Set text styles to allow wrapping and show full content
        customerNameText.style.maxWidth = '';
        customerNameText.style.whiteSpace = 'normal';
        customerNameText.style.overflow = 'visible';
        customerNameText.style.textOverflow = 'clip';
        customerNameText.style.wordBreak = 'break-word';
        
        // Calculate the actual width needed for the text
        const textWidth = customerNameText.scrollWidth;
        const clearBtnWidth = 25; // Width of the clear button with some margin
        const padding = 25; // Extra padding
        
        // Set a fixed width that's wide enough for the content
        const totalWidth = textWidth + clearBtnWidth + padding;
        const cartContainer = document.querySelector('.selected-items-container');
        const separator = document.querySelector('.customer-info-separator');
        
        // Check if the name is too long (more than 60% of viewport width)
        const maxSingleLineWidth = window.innerWidth * 0.6;
        
        if (textWidth > maxSingleLineWidth) {
            // For very long names, allow wrapping
            customerNameDisplay.classList.add('long-name');
            customerNameText.style.whiteSpace = 'normal';
            customerNameDisplay.style.width = 'auto';
            
            // Set responsive max-width based on screen size
            if (window.innerWidth <= 320) {
                customerNameDisplay.style.maxWidth = '60vw';
            } else if (window.innerWidth <= 375) {
                customerNameDisplay.style.maxWidth = '65vw';
            } else {
                customerNameDisplay.style.maxWidth = '70vw';
            }
            
            // Ensure text is fully visible
            customerNameText.style.overflow = 'visible';
            customerNameText.style.textOverflow = 'clip';
            customerNameText.style.wordBreak = 'break-word';
            
            // Adjust the separator position
            if (separator) {
                // Calculate the height of the customer name display
                const nameHeight = customerNameDisplay.offsetHeight;
                // Position the separator below the customer name with smooth transition
                separator.style.transition = 'top 0.3s ease';
                separator.style.top = (nameHeight + 20) + 'px';
                
                // Also adjust the cart container margin
                if (cartContainer) {
                    cartContainer.style.marginTop = (nameHeight + 25) + 'px';
                }
            }
        } else {
            // For normal length names, still allow wrapping if needed
            customerNameDisplay.classList.remove('long-name');
            customerNameText.style.whiteSpace = 'normal';
            
            // Ensure the width doesn't exceed the max-width
            const maxWidth = window.innerWidth <= 320 ? 
                window.innerWidth * 0.6 : 
                (window.innerWidth <= 375 ? window.innerWidth * 0.65 : window.innerWidth * 0.7);
            
            customerNameDisplay.style.width = Math.min(totalWidth, maxWidth) + 'px';
            
            // Reset the separator position with smooth transition
            if (separator) {
                separator.style.transition = 'top 0.3s ease';
                separator.style.top = '52px';
                
                // Reset the cart container margin
                if (cartContainer) {
                    cartContainer.style.marginTop = '70px';
                }
            }
        }
        
        // Move the container slightly to the left for better positioning
        customerNameDisplay.style.left = '-5px';
    }
    
    // Make adjustNameDisplayWidth available globally
    window.adjustNameDisplayWidth = adjustNameDisplayWidth;

    // Add window resize event listener to adjust name display width when screen size changes
    window.addEventListener('resize', function() {
        // Only adjust if customer name is visible
        if (customerNameDisplay.classList.contains('visible')) {
            adjustNameDisplayWidth();
        }
    });

    // Clear customer name when clicking the cross symbol
    customerNameClear.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling to parent elements
        
        // Clear from localStorage
        localStorage.removeItem('customerName');
        localStorage.removeItem('customerDate');
        
        // Clear display with animation
        customerNameDisplay.style.opacity = '0';
        customerNameDisplay.style.transform = 'translateX(-10px)';
        
        // Reset the separator position with smooth transition
        const separator = document.querySelector('.customer-info-separator');
        if (separator) {
            separator.style.transition = 'top 0.3s ease';
            separator.style.top = '52px';
        }
        
        // After the fade out animation completes, remove the visible class
        setTimeout(() => {
            customerNameText.textContent = '';
            customerNameDisplay.classList.remove('visible');
            customerNameDisplay.classList.remove('icon-hidden');
            customerNameDisplay.classList.remove('long-name');
            
            // Show the icon with animation
            customerNameIcon.classList.remove('hidden');
            
            // Reset styles
            customerNameDisplay.style.opacity = '';
            customerNameDisplay.style.transform = '';
            
            // Reset container width
            document.querySelector('.customer-info-container').style.maxWidth = '90vw';
        }, 300);
        
        // Reset input fields
        customerNameInput.value = '';
        customerDateInput.value = formattedDate;
    });

    // Function to open customer modal with optional warning
    function openCustomerModal(showWarning = false) {
        // Always get the latest customer name from localStorage
        // This ensures we don't use stale data after a reset
        const currentCustomerName = localStorage.getItem('customerName');
        
        // Only pre-fill if there's a current name in localStorage
        if (currentCustomerName) {
            customerNameInput.value = currentCustomerName;
        } else {
            // Ensure the input is empty if no customer name is set
            customerNameInput.value = '';
        }
        
        // Show or hide warning
        if (showWarning) {
            customerModalWarning.classList.add('visible');
            // Also highlight the input field
            customerNameInput.style.borderColor = '#ff5252';
        } else {
            customerModalWarning.classList.remove('visible');
            customerNameInput.style.borderColor = '';
        }
        
        // Show the modal with animation
        customerModalOverlay.classList.add('active');
        setTimeout(() => {
            customerModal.classList.add('active');
            // Focus on the input field
            customerNameInput.focus();
        }, 10);
    }

    // Open modal when clicking on the customer name icon
    customerNameIcon.addEventListener('click', function(e) {
        // Prevent any default behavior
        e.preventDefault();
        
        try {
            // Ensure the modal is properly reset before opening
            customerModalWarning.classList.remove('visible');
            customerNameInput.style.borderColor = '';
            
            // Ensure the input is empty if customer name has been reset
            if (!localStorage.getItem('customerName')) {
                customerNameInput.value = '';
            }
            
            // Open the modal
            openCustomerModal(false);
        } catch (error) {
            console.error('Error opening customer modal:', error);
            // Fallback in case of error - direct DOM manipulation
            customerModalOverlay.classList.add('active');
            customerModal.classList.add('active');
        }
    });

    // Close modal functions with error handling
    function closeCustomerModal() {
        try {
            customerModal.classList.remove('active');
            setTimeout(() => {
                customerModalOverlay.classList.remove('active');
                // Reset warning state
                customerModalWarning.classList.remove('visible');
                customerNameInput.style.borderColor = '';
            }, 300);
        } catch (error) {
            console.error('Error closing customer modal:', error);
            // Direct DOM manipulation as fallback
            customerModal.classList.remove('active');
            customerModalOverlay.classList.remove('active');
            customerModalWarning.classList.remove('visible');
            customerNameInput.style.borderColor = '';
        }
    }

    // Close modal when clicking on close button
    customerModalClose.addEventListener('click', closeCustomerModal);
    customerModalCancel.addEventListener('click', closeCustomerModal);

    // Close modal when clicking outside the modal
    customerModalOverlay.addEventListener('click', function(e) {
        if (e.target === customerModalOverlay) {
            closeCustomerModal();
        }
    });

    // Function to capitalize the first letter of each word with special handling for designations
    function capitalizeWords(text) {
        if (!text) return text;
        
        // First, capitalize the first letter of each word
        let result = text.replace(/\b\w/g, function(letter) {
            return letter.toUpperCase();
        });
        
        // Handle special cases like S/O, D/O, W/O, C/O where the letter after slash should be lowercase
        // This covers cases like "S/O", "s/o", "S/o", etc.
        result = result.replace(/([A-Za-z])\/([A-Za-z])/g, function(match, before, after) {
            return before.toUpperCase() + '/' + after.toLowerCase();
        });
        
        // Handle common designations and ensure they're formatted correctly
        const designations = {
            'S/o': 'S/o',
            'D/o': 'D/o',
            'W/o': 'W/o',
            'C/o': 'C/o'
        };
        
        // Replace any of these designations with the correct format
        Object.keys(designations).forEach(key => {
            const regex = new RegExp('\\b' + key.replace(/\//g, '\\/') + '\\b', 'i');
            result = result.replace(regex, designations[key]);
        });
        
        return result;
    }

    // Handle confirm button click
    customerModalConfirm.addEventListener('click', function() {
        const customerName = customerNameInput.value.trim();
        const customerDate = customerDateInput.value;
        
        if (customerName) {
            // Capitalize the first letter of each word in the customer name
            const capitalizedName = capitalizeWords(customerName);
            
            // Save to localStorage but don't set billConfirmed flag
            // billConfirmed is only set when a bill is actually confirmed
            localStorage.setItem('customerName', capitalizedName);
            localStorage.setItem('customerDate', customerDate);
            
            // Update display
            customerNameText.textContent = capitalizedName;
            customerNameDisplay.classList.add('visible');
            
            // Hide the icon with animation
            customerNameIcon.classList.add('hidden');
            customerNameDisplay.classList.add('icon-hidden');
            
            // Adjust the width of the name display
            adjustNameDisplayWidth();
            
            // Adjust container width
            document.querySelector('.customer-info-container').style.maxWidth = '85vw';
            
            // Close modal
            closeCustomerModal();
            
            // If we were in the middle of confirming a bill, reopen the bill modal
            if (billConfirmationPending) {
                billConfirmationPending = false;
                openBillConfirmationModal();
            }
        } else {
            // Highlight the input field if empty
            customerNameInput.style.borderColor = '#ff5252';
            customerModalWarning.classList.add('visible');
            setTimeout(() => {
                customerNameInput.style.borderColor = '';
            }, 2000);
        }
    });
    
    // Remove red border when typing after validation error and apply capitalization
    customerNameInput.addEventListener('input', function() {
        this.style.borderColor = '';
        // Also hide warning if user starts typing
        if (this.value.trim().length > 0) {
            customerModalWarning.classList.remove('visible');
            
            // If this is the first character, capitalize it immediately
            if (this.value.length === 1) {
                const cursorPosition = this.selectionStart;
                this.value = this.value.toUpperCase();
                // Restore cursor position
                this.setSelectionRange(cursorPosition, cursorPosition);
            }
        }
    });
    
    // Add event for real-time capitalization when user finishes typing a word
    customerNameInput.addEventListener('keyup', function(e) {
        // Only capitalize when space is pressed or when focus is lost
        if (e.key === ' ' || e.key === 'Spacebar') {
            const cursorPosition = this.selectionStart;
            this.value = capitalizeWords(this.value);
            // Restore cursor position
            this.setSelectionRange(cursorPosition, cursorPosition);
        }
    });
    
    // Capitalize on blur (when user clicks outside the input)
    customerNameInput.addEventListener('blur', function() {
        const cursorPosition = this.selectionStart;
        this.value = capitalizeWords(this.value);
        // Restore cursor position
        this.setSelectionRange(cursorPosition, cursorPosition);
    });

    // Bill Confirmation Feature
    
    // Flag to track if we're in the middle of confirming a bill
    let billConfirmationPending = false;
    
    // Show confirm bill button when items are added to cart - with improved error handling
    function updateConfirmBillButton() {
        try {
            // Check if there are items in the cart by looking at the grand total value
            const totalAmount = parseFloat(grandTotalValue.textContent);
            
            if (totalAmount > 0) {
                confirmBillBtn.classList.add('visible');
            } else {
                // Check if there are items in the cart by looking at the selected items list
                const selectedItemsList = document.getElementById('selected-items-list');
                const hasItems = selectedItemsList && selectedItemsList.children.length > 0 && 
                                 !selectedItemsList.textContent.includes('No items selected');
                
                if (hasItems) {
                    confirmBillBtn.classList.add('visible');
                } else if (window.selectedItems && window.selectedItems.length > 0) {
                    confirmBillBtn.classList.add('visible');
                } else {
                    confirmBillBtn.classList.remove('visible');
                }
            }
        } catch (error) {
            console.error('Error updating confirm bill button:', error);
            // Fallback - make button visible if we can't determine cart state
            // It's better to show it unnecessarily than to hide it when needed
            confirmBillBtn.classList.add('visible');
        }
    }
    
    // Multiple ways to detect cart changes
    function setupCartChangeListeners() {
        // 1. Watch for changes in the grand total value
        const grandTotalObserver = new MutationObserver(function(mutations) {
            updateConfirmBillButton();
        });
        
        grandTotalObserver.observe(grandTotalValue, { 
            childList: true, 
            characterData: true, 
            subtree: true 
        });
        
        // 2. Watch for changes in the selected items list
        const selectedItemsList = document.getElementById('selected-items-list');
        if (selectedItemsList) {
            const itemsObserver = new MutationObserver(function(mutations) {
                updateConfirmBillButton();
            });
            
            itemsObserver.observe(selectedItemsList, { 
                childList: true, 
                subtree: true 
            });
        }
        
        // 3. Hook into the app's addToSelectedItems function if it exists
        if (window.addToSelectedItems) {
            const originalAddToSelectedItems = window.addToSelectedItems;
            window.addToSelectedItems = function() {
                const result = originalAddToSelectedItems.apply(this, arguments);
                updateConfirmBillButton();
                return result;
            };
        }
        
        // 4. Hook into the app's updateSelectedItemsList function if it exists
        if (window.updateSelectedItemsList) {
            const originalUpdateSelectedItemsList = window.updateSelectedItemsList;
            window.updateSelectedItemsList = function() {
                const result = originalUpdateSelectedItemsList.apply(this, arguments);
                updateConfirmBillButton();
                return result;
            };
        }
        
        // 5. Check periodically (as a fallback)
        setInterval(updateConfirmBillButton, 1000);
        
        // 6. Check initially
        updateConfirmBillButton();
        
        // 7. Check when window loads fully
        window.addEventListener('load', updateConfirmBillButton);
    }
    
    // Call this function to set up all the listeners
    setupCartChangeListeners();
    
    // Direct integration with the app's cart functionality
    // This script runs after a short delay to ensure the app is fully loaded
    setTimeout(function() {
        // Try to find the app's addItem function and hook into it
        if (typeof window.addItem === 'function') {
            const originalAddItem = window.addItem;
            window.addItem = function() {
                const result = originalAddItem.apply(this, arguments);
                // Force the button to be visible after a short delay
                setTimeout(updateConfirmBillButton, 100);
                return result;
            };
        }
        
        // Also check if items are already in the cart
        updateConfirmBillButton();
    }, 1000);
    
    // Function to open bill confirmation modal
    function openBillConfirmationModal() {
        // Check if customer name is set
        const customerName = localStorage.getItem('customerName');
        if (!customerName) {
            // Set flag that we're in the middle of confirming a bill
            billConfirmationPending = true;
            
            // Close bill modal if it's open
            closeBillModal();
            
            // Open customer modal with warning
            openCustomerModal(true);
            return;
        }
        
        const customerDate = localStorage.getItem('customerDate') || formattedDate;
        
        // Format the date for display
        const displayDate = formatDate(customerDate);
        
        // Get total amount
        const totalAmount = grandTotalValue.textContent;
        
        // Update bill modal with information
        billCustomerName.textContent = customerName;
        billDate.textContent = displayDate;
        billTotalAmount.textContent = '₹' + totalAmount;
        
        // Reset toggle and items list
        billItemsToggleInput.checked = false;
        
        // Pre-populate the items list but keep it hidden
        // This ensures the items are ready when the toggle is clicked
        getCartItemsFromDOM();
        billItemsList.classList.remove('visible');
        
        // Show the modal with animation
        billModalOverlay.classList.add('active');
        setTimeout(() => {
            billModal.classList.add('active');
        }, 10);
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Handle bill items toggle
    billItemsToggleInput.addEventListener('change', function() {
        if (this.checked) {
            // Use our direct DOM manipulation function to ensure items are shown
            populateBillItemsDirectly();
            
            // Also ensure the visible class is added
            setTimeout(() => {
                billItemsList.classList.add('visible');
                console.log("Added visible class to items list");
            }, 50);
        } else {
            // Hide the items list
            billItemsList.classList.remove('visible');
            console.log("Removed visible class from items list");
        }
    });
    
    // Populate bill items list
    function populateBillItems() {
        console.log("Populating bill items, selectedItems:", window.selectedItems);
        
        // Clear previous items
        billItemsList.innerHTML = '';
        
        // Add each item from the cart
        if (window.selectedItems && window.selectedItems.length > 0) {
            window.selectedItems.forEach(item => {
                const billItem = document.createElement('div');
                billItem.className = 'bill-item';
                
                const itemName = document.createElement('div');
                itemName.className = 'bill-item-name';
                itemName.textContent = item.name;
                
                const itemQty = document.createElement('div');
                itemQty.className = 'bill-item-qty';
                itemQty.textContent = 'x' + item.quantity;
                
                const itemPrice = document.createElement('div');
                itemPrice.className = 'bill-item-price';
                itemPrice.textContent = '₹' + item.total;
                
                billItem.appendChild(itemName);
                billItem.appendChild(itemQty);
                billItem.appendChild(itemPrice);
                
                billItemsList.appendChild(billItem);
            });
            console.log("Added", window.selectedItems.length, "items to the bill list");
        } else {
            const noItems = document.createElement('div');
            noItems.className = 'bill-item';
            noItems.textContent = 'No items in cart';
            billItemsList.appendChild(noItems);
            console.log("No items found, showing empty state");
        }
    }
    
    // Close bill modal functions with error handling
    function closeBillModal() {
        try {
            billModal.classList.remove('active');
            setTimeout(() => {
                billModalOverlay.classList.remove('active');
                // Reset the toggle
                billItemsToggleInput.checked = false;
                billItemsList.classList.remove('visible');
            }, 300);
        } catch (error) {
            console.error('Error closing bill modal:', error);
            // Direct DOM manipulation as fallback
            billModal.classList.remove('active');
            billModalOverlay.classList.remove('active');
            if (billItemsToggleInput) billItemsToggleInput.checked = false;
            if (billItemsList) billItemsList.classList.remove('visible');
        }
    }
    
    // Close modal when clicking on close button
    billModalClose.addEventListener('click', closeBillModal);
    billModalCancel.addEventListener('click', closeBillModal);
    
    // Close modal when clicking outside the modal
    billModalOverlay.addEventListener('click', function(e) {
        if (e.target === billModalOverlay) {
            closeBillModal();
        }
    });
    
    // Function to reset the cart
    function resetCart() {
        try {
            console.log('Resetting cart after bill confirmation');
            
            // Temporarily override the app's showToast function to prevent duplicate messages
            if (window.showToast) {
                const originalShowToast = window.showToast;
                window.showToast = function(message, type) {
                    // Only suppress the "Cart cleared successfully" message
                    if (message === 'Cart cleared successfully') {
                        console.log('Suppressed duplicate toast message:', message);
                        return;
                    }
                    // Call the original function for other messages
                    originalShowToast(message, type);
                };
                
                // Set a timeout to restore the original function
                setTimeout(() => {
                    window.showToast = originalShowToast;
                }, 1000);
            }
            
            // Try to find the clear cart button and click it
            const clearCartBtn = document.getElementById('clear-cart-btn');
            if (clearCartBtn) {
                // Simulate a click on the clear cart button
                clearCartBtn.click();
                console.log('Cart reset by clicking clear cart button');
                
                // Additional check: Sometimes the click event might not trigger properly
                // So we'll add a small delay and check if the cart was actually cleared
                setTimeout(() => {
                    const grandTotal = document.getElementById('grand-total-value');
                    if (grandTotal && parseFloat(grandTotal.textContent) > 0) {
                        console.log('Clear cart button click did not reset the cart, applying fallback methods');
                        applyCartResetFallbacks();
                    }
                }, 300);
                
                return;
            } else {
                // If clear cart button not found, use fallback methods
                applyCartResetFallbacks();
            }
        } catch (error) {
            console.error('Error resetting cart:', error);
            // If any error occurs, try the fallback methods
            applyCartResetFallbacks();
        }
    }
    
    // Make resetCart available globally
    window.resetCart = resetCart;
    
    // Fallback methods to reset the cart if the clear button doesn't work
    function applyCartResetFallbacks() {
        try {
            // Method 1: Reset the selectedItems array
            if (window.selectedItems) {
                window.selectedItems = [];
                console.log('Cart reset by clearing selectedItems array');
            }
            
            // Method 2: Try to call the app's clearCart function if it exists
            if (typeof window.clearCart === 'function') {
                window.clearCart();
                console.log('Cart reset by calling clearCart function');
            }
            
            // Method 3: Update the selected items list in the DOM
            const selectedItemsList = document.getElementById('selected-items-list');
            if (selectedItemsList) {
                selectedItemsList.innerHTML = '<div class="no-items">No items selected</div>';
                console.log('Cart reset by clearing DOM elements');
            }
            
            // Method 4: Reset the grand total
            const grandTotalValue = document.getElementById('grand-total-value');
            if (grandTotalValue) {
                grandTotalValue.textContent = '0';
                console.log('Grand total reset to zero');
            }
            
            // Method 5: Hide the confirm bill button
            if (confirmBillBtn) {
                confirmBillBtn.classList.remove('visible');
                console.log('Confirm bill button hidden');
            }
            
            // Method 6: Try to trigger the app's updateSelectedItemsList function if it exists
            if (typeof window.updateSelectedItemsList === 'function') {
                window.updateSelectedItemsList();
                console.log('Cart reset by calling updateSelectedItemsList function');
            }
        } catch (error) {
            console.error('Error in cart reset fallbacks:', error);
        }
    }

    // Handle bill confirmation
    billModalConfirm.addEventListener('click', function() {
        // Double check that customer name is set
        const customerName = localStorage.getItem('customerName');
        if (!customerName) {
            // Close bill modal
            closeBillModal();
            
            // Set flag that we're in the middle of confirming a bill
            billConfirmationPending = true;
            
            // Open customer modal with warning
            openCustomerModal(true);
            return;
        }
        
        // Save bill information (in a real app, this would send data to a server)
        const billData = {
            customerName: billCustomerName.textContent,
            date: billDate.textContent,
            totalAmount: billTotalAmount.textContent,
            items: []
        };
        
        // Get items directly from the DOM for more reliable data
        const cartItemsContainer = document.getElementById('selected-items-list');
        const cartItems = cartItemsContainer.querySelectorAll('.selected-item-row');
        
        if (cartItems && cartItems.length > 0) {
            // Process each cart item
            cartItems.forEach(cartItem => {
                // Extract item details from the DOM
                const nameElement = cartItem.querySelector('.selected-item-name');
                const qtyElement = cartItem.querySelector('.cart-quantity');
                const priceElement = cartItem.querySelector('.item-price-display');
                const totalElement = cartItem.querySelector('.selected-item-total');
                
                // Extract values
                const name = nameElement ? nameElement.textContent.trim() : 'Unknown Item';
                const quantity = qtyElement ? parseInt(qtyElement.textContent.trim()) : 1;
                let price = 0;
                let total = 0;
                
                // Extract price (remove ₹ symbol)
                if (priceElement) {
                    price = parseFloat(priceElement.textContent.trim().replace('₹', ''));
                }
                
                // Extract total (remove ₹ symbol)
                if (totalElement) {
                    total = parseFloat(totalElement.textContent.trim().replace('₹', ''));
                } else {
                    // Calculate total if not available
                    total = price * quantity;
                }
                
                // Add item to bill data
                billData.items.push({
                    name: name,
                    price: price,
                    quantity: quantity,
                    total: total
                });
            });
        } else if (window.selectedItems && window.selectedItems.length > 0) {
            // Fallback to window.selectedItems if DOM elements not found
            billData.items = window.selectedItems.map(item => ({
                name: item.name || item.displayName || 'Unknown Item',
                price: parseFloat(item.price || 0),
                quantity: parseInt(item.quantity || 1),
                total: parseFloat(item.total || (item.price * item.quantity))
            }));
        }
        
        console.log('Saving bill with items:', billData.items.length);
        
        // Store in localStorage for demo purposes
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        // Add new bill to the beginning of the array instead of the end
        savedBills.unshift(billData);
        localStorage.setItem('savedBills', JSON.stringify(savedBills));
        
        // Set flag that bill was confirmed
        localStorage.setItem('billConfirmed', 'true');
        
        // Save customer name to history for autocomplete ONLY when a bill is saved
        saveCustomerNameToHistory(customerName);
        
        // Close the modal
        closeBillModal();
        
        // Reset customer name after bill is confirmed
        resetCustomerName();
        
        // Reset the cart after bill is confirmed
        resetCart();
        
        // Show toast message
        showToast('Bill saved successfully');
    });
    
    // Function to reset customer name
    function resetCustomerName() {
        try {
            // Clear from localStorage
            localStorage.removeItem('customerName');
            localStorage.removeItem('customerDate');
            localStorage.removeItem('billConfirmed');
            
            // Clear display
            customerNameText.textContent = '';
            customerNameDisplay.classList.remove('visible');
            customerNameDisplay.classList.remove('long-name');
            
            // Show the icon without animation when bill is saved
            customerNameDisplay.classList.remove('icon-hidden');
            customerNameIcon.classList.remove('hidden');
            
            // Reset the separator position immediately
            const separator = document.querySelector('.customer-info-separator');
            if (separator) {
                separator.style.transition = 'none'; // Disable transition for immediate change
                separator.style.top = '52px';
                
                // Re-enable transition after a small delay
                setTimeout(() => {
                    separator.style.transition = 'top 0.3s ease';
                }, 50);
            }
            
            // Reset container width
            document.querySelector('.customer-info-container').style.maxWidth = '90vw';
            
            // Reset input fields for next use
            customerNameInput.value = '';
            customerDateInput.value = formattedDate;
            
            // Also reset the savedCustomerName variable to ensure it's in sync
            savedCustomerName = null;
            
            console.log('Customer name reset after bill confirmation');
        } catch (error) {
            console.error('Error resetting customer name:', error);
        }
    }
    
    // Show toast message
    function showToast(message) {
        toastMessage.textContent = message;
        toastMessage.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toastMessage.classList.remove('visible');
        }, 3000);
    }

    // Make showToast available globally
    window.showToast = showToast;

    // Add a direct event listener for the toggle
    document.addEventListener('DOMContentLoaded', function() {
        // Get the toggle input element
        const toggleInput = document.getElementById('bill-items-toggle-input');
        
        // Add a direct click handler
        if (toggleInput) {
            toggleInput.addEventListener('click', function() {
                handleItemsToggle(this.checked);
            });
        }
    });
    
    // Function to handle the toggle state change - Simplified and improved
    function handleItemsToggle(isChecked) {
        console.log("handleItemsToggle called with isChecked:", isChecked);
        
        if (isChecked) {
            // Populate and show items
            populateBillItems();
            billItemsList.classList.add('visible');
        } else {
            // Hide items
            billItemsList.classList.remove('visible');
        }
    }
    
    // Add a new function to directly manipulate DOM elements for the bill items
    function populateBillItemsDirectly() {
        console.log("Direct population of bill items");
        
        // Use the getCartItemsFromDOM function which now correctly extracts quantities
        // This ensures we're always showing the most up-to-date quantities from the DOM
        getCartItemsFromDOM();
    }

    // Add a direct click handler for the toggle
    billItemsToggleInput.addEventListener('click', function() {
        if (this.checked) {
            console.log("Toggle clicked and checked");
            // Force immediate population and display of items
            setTimeout(getCartItemsFromDOM, 10);
        }
    });

    // New function to get cart items directly from the DOM
    function getCartItemsFromDOM() {
        // Get the items list element
        const itemsList = document.getElementById('bill-items-list');
        
        // Clear existing items
        itemsList.innerHTML = '';
        
        // IMPORTANT: Directly read items from the DOM instead of window.selectedItems
        const cartItemsContainer = document.getElementById('selected-items-list');
        const cartItems = cartItemsContainer.querySelectorAll('.selected-item-row');
        
        console.log("Found", cartItems.length, "items in the DOM");
        
        if (cartItems && cartItems.length > 0) {
            // Process each cart item
            cartItems.forEach(cartItem => {
                // Extract item details from the DOM
                const nameElement = cartItem.querySelector('.selected-item-name');
                
                // Get quantity from the correct element
                const qtyElement = cartItem.querySelector('.cart-quantity');
                
                // Get price element
                const priceElement = cartItem.querySelector('.item-price-display');
                
                // Get total element
                const totalElement = cartItem.querySelector('.selected-item-total');
                
                // Create bill item element
                const billItem = document.createElement('div');
                billItem.className = 'bill-item';
                
                // Create name element
                const itemName = document.createElement('div');
                itemName.className = 'bill-item-name';
                itemName.textContent = nameElement ? nameElement.textContent.trim() : 'Unknown Item';
                
                // Extract price, quantity and total values
                const quantity = qtyElement ? parseInt(qtyElement.textContent.trim()) : 1;
                let price = 0;
                let total = 0;
                
                // Extract price (remove ₹ symbol)
                if (priceElement) {
                    price = parseFloat(priceElement.textContent.trim().replace('₹', ''));
                }
                
                // Extract total (remove ₹ symbol)
                if (totalElement) {
                    total = parseFloat(totalElement.textContent.trim().replace('₹', ''));
                } else if (price && quantity) {
                    // Calculate total if not available
                    total = price * quantity;
                }
                
                // Create a container for the price information
                const priceInfo = document.createElement('div');
                priceInfo.className = 'bill-item-price-info';
                
                // Create quantity and price element in format "price x quantity = total"
                const itemQty = document.createElement('div');
                itemQty.className = 'bill-item-qty';
                itemQty.textContent = `₹${price.toFixed(2)} x ${quantity}`;
                
                // Create equals sign
                const equalsSign = document.createElement('span');
                equalsSign.className = 'bill-item-equals';
                equalsSign.textContent = ' = ';
                itemQty.appendChild(equalsSign);
                
                // Create price element (now showing the total)
                const itemPrice = document.createElement('div');
                itemPrice.className = 'bill-item-price';
                itemPrice.textContent = `₹${total.toFixed(2)}`;
                
                // Add elements to the bill item
                billItem.appendChild(itemName);
                priceInfo.appendChild(itemQty);
                priceInfo.appendChild(itemPrice);
                billItem.appendChild(priceInfo);
                
                // Add to the list
                itemsList.appendChild(billItem);
            });
            console.log("Added items directly from DOM");
        } else {
            // If no items found in DOM, try to get the grand total
            const grandTotal = document.getElementById('grand-total-value');
            if (grandTotal && parseFloat(grandTotal.textContent) > 0) {
                // If there's a total but no items found, show a message
                const totalItem = document.createElement('div');
                totalItem.className = 'bill-item';
                totalItem.textContent = 'Total amount: ₹' + grandTotal.textContent;
                itemsList.appendChild(totalItem);
                console.log("Added total amount as fallback");
            } else {
                // If no items found in either approach
                const noItems = document.createElement('div');
                noItems.className = 'bill-item';
                noItems.textContent = 'No items in cart';
                itemsList.appendChild(noItems);
                console.log("No items found in DOM");
            }
        }
        
        // Force visibility with inline styles
        itemsList.style.display = 'block';
        itemsList.style.opacity = '1';
        itemsList.style.maxHeight = '250px';
        itemsList.style.padding = '12px';
        itemsList.style.border = '1px solid #444';
        itemsList.style.marginBottom = '20px';
        itemsList.style.overflowY = 'auto';
        itemsList.classList.add('visible');
    }

    // Final safeguard to ensure buttons are always clickable
    // This runs after everything else has been set up
    setTimeout(function() {
        // Ensure saved bills icon is clickable
        if (savedBillsIcon) {
            savedBillsIcon.style.pointerEvents = 'auto';
            
            // Re-attach click event if needed
            if (!savedBillsIcon.onclick) {
                savedBillsIcon.onclick = function() {
                    console.log('Saved bills icon clicked (safeguard)');
                    openSavedBillsPage();
                };
            }
        }
        
        // Ensure saved bills close button is clickable
        if (savedBillsClose) {
            savedBillsClose.style.pointerEvents = 'auto';
            
            // Re-attach click event if needed
            if (!savedBillsClose.onclick) {
                savedBillsClose.onclick = function(e) {
                    console.log('Saved bills close button clicked');
                    // Prevent event propagation
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Add a visual feedback class
                    this.classList.add('clicked');
                    
                    // Remove the class after animation
                    setTimeout(() => {
                        this.classList.remove('clicked');
                    }, 150);
                    
                    // Close the saved bills page
                    closeSavedBillsPage();
                };
            }
        }
        
        // Ensure customer name icon is clickable
        if (customerNameIcon) {
            customerNameIcon.style.pointerEvents = 'auto';
            
            // Re-attach click event if needed
            if (!customerNameIcon.onclick) {
                customerNameIcon.onclick = function(e) {
                    e.preventDefault();
                    try {
                        // Ensure the input is empty if customer name has been reset
                        if (!localStorage.getItem('customerName')) {
                            customerNameInput.value = '';
                        }
                        openCustomerModal(false);
                    } catch (error) {
                        console.error('Fallback click handler error:', error);
                        customerModalOverlay.classList.add('active');
                        customerModal.classList.add('active');
                    }
                };
            }
        }
        
        // Ensure confirm bill button is clickable
        if (confirmBillBtn) {
            confirmBillBtn.style.pointerEvents = 'auto';
            
            // Re-attach click event if needed
            if (!confirmBillBtn.onclick) {
                confirmBillBtn.onclick = function(e) {
                    e.preventDefault();
                    try {
                        openBillConfirmationModal();
                    } catch (error) {
                        console.error('Error opening bill confirmation modal:', error);
                        // Fallback in case of error - direct DOM manipulation
                        
                        // Check if customer name is set
                        const customerName = localStorage.getItem('customerName');
                        if (!customerName) {
                            // Open customer modal as fallback
                            customerModalOverlay.classList.add('active');
                            customerModal.classList.add('active');
                        } else {
                            // If customer name exists, open bill modal
                            billModalOverlay.classList.add('active');
                            billModal.classList.add('active');
                        }
                    }
                };
            }
        }
        
        // Ensure all modal close buttons are clickable
        const closeButtons = [
            customerModalClose, 
            customerModalCancel, 
            billModalClose, 
            billModalCancel,
            billPopupClose
        ];
        
        closeButtons.forEach(button => {
            if (button) {
                button.style.pointerEvents = 'auto';
            }
        });
        
        // Ensure bill popup buttons are clickable
        if (billPopupEdit) billPopupEdit.style.pointerEvents = 'auto';
        if (billPopupDelete) billPopupDelete.style.pointerEvents = 'auto';
        if (billPopupToggleInput) billPopupToggleInput.style.pointerEvents = 'auto';
        
        // Ensure bill popup overlay click event is working
        if (billPopupOverlay && !billPopupOverlay._hasClickListener) {
            billPopupOverlay._hasClickListener = true;
            billPopupOverlay.addEventListener('click', function(e) {
                if (e.target === billPopupOverlay) {
                    closeBillPopup();
                }
            });
        }
        
        console.log('Safeguards applied to ensure buttons remain clickable');
    }, 2000); // Run after 2 seconds to ensure everything else has loaded

    // Function to open saved bills page
    function openSavedBillsPage() {
        console.log('Opening saved bills page');
        
        // Save the current main page scroll position
        window.savedMainScrollPosition = window.scrollY;
        
        // Add no-scroll-transition class to body
        document.body.classList.add('no-scroll-transition');
        
        // Add no-scroll class to html
        document.documentElement.classList.add('no-scroll');
        
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        console.log('Found', savedBills.length, 'saved bills in localStorage');
        
        // Display saved bills
        displaySavedBills(savedBills);
        
        // Reset search input
        if (savedBillsSearchInput) {
            savedBillsSearchInput.value = '';
        }
        
        // Show the overlay with direct DOM manipulation to ensure it works
        if (savedBillsOverlay) {
            // Reset the saved bills overlay scroll position
            savedBillsOverlay.scrollTop = 0;
            
            // Make it appear as a full page
            savedBillsOverlay.style.position = 'fixed';
            savedBillsOverlay.style.top = '0';
            savedBillsOverlay.style.left = '0';
            savedBillsOverlay.style.right = '0';
            savedBillsOverlay.style.bottom = '0';
            savedBillsOverlay.style.width = '100%';
            savedBillsOverlay.style.height = '100%';
            savedBillsOverlay.style.display = 'block';
            savedBillsOverlay.style.opacity = '1';
            savedBillsOverlay.style.visibility = 'visible';
            savedBillsOverlay.style.zIndex = '2000';
            savedBillsOverlay.style.backgroundColor = '#1e1e1e';
            
            // Add active class
            savedBillsOverlay.classList.add('active');
            
            console.log('Saved bills page should now be visible');
        } else {
            console.error('savedBillsOverlay element not found!');
        }
        
        // Prevent body scrolling when overlay is open
        document.body.style.overflow = 'hidden';
        
        // Focus on search input after a short delay
        setTimeout(() => {
            if (savedBillsSearchInput) {
                savedBillsSearchInput.focus();
            }
            
            // Initialize search functionality
            initializeSearchFunctionality();
        }, 300);
    }
    
    // Function to safely restore scroll position
    function safelyRestoreScrollPosition() {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            // Restore the main page scroll position
            if (typeof window.savedMainScrollPosition !== 'undefined') {
                window.scrollTo(0, window.savedMainScrollPosition);
                
                // Double-check the scroll position after a small delay
                setTimeout(() => {
                    if (window.scrollY !== window.savedMainScrollPosition) {
                        window.scrollTo(0, window.savedMainScrollPosition);
                    }
                }, 50);
            }
        });
    }

    // Function to close saved bills page
    function closeSavedBillsPage() {
        console.log('Closing saved bills page');
        
        // Add no-scroll-transition class to body
        document.body.classList.add('no-scroll-transition');
        
        // Restore the main page scroll position immediately before any animations
        safelyRestoreScrollPosition();
        
        // Hide the overlay with direct DOM manipulation to ensure it works
        if (savedBillsOverlay) {
            // Apply opacity and visibility changes immediately
            savedBillsOverlay.style.opacity = '0';
            
            // Remove active class
            savedBillsOverlay.classList.remove('active');
            
            // Use requestAnimationFrame for smoother animation
            requestAnimationFrame(() => {
                // After a single frame, hide completely
                setTimeout(() => {
                    savedBillsOverlay.style.display = 'none';
                    savedBillsOverlay.style.visibility = 'hidden';
                    
                    // Clear bill details and search
                    if (billDetailsContainer) {
                        billDetailsContainer.classList.remove('visible');
                        billDetailsContainer.innerHTML = '';
                    }
                    
                    if (savedBillsSearchInput) {
                        savedBillsSearchInput.value = '';
                    }
                    
                    // Reset the saved bills overlay scroll position
                    if (savedBillsOverlay) {
                        savedBillsOverlay.scrollTop = 0;
                    }
                    
                    // Remove no-scroll-transition class after animation completes
                    document.body.classList.remove('no-scroll-transition');
                    
                    // Remove no-scroll class from html
                    document.documentElement.classList.remove('no-scroll');
                }, 200); // Reduced from 300ms to 200ms
            });
            
            console.log('Saved bills page should now be hidden');
        } else {
            console.error('savedBillsOverlay element not found!');
        }
        
        // Also close the bill popup if it's open
        if (billPopupOverlay && billPopupOverlay.classList.contains('active')) {
            if (typeof window.closeBillPopup === 'function') {
                window.closeBillPopup();
            } else {
                billPopupOverlay.classList.remove('active');
            }
        }
        
        // Restore body scrolling immediately
        document.body.style.overflow = '';
    }
    
    // Function to display saved bills
    function displaySavedBills(bills) {
        console.log('Displaying', bills.length, 'saved bills');
        
        // Clear previous bills
        if (savedBillsList) {
            savedBillsList.innerHTML = '';
        } else {
            console.error('savedBillsList element not found!');
            return;
        }
        
        // Clear bill details
        if (billDetailsContainer) {
            billDetailsContainer.innerHTML = '';
            billDetailsContainer.classList.remove('visible');
        }
        
        if (!bills || bills.length === 0) {
            // Show no bills message
            const noBillsMessage = document.createElement('div');
            noBillsMessage.className = 'no-bills-message';
            noBillsMessage.textContent = 'No saved bills found';
            savedBillsList.appendChild(noBillsMessage);
            console.log('No bills to display');
            return;
        }
        
        // No need to sort bills since we're now adding new bills to the beginning of the array
        // Bills are already in the correct order (newest first)
        console.log('Bills are already sorted with newest first');
        
        // Get today and yesterday dates for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Group bills by date
        const groupedBills = {};
        
        // Special groups
        groupedBills['Today'] = [];
        groupedBills['Yesterday'] = [];
        
        bills.forEach((bill, index) => {
            // Parse the bill date
            let billDate = null;
            if (bill.date) {
                try {
                    // Try to parse date in format DD/MM/YYYY
                    if (bill.date.includes('/')) {
                        const [day, month, year] = bill.date.split('/');
                        billDate = new Date(year, month - 1, day);
                        billDate.setHours(0, 0, 0, 0);
                    } else {
                        // Try to parse as a date object
                        billDate = new Date(bill.date);
                        billDate.setHours(0, 0, 0, 0);
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                    billDate = null;
                }
            }
            
            // Determine which group this bill belongs to
            let groupKey;
            if (!billDate) {
                groupKey = 'No Date';
            } else if (billDate.getTime() === today.getTime()) {
                groupKey = 'Today';
            } else if (billDate.getTime() === yesterday.getTime()) {
                groupKey = 'Yesterday';
            } else {
                // Format the date as DD/MM/YYYY for older dates
                groupKey = bill.date;
            }
            
            // Create the group if it doesn't exist
            if (!groupedBills[groupKey]) {
                groupedBills[groupKey] = [];
            }
            
            // Add the bill to its group with its original index
            groupedBills[groupKey].push({ bill, index });
        });
        
        // Display bills by group
        const groupOrder = ['Today', 'Yesterday'];
        
        // First display Today and Yesterday groups
        groupOrder.forEach(groupKey => {
            if (groupedBills[groupKey] && groupedBills[groupKey].length > 0) {
                // Create group header
                const groupHeader = document.createElement('div');
                groupHeader.className = 'bill-group-header';
                groupHeader.textContent = groupKey;
                savedBillsList.appendChild(groupHeader);
                
                // Add bills in this group
                groupedBills[groupKey].forEach(({ bill, index }) => {
                    addBillToList(bill, index);
                });
                
                // Delete this group so we don't display it again
                delete groupedBills[groupKey];
            }
        });
        
        // Then display all other date groups
        Object.keys(groupedBills).sort().reverse().forEach(groupKey => {
            if (groupedBills[groupKey].length > 0) {
                // Create group header
                const groupHeader = document.createElement('div');
                groupHeader.className = 'bill-group-header';
                groupHeader.textContent = groupKey;
                savedBillsList.appendChild(groupHeader);
                
                // Add bills in this group
                groupedBills[groupKey].forEach(({ bill, index }) => {
                    addBillToList(bill, index);
                });
            }
        });
        
        console.log('Finished displaying bills');
        
        // Helper function to add a bill to the list
        function addBillToList(bill, index) {
            const billItem = document.createElement('div');
            billItem.className = 'bill-item-container';
            billItem.dataset.index = index;
            
            const billHeader = document.createElement('div');
            billHeader.className = 'bill-item-header';
            
            const billCustomer = document.createElement('div');
            billCustomer.className = 'bill-item-customer';
            billCustomer.textContent = bill.customerName || 'Not specified';
            
            const billDate = document.createElement('div');
            billDate.className = 'bill-item-date';
            billDate.textContent = bill.date || 'No date';
            
            const billAmount = document.createElement('div');
            billAmount.className = 'bill-item-amount';
            billAmount.textContent = bill.totalAmount || '₹0';
            
            billHeader.appendChild(billCustomer);
            billHeader.appendChild(billDate);
            billItem.appendChild(billHeader);
            billItem.appendChild(billAmount);
            
            // Add click event to show bill details
            billItem.addEventListener('click', () => {
                console.log('Bill clicked:', bill.customerName);
                
                // Remove selected class from all bills
                document.querySelectorAll('.bill-item-container').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to clicked bill
                billItem.classList.add('selected');
                
                // Use the global openBillPopup function if available
                if (typeof window.openBillPopup === 'function') {
                    console.log('Using global openBillPopup function');
                    window.openBillPopup(bill, index);
                } else {
                    console.error('Global openBillPopup function not found!');
                    // Fallback to the local function
                    showBillDetails(bill, index);
                }
            });
            
            savedBillsList.appendChild(billItem);
        }
    }
    
    // Make displaySavedBills available globally
    window.displaySavedBills = displaySavedBills;
    
    // Function to show bill details
    function showBillDetails(bill, index) {
        console.log('Showing details for bill:', bill.customerName);
        
        // Store the current bill index
        if (index !== undefined) {
            currentBillIndex = index;
        }
        
        // Use the global openBillPopup function if available
        if (typeof window.openBillPopup === 'function') {
            console.log('Using global openBillPopup function from showBillDetails');
            window.openBillPopup(bill, index);
            return;
        }
        
        // Fallback to local implementation
        console.warn('Global openBillPopup function not found, using local implementation');
        
        // Open the bill popup
        openBillPopup(bill);
    }
    
    // Function to open bill popup
    function openBillPopup(bill) {
        console.log('Opening bill popup for:', bill.customerName);
        
        // Check if elements exist
        if (!billPopupOverlay || !billPopup) {
            console.error('Bill popup elements not found!');
            console.log('billPopupOverlay:', billPopupOverlay);
            console.log('billPopup:', billPopup);
            
            // Try to get elements again
            const billPopupOverlayRetry = document.getElementById('bill-popup-overlay');
            const billPopupRetry = document.getElementById('bill-popup');
            
            if (!billPopupOverlayRetry || !billPopupRetry) {
                console.error('Could not find bill popup elements even after retry!');
                alert('Error: Could not open bill details. Please try again.');
                return;
            } else {
                console.log('Found elements on retry');
                billPopupOverlay = billPopupOverlayRetry;
                billPopup = billPopupRetry;
            }
        }
        
        // Update popup content
        billPopupTitle.textContent = bill.customerName || 'Not specified';
        billPopupDate.textContent = bill.date || 'No date';
        billPopupAmount.textContent = bill.totalAmount || '₹0';
        
        // Reset toggle and items list
        if (billPopupToggleInput) billPopupToggleInput.checked = false;
        if (billPopupItems) {
            billPopupItems.innerHTML = '';
            billPopupItems.style.display = 'none';
            billPopupItems.classList.remove('visible');
        }
        
        // Populate items list
        if (bill.items && bill.items.length > 0) {
            bill.items.forEach(item => {
                const billItem = document.createElement('div');
                billItem.className = 'bill-item';
                
                const itemName = document.createElement('div');
                itemName.className = 'bill-item-name';
                itemName.textContent = item.name || 'Unknown item';
                
                // Create a container for the price information
                const priceInfo = document.createElement('div');
                priceInfo.className = 'bill-item-price-info';
                
                // Get price and quantity
                const price = parseFloat(item.price || 0);
                const quantity = parseInt(item.quantity || 1);
                const total = parseFloat(item.total || (price * quantity));
                
                // Create quantity and price element in format "price x quantity = total"
                const itemQty = document.createElement('div');
                itemQty.className = 'bill-item-qty';
                itemQty.textContent = `₹${price.toFixed(2)} x ${quantity}`;
                
                // Create equals sign
                const equalsSign = document.createElement('span');
                equalsSign.className = 'bill-item-equals';
                equalsSign.textContent = ' = ';
                itemQty.appendChild(equalsSign);
                
                // Create price element (now showing the total)
                const itemPrice = document.createElement('div');
                itemPrice.className = 'bill-item-price';
                itemPrice.textContent = `₹${total.toFixed(2)}`;
                
                // Add elements to the bill item
                billItem.appendChild(itemName);
                priceInfo.appendChild(itemQty);
                priceInfo.appendChild(itemPrice);
                billItem.appendChild(priceInfo);
                
                billPopupItems.appendChild(billItem);
            });
        } else {
            const noItems = document.createElement('div');
            noItems.className = 'bill-item';
            noItems.textContent = 'No items in this bill';
            billPopupItems.appendChild(noItems);
        }
        
        // Direct DOM manipulation to ensure the popup is displayed
        billPopupOverlay.style.display = 'flex';
        billPopupOverlay.style.opacity = '1';
        billPopupOverlay.style.visibility = 'visible';
        billPopupOverlay.classList.add('active');
        
        // Force a reflow before adding the active class to the popup
        void billPopup.offsetWidth;
        
        billPopup.style.opacity = '1';
        billPopup.style.transform = 'translateY(0)';
        billPopup.classList.add('active');
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        console.log('Bill popup should now be visible');
    }
    
    // Function to close bill popup
    function closeBillPopup() {
        // Hide the popup with animation
        billPopup.classList.remove('active');
        
        // Wait for animation to complete before hiding overlay
        setTimeout(() => {
            billPopupOverlay.classList.remove('active');
            // After the fade-out animation completes, hide the overlay completely
            setTimeout(() => {
                billPopupOverlay.style.display = 'none';
            }, 300);
            
            // Reset toggle and items list
            billPopupToggleInput.checked = false;
            billPopupItems.style.display = 'none';
            billPopupItems.classList.remove('visible');
        }, 300);
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        console.log('Bill popup closed');
    }
    
    // Toggle items list visibility
    billPopupToggleInput.addEventListener('change', function() {
        console.log("Bill popup toggle changed:", this.checked);
        
        if (this.checked) {
            // Show items list
            billPopupItems.style.display = 'block';
            // Force a reflow before adding the visible class
            void billPopupItems.offsetWidth;
            billPopupItems.classList.add('visible');
        } else {
            // Hide items list
            billPopupItems.classList.remove('visible');
            setTimeout(() => {
                billPopupItems.style.display = 'none';
            }, 300); // Match the transition duration
        }
    });
    
    // Close popup when clicking on close button
    billPopupClose.addEventListener('click', closeBillPopup);
    
    // Close popup when clicking outside
    billPopupOverlay.addEventListener('click', function(e) {
        if (e.target === billPopupOverlay) {
            closeBillPopup();
        }
    });
    
    // Handle edit button click
    billPopupEdit.addEventListener('click', function() {
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        
        if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
            const bill = savedBills[currentBillIndex];
            
            // Close the popup
            closeBillPopup();
            
            // Set customer name and date
            localStorage.setItem('customerName', bill.customerName || '');
            
            // Extract date in the format expected by the input field (YYYY-MM-DD)
            let dateValue = formattedDate; // Default to today
            if (bill.date) {
                try {
                    // Try to parse date in format DD/MM/YYYY
                    if (bill.date.includes('/')) {
                        const [day, month, year] = bill.date.split('/');
                        dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    } else {
                        // Try to parse as a date object
                        const date = new Date(bill.date);
                        if (!isNaN(date.getTime())) {
                            dateValue = date.toISOString().split('T')[0];
                        }
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                }
            }
            localStorage.setItem('customerDate', dateValue);
            
            // Update display
            customerNameText.textContent = bill.customerName || '';
            customerNameDisplay.classList.add('visible');
            adjustNameDisplayWidth();
            
            // Populate cart with items from the bill
            if (bill.items && bill.items.length > 0) {
                // Clear existing cart
                resetCart();
                
                // Add each item to the cart
                bill.items.forEach(item => {
                    // Check if the app has an addItem function
                    if (typeof window.addItem === 'function') {
                        // Add the item to the cart
                        window.addItem(item.name, parseFloat(item.price || 0), parseInt(item.quantity || 1));
                    } else {
                        console.warn('addItem function not found, cannot add items to cart');
                    }
                });
                
                // Show toast message
                showToast('Bill loaded for editing');
            } else {
                showToast('Bill has no items to edit');
            }
            
            // Delete the bill from saved bills
            savedBills.splice(currentBillIndex, 1);
            localStorage.setItem('savedBills', JSON.stringify(savedBills));
            
            // Close saved bills page
            closeSavedBillsPage();
        }
    });
    
    // Handle delete button click
    billPopupDelete.addEventListener('click', function() {
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        
        if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
            // Delete the bill from saved bills
            savedBills.splice(currentBillIndex, 1);
            localStorage.setItem('savedBills', JSON.stringify(savedBills));
            
            // Close the popup
            closeBillPopup();
            
            // Show toast message
            showToast('Bill deleted successfully');
            
            // Refresh the saved bills list
            displaySavedBills(savedBills);
        }
    });
    
    // Function to search bills
    function searchBills(query) {
        console.log('Searching bills with query:', query);
        
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        
        if (!query || query.trim() === '') {
            // If query is empty, show all bills
            console.log('Empty query, showing all bills:', savedBills.length);
            displaySavedBills(savedBills);
            return;
        }
        
        // Convert query to lowercase for case-insensitive search
        const lowerQuery = query.trim().toLowerCase();
        
        // Filter bills by customer name
        const filteredBills = savedBills.filter(bill => 
            bill.customerName && bill.customerName.trim().toLowerCase().includes(lowerQuery)
        );
        
        console.log('Found', filteredBills.length, 'bills matching query');
        
        // Display filtered bills
        displaySavedBills(filteredBills);
    }
    
    // Function to initialize search functionality
    function initializeSearchFunctionality() {
        console.log('Initializing search functionality');
        
        // Add event listener to search button
        if (savedBillsSearchBtn) {
            savedBillsSearchBtn.addEventListener('click', function() {
                const query = savedBillsSearchInput.value.trim();
                searchBills(query);
            });
        }
        
        // Add event listener to search input for Enter key
        if (savedBillsSearchInput) {
            savedBillsSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = this.value.trim();
                    searchBills(query);
                }
            });
            
            // Add input event listener to search as you type
            savedBillsSearchInput.addEventListener('input', function() {
                const query = this.value.trim();
                searchBills(query);
            });
        }
    }

    // Event listeners for saved bills
    savedBillsIcon.addEventListener('click', function() {
        console.log('Saved bills icon clicked');
        openSavedBillsPage();
        // Initialize search functionality when the saved bills page is opened
        setTimeout(initializeSearchFunctionality, 100);
    });

    savedBillsClose.addEventListener('click', function(e) {
        console.log('Saved bills close button clicked');
        // Prevent event propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Add a visual feedback class
        this.classList.add('clicked');
        
        // Remove the class after animation
        setTimeout(() => {
            this.classList.remove('clicked');
        }, 150);
        
        // Close the saved bills page
        closeSavedBillsPage();
    });

    // Close saved bills page when clicking outside
    savedBillsOverlay.addEventListener('click', function(e) {
        if (e.target === savedBillsOverlay) {
            closeSavedBillsPage();
        }
    });

    // Make functions available globally
    window.openSavedBillsPage = openSavedBillsPage;
    window.displaySavedBills = displaySavedBills;
    window.showToast = showToast;
    window.resetCart = resetCart;
    window.adjustNameDisplayWidth = adjustNameDisplayWidth;
    window.searchBills = searchBills;

    // Migrate existing saved bills to ensure newest bills are at the top
    migrateSavedBills();

    // Function to migrate existing saved bills to the new format
    function migrateSavedBills() {
        try {
            const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
            if (savedBills.length > 0) {
                console.log('Migrating', savedBills.length, 'saved bills to ensure newest first order');
                
                // Sort bills by date (newest first)
                savedBills.sort((a, b) => {
                    // Handle different date formats
                    let dateA, dateB;
                    
                    try {
                        // Try to parse date in format DD/MM/YYYY
                        if (a.date && a.date.includes('/')) {
                            const [day, month, year] = a.date.split('/');
                            dateA = new Date(year, month - 1, day);
                        } else if (a.date) {
                            dateA = new Date(a.date);
                        } else {
                            dateA = new Date(0); // Default to epoch if no date
                        }
                        
                        if (b.date && b.date.includes('/')) {
                            const [day, month, year] = b.date.split('/');
                            dateB = new Date(year, month - 1, day);
                        } else if (b.date) {
                            dateB = new Date(b.date);
                        } else {
                            dateB = new Date(0); // Default to epoch if no date
                        }
                    } catch (e) {
                        console.error('Error parsing dates:', e);
                        // Fallback to string comparison
                        return (b.date || '').localeCompare(a.date || '');
                    }
                    
                    // Return newest first
                    return dateB - dateA;
                });
                
                // Save the sorted bills back to localStorage
                localStorage.setItem('savedBills', JSON.stringify(savedBills));
                console.log('Migration complete - bills are now sorted with newest first');
            }
        } catch (error) {
            console.error('Error migrating saved bills:', error);
        }
    }

    // Add event listener for page unload to clear customer name if bill not confirmed
    window.addEventListener('beforeunload', function() {
        // Only clear if there's a customer name but no confirmed bill
        if (localStorage.getItem('customerName') && !localStorage.getItem('billConfirmed')) {
            localStorage.removeItem('customerName');
            localStorage.removeItem('customerDate');
        }
    });
}); 