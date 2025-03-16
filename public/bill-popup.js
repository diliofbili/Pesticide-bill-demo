// Bill Popup Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bill popup script loaded');
    
    // Get all bill popup elements
    const billPopupOverlay = document.getElementById('bill-popup-overlay');
    const billPopup = document.getElementById('bill-popup');
    const billPopupTitle = document.getElementById('bill-popup-title');
    const billPopupClose = document.getElementById('bill-popup-close');
    const billPopupBody = document.getElementById('bill-popup-body');
    
    // These will be created dynamically
    let billPopupToggleInput;
    let billPopupEdit;
    let billPopupDelete;
    let billPopupItems;
    
    // Variable to store the current bill index
    let currentBillIndex = -1;
    
    // Ensure localStorage has required structures
    if (!localStorage.getItem('savedBills')) {
        localStorage.setItem('savedBills', JSON.stringify([]));
    }
    
    // Function to open bill popup
    function openBillPopup(bill, index) {
        console.log('Opening bill popup for:', bill.customerName);
        console.log('Bill data:', JSON.stringify(bill));
        
        // Ensure bill.items is properly initialized
        if (!bill.items) {
            bill.items = [];
        }
        
        // Convert bill.items to array if it's not already
        if (!Array.isArray(bill.items)) {
            try {
                // Try to parse if it's a string
                if (typeof bill.items === 'string') {
                    bill.items = JSON.parse(bill.items);
                } else {
                    // If it's an object but not an array, convert to array
                    bill.items = Object.values(bill.items);
                }
            } catch (e) {
                console.error("Error parsing bill items:", e);
                bill.items = [];
            }
        }
        
        // Store the current bill index
        if (index !== undefined) {
            currentBillIndex = index;
        }
        
        // Clear the popup body
        billPopupBody.innerHTML = '';
        
        // Create customer name info item
        const customerNameItem = document.createElement('div');
        customerNameItem.className = 'bill-popup-info-item';
        
        const customerNameLabel = document.createElement('div');
        customerNameLabel.className = 'bill-popup-info-label';
        customerNameLabel.textContent = 'Customer Name';
        
        const customerNameValue = document.createElement('div');
        customerNameValue.className = 'bill-popup-info-value';
        customerNameValue.textContent = bill.customerName || 'Not specified';
        
        customerNameItem.appendChild(customerNameLabel);
        customerNameItem.appendChild(customerNameValue);
        
        // Create date info item
        const dateItem = document.createElement('div');
        dateItem.className = 'bill-popup-info-item';
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'bill-popup-info-label';
        dateLabel.textContent = 'Date';
        
        const dateValue = document.createElement('div');
        dateValue.className = 'bill-popup-info-value';
        dateValue.textContent = bill.date || 'No date';
        
        dateItem.appendChild(dateLabel);
        dateItem.appendChild(dateValue);
        
        // Create amount info item
        const amountItem = document.createElement('div');
        amountItem.className = 'bill-popup-info-item';
        
        const amountLabel = document.createElement('div');
        amountLabel.className = 'bill-popup-info-label';
        amountLabel.textContent = 'Total Amount';
        
        const amountValue = document.createElement('div');
        amountValue.className = 'bill-popup-info-value amount';
        amountValue.textContent = bill.totalAmount || '₹0';
        
        amountItem.appendChild(amountLabel);
        amountItem.appendChild(amountValue);
        
        // Add the info items to the body
        billPopupBody.appendChild(customerNameItem);
        billPopupBody.appendChild(dateItem);
        billPopupBody.appendChild(amountItem);
        
        // Create toggle for items
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'bill-popup-toggle';
        toggleContainer.innerHTML = `
            <div class="bill-popup-toggle-label">View Items</div>
            <label class="bill-popup-toggle-switch">
                <input type="checkbox" id="bill-popup-toggle-input">
                <span class="bill-popup-toggle-slider"></span>
            </label>
        `;
        billPopupBody.appendChild(toggleContainer);
        
        // Create items container
        billPopupItems = document.createElement('div');
        billPopupItems.className = 'bill-popup-items';
        billPopupItems.id = 'bill-popup-items';
        billPopupBody.appendChild(billPopupItems);
        
        // Get the toggle input
        billPopupToggleInput = document.getElementById('bill-popup-toggle-input');
        
        // Remove any existing event listeners to prevent duplicates
        const newToggleInput = billPopupToggleInput.cloneNode(true);
        billPopupToggleInput.parentNode.replaceChild(newToggleInput, billPopupToggleInput);
        billPopupToggleInput = newToggleInput;
        
        // Populate items list
        if (bill.items && bill.items.length > 0) {
            console.log("Bill has items:", bill.items.length, bill.items);
            
            // Clear any existing items
            billPopupItems.innerHTML = '';
            
            bill.items.forEach(item => {
                const billItem = document.createElement('div');
                billItem.className = 'bill-item';
                
                const itemName = document.createElement('div');
                itemName.className = 'bill-item-name';
                itemName.textContent = item.name || item.displayName || 'Unknown item';
                
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
            console.log("Bill has no items");
            billPopupItems.innerHTML = '';
            const noItems = document.createElement('div');
            noItems.className = 'bill-item no-items';
            noItems.textContent = 'No items in this bill';
            billPopupItems.appendChild(noItems);
        }
        
        // Create action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'bill-popup-actions';
        actionsContainer.innerHTML = `
            <button class="bill-popup-btn edit" id="bill-popup-edit">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="bill-popup-btn delete" id="bill-popup-delete">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        `;
        billPopupBody.appendChild(actionsContainer);
        
        // Get the action buttons
        billPopupEdit = document.getElementById('bill-popup-edit');
        billPopupDelete = document.getElementById('bill-popup-delete');
        
        // Add event listeners to the buttons
        billPopupEdit.addEventListener('click', handleEditButtonClick);
        billPopupDelete.addEventListener('click', handleDeleteButtonClick);
        
        // Add event listener to the toggle
        billPopupToggleInput.addEventListener('change', function() {
            console.log("Bill popup toggle changed:", this.checked);
            
            if (this.checked) {
                // Show items list with direct style manipulation
                billPopupItems.style.display = 'block';
                billPopupItems.style.opacity = '1';
                billPopupItems.style.maxHeight = '250px';
                billPopupItems.style.padding = '12px';
                billPopupItems.style.border = '1px solid #444';
                billPopupItems.style.marginBottom = '20px';
                billPopupItems.style.overflowY = 'auto';
                
                // Force a reflow before adding the visible class
                void billPopupItems.offsetWidth;
                billPopupItems.classList.add('visible');
                
                console.log("Items container display:", billPopupItems.style.display);
                console.log("Items container classes:", billPopupItems.className);
                console.log("Items container children:", billPopupItems.children.length);
            } else {
                // Hide items list
                billPopupItems.classList.remove('visible');
                setTimeout(() => {
                    billPopupItems.style.display = 'none';
                }, 300); // Match the transition duration
            }
        });
        
        // Also add a click event for more reliable toggling
        billPopupToggleInput.addEventListener('click', function() {
            console.log("Toggle clicked, checked:", this.checked);
            
            // Small delay to ensure the checked state is updated
            setTimeout(() => {
                if (this.checked) {
                    // Show items list with direct style manipulation
                    billPopupItems.style.display = 'block';
                    billPopupItems.style.opacity = '1';
                    billPopupItems.style.maxHeight = '250px';
                    billPopupItems.style.padding = '12px';
                    billPopupItems.style.border = '1px solid #444';
                    billPopupItems.style.marginBottom = '20px';
                    billPopupItems.style.overflowY = 'auto';
                    billPopupItems.classList.add('visible');
                }
            }, 50);
        });
        
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
        console.log('Closing bill popup');
        
        // Hide the popup with animation
        billPopup.style.opacity = '0';
        billPopup.style.transform = 'translateY(20px)';
        billPopup.classList.remove('active');
        
        // Wait for animation to complete before hiding overlay
        setTimeout(() => {
            billPopupOverlay.style.opacity = '0';
            billPopupOverlay.style.visibility = 'hidden';
            billPopupOverlay.classList.remove('active');
            
            // After the fade-out animation completes, hide the overlay completely
            setTimeout(() => {
                billPopupOverlay.style.display = 'none';
            }, 300);
            
            // Reset items list if it exists
            if (billPopupToggleInput) {
                billPopupToggleInput.checked = false;
            }
            if (billPopupItems) {
                billPopupItems.style.display = 'none';
                billPopupItems.classList.remove('visible');
            }
        }, 300);
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        console.log('Bill popup closed');
    }
    
    // Handle edit button click
    function handleEditButtonClick() {
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        
        if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
            // Get the current bill with the most up-to-date data
            const bill = savedBills[currentBillIndex];
            
            // Store the bill in a global variable for reference
            window.currentEditingBill = bill;
            
            // Create edit modal if it doesn't exist
            let editModalOverlay = document.getElementById('edit-bill-modal-overlay');
            if (!editModalOverlay) {
                // Create the edit modal overlay
                editModalOverlay = document.createElement('div');
                editModalOverlay.id = 'edit-bill-modal-overlay';
                editModalOverlay.className = 'bill-modal-overlay';
                
                // Create the edit modal
                const editModal = document.createElement('div');
                editModal.id = 'edit-bill-modal';
                editModal.className = 'bill-modal';
                
                // Create the edit modal header
                const editModalHeader = document.createElement('div');
                editModalHeader.className = 'bill-modal-header';
                
                const editModalTitle = document.createElement('div');
                editModalTitle.className = 'bill-modal-title';
                editModalTitle.textContent = 'Edit Bill';
                
                const editModalClose = document.createElement('button');
                editModalClose.className = 'bill-modal-close';
                editModalClose.innerHTML = '&times;';
                editModalClose.addEventListener('click', closeEditModal);
                
                editModalHeader.appendChild(editModalTitle);
                editModalHeader.appendChild(editModalClose);
                
                // Create the edit modal body
                const editModalBody = document.createElement('div');
                editModalBody.className = 'bill-modal-body';
                editModalBody.id = 'edit-bill-modal-body';
                
                // Create customer name input
                const customerNameGroup = document.createElement('div');
                customerNameGroup.className = 'bill-info-item';
                
                const customerNameLabel = document.createElement('div');
                customerNameLabel.className = 'bill-info-label';
                customerNameLabel.textContent = 'Customer Name';
                
                const customerNameInput = document.createElement('input');
                customerNameInput.type = 'text';
                customerNameInput.className = 'customer-modal-input';
                customerNameInput.id = 'edit-customer-name';
                customerNameInput.value = bill.customerName || '';
                
                customerNameGroup.appendChild(customerNameLabel);
                customerNameGroup.appendChild(customerNameInput);
                
                // Create date input
                const dateGroup = document.createElement('div');
                dateGroup.className = 'bill-info-item';
                
                const dateLabel = document.createElement('div');
                dateLabel.className = 'bill-info-label';
                dateLabel.textContent = 'Date';
                
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'customer-modal-input';
                dateInput.id = 'edit-customer-date';
                
                // Convert date format if needed
                let dateValue = new Date().toISOString().split('T')[0]; // Default to today
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
                dateInput.value = dateValue;
                
                dateGroup.appendChild(dateLabel);
                dateGroup.appendChild(dateInput);
                
                // Create items section
                const itemsSection = document.createElement('div');
                itemsSection.className = 'bill-info-item';
                
                const itemsLabel = document.createElement('div');
                itemsLabel.className = 'bill-info-label';
                itemsLabel.textContent = 'Items';
                
                // Add "Add New Item" button
                const addNewItemBtn = document.createElement('button');
                addNewItemBtn.className = 'add-new-item-btn';
                addNewItemBtn.innerHTML = '<i class="fas fa-plus"></i> Add New Item';
                addNewItemBtn.addEventListener('click', showItemSelectionModal);
                
                itemsLabel.appendChild(addNewItemBtn);
                
                const itemsList = document.createElement('div');
                itemsList.className = 'edit-bill-items-list';
                itemsList.id = 'edit-bill-items-list';
                
                // Add items to the list
                if (bill.items && bill.items.length > 0) {
                    bill.items.forEach((item, idx) => {
                        const itemRow = document.createElement('div');
                        itemRow.className = 'edit-bill-item-row';
                        
                        const itemName = document.createElement('div');
                        itemName.className = 'edit-bill-item-name';
                        itemName.textContent = item.name || 'Unknown item';
                        
                        const itemPrice = document.createElement('div');
                        itemPrice.className = 'edit-bill-item-price';
                        
                        // Create price input instead of static text
                        const priceInput = document.createElement('input');
                        priceInput.type = 'number';
                        priceInput.min = '0';
                        priceInput.step = '0.01';
                        priceInput.className = 'edit-bill-item-price-input';
                        priceInput.value = parseFloat(item.price || 0).toFixed(2);
                        priceInput.dataset.index = idx;
                        
                        // Add rupee symbol before price input
                        const priceSymbol = document.createElement('span');
                        priceSymbol.className = 'price-symbol';
                        priceSymbol.textContent = '₹';
                        
                        itemPrice.appendChild(priceSymbol);
                        itemPrice.appendChild(priceInput);
                        
                        const itemQty = document.createElement('div');
                        itemQty.className = 'edit-bill-item-qty';
                        
                        const qtyInput = document.createElement('input');
                        qtyInput.type = 'number';
                        qtyInput.min = '1';
                        qtyInput.className = 'edit-bill-item-qty-input';
                        qtyInput.value = parseInt(item.quantity || 1);
                        qtyInput.dataset.index = idx;
                        
                        itemQty.appendChild(qtyInput);
                        
                        // Create remove button
                        const removeBtn = document.createElement('div');
                        removeBtn.className = 'edit-bill-item-remove';
                        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
                        removeBtn.title = 'Remove item';
                        removeBtn.dataset.index = idx;
                        
                        // Add click event to remove item
                        removeBtn.addEventListener('click', function() {
                            removeItemFromBill(parseInt(this.dataset.index));
                        });
                        
                        itemRow.appendChild(itemName);
                        itemRow.appendChild(itemPrice);
                        itemRow.appendChild(itemQty);
                        itemRow.appendChild(removeBtn);
                        
                        itemsList.appendChild(itemRow);
                    });
                } else {
                    const noItems = document.createElement('div');
                    noItems.className = 'edit-bill-no-items';
                    noItems.textContent = 'No items in this bill';
                    itemsList.appendChild(noItems);
                }
                
                itemsSection.appendChild(itemsLabel);
                itemsSection.appendChild(itemsList);
                
                // Create buttons
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'bill-modal-buttons';
                
                const cancelButton = document.createElement('button');
                cancelButton.className = 'bill-modal-button cancel';
                cancelButton.textContent = 'Cancel';
                cancelButton.addEventListener('click', closeEditModal);
                
                const saveButton = document.createElement('button');
                saveButton.className = 'bill-modal-button confirm';
                saveButton.textContent = 'Save Changes';
                saveButton.addEventListener('click', saveEditedBill);
                
                buttonsContainer.appendChild(cancelButton);
                buttonsContainer.appendChild(saveButton);
                
                // Add everything to the modal
                editModalBody.appendChild(customerNameGroup);
                editModalBody.appendChild(dateGroup);
                editModalBody.appendChild(itemsSection);
                editModalBody.appendChild(buttonsContainer);
                
                editModal.appendChild(editModalHeader);
                editModal.appendChild(editModalBody);
                
                editModalOverlay.appendChild(editModal);
                
                // Add to the document
                document.body.appendChild(editModalOverlay);
            } else {
                // Update existing modal with current bill data
                document.getElementById('edit-customer-name').value = bill.customerName || '';
                
                // Convert date format if needed
                let dateValue = new Date().toISOString().split('T')[0]; // Default to today
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
                document.getElementById('edit-customer-date').value = dateValue;
                
                // Update items list
                const itemsList = document.getElementById('edit-bill-items-list');
                itemsList.innerHTML = '';
                
                if (bill.items && bill.items.length > 0) {
                    bill.items.forEach((item, idx) => {
                        const itemRow = document.createElement('div');
                        itemRow.className = 'edit-bill-item-row';
                        
                        const itemName = document.createElement('div');
                        itemName.className = 'edit-bill-item-name';
                        itemName.textContent = item.name || 'Unknown item';
                        
                        const itemPrice = document.createElement('div');
                        itemPrice.className = 'edit-bill-item-price';
                        
                        // Create price input instead of static text
                        const priceInput = document.createElement('input');
                        priceInput.type = 'number';
                        priceInput.min = '0';
                        priceInput.step = '0.01';
                        priceInput.className = 'edit-bill-item-price-input';
                        priceInput.value = parseFloat(item.price || 0).toFixed(2);
                        priceInput.dataset.index = idx;
                        
                        // Add rupee symbol before price input
                        const priceSymbol = document.createElement('span');
                        priceSymbol.className = 'price-symbol';
                        priceSymbol.textContent = '₹';
                        
                        itemPrice.appendChild(priceSymbol);
                        itemPrice.appendChild(priceInput);
                        
                        const itemQty = document.createElement('div');
                        itemQty.className = 'edit-bill-item-qty';
                        
                        const qtyInput = document.createElement('input');
                        qtyInput.type = 'number';
                        qtyInput.min = '1';
                        qtyInput.className = 'edit-bill-item-qty-input';
                        qtyInput.value = parseInt(item.quantity || 1);
                        qtyInput.dataset.index = idx;
                        
                        itemQty.appendChild(qtyInput);
                        
                        // Create remove button
                        const removeBtn = document.createElement('div');
                        removeBtn.className = 'edit-bill-item-remove';
                        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
                        removeBtn.title = 'Remove item';
                        removeBtn.dataset.index = idx;
                        
                        // Add click event to remove item
                        removeBtn.addEventListener('click', function() {
                            removeItemFromBill(parseInt(this.dataset.index));
                        });
                        
                        itemRow.appendChild(itemName);
                        itemRow.appendChild(itemPrice);
                        itemRow.appendChild(itemQty);
                        itemRow.appendChild(removeBtn);
                        
                        itemsList.appendChild(itemRow);
                    });
                } else {
                    const noItems = document.createElement('div');
                    noItems.className = 'edit-bill-no-items';
                    noItems.textContent = 'No items in this bill';
                    itemsList.appendChild(noItems);
                }
            }
            
            // Close the bill popup
            closeBillPopup();
            
            // Show the edit modal with animation
            editModalOverlay.style.display = 'flex';
            editModalOverlay.style.opacity = '1';
            editModalOverlay.style.visibility = 'visible';
            
            // Add active class for animation
            setTimeout(() => {
                editModalOverlay.classList.add('active');
                const editModal = document.getElementById('edit-bill-modal');
                if (editModal) {
                    editModal.classList.add('active');
                }
            }, 10);
            
            // Add click event to close when clicking outside
            editModalOverlay.addEventListener('click', function(e) {
                if (e.target === editModalOverlay) {
                    closeEditModal();
                }
            });
            
            // Function to close edit modal
            function closeEditModal() {
                const editModal = document.getElementById('edit-bill-modal');
                const editModalOverlay = document.getElementById('edit-bill-modal-overlay');
                
                if (editModal) editModal.classList.remove('active');
                if (editModalOverlay) editModalOverlay.classList.remove('active');
                
                setTimeout(() => {
                    if (editModalOverlay) {
                        editModalOverlay.style.display = 'none';
                        editModalOverlay.style.opacity = '0';
                        editModalOverlay.style.visibility = 'hidden';
                    }
                    
                    // Reopen saved bills page
                    if (typeof window.openSavedBillsPage === 'function') {
                        window.openSavedBillsPage();
                    } else {
                        // Fallback if the global function is not available
                        const savedBillsOverlay = document.getElementById('saved-bills-overlay');
                        if (savedBillsOverlay) {
                            savedBillsOverlay.style.display = 'block';
                            savedBillsOverlay.style.opacity = '1';
                            savedBillsOverlay.style.visibility = 'visible';
                            savedBillsOverlay.classList.add('active');
                        }
                    }
                }, 300);
            }
            
            // Function to show item selection modal with the main pesticide list
            function showItemSelectionModal() {
                // Close the edit modal temporarily
                const editModalOverlay = document.getElementById('edit-bill-modal-overlay');
                if (editModalOverlay) {
                    editModalOverlay.style.display = 'none';
                }
                
                // Create item selection modal if it doesn't exist
                let itemSelectionModalOverlay = document.getElementById('item-selection-modal-overlay');
                if (!itemSelectionModalOverlay) {
                    // Create the item selection modal overlay
                    itemSelectionModalOverlay = document.createElement('div');
                    itemSelectionModalOverlay.id = 'item-selection-modal-overlay';
                    itemSelectionModalOverlay.className = 'bill-modal-overlay';
                    
                    // Create the item selection modal
                    const itemSelectionModal = document.createElement('div');
                    itemSelectionModal.id = 'item-selection-modal';
                    itemSelectionModal.className = 'bill-modal item-selection-modal';
                    
                    // Create the item selection modal header
                    const itemSelectionModalHeader = document.createElement('div');
                    itemSelectionModalHeader.className = 'bill-modal-header';
                    
                    const itemSelectionModalTitle = document.createElement('div');
                    itemSelectionModalTitle.className = 'bill-modal-title';
                    itemSelectionModalTitle.textContent = 'Select Item';
                    
                    const itemSelectionModalClose = document.createElement('button');
                    itemSelectionModalClose.className = 'bill-modal-close';
                    itemSelectionModalClose.innerHTML = '&times;';
                    itemSelectionModalClose.addEventListener('click', closeItemSelectionModal);
                    
                    itemSelectionModalHeader.appendChild(itemSelectionModalTitle);
                    itemSelectionModalHeader.appendChild(itemSelectionModalClose);
                    
                    // Create the item selection modal body
                    const itemSelectionModalBody = document.createElement('div');
                    itemSelectionModalBody.className = 'bill-modal-body';
                    itemSelectionModalBody.id = 'item-selection-modal-body';
                    
                    // Create search input
                    const searchGroup = document.createElement('div');
                    searchGroup.className = 'bill-info-item';
                    
                    const searchInput = document.createElement('input');
                    searchInput.type = 'text';
                    searchInput.className = 'customer-modal-input search-input';
                    searchInput.id = 'item-search-input';
                    searchInput.placeholder = 'Search items...';
                    searchInput.addEventListener('input', filterItems);
                    
                    searchGroup.appendChild(searchInput);
                    
                    // Create items list container
                    const itemsListContainer = document.createElement('div');
                    itemsListContainer.className = 'items-list-container';
                    itemsListContainer.id = 'items-list-container';
                    
                    // Add everything to the modal
                    itemSelectionModalBody.appendChild(searchGroup);
                    itemSelectionModalBody.appendChild(itemsListContainer);
                    
                    itemSelectionModal.appendChild(itemSelectionModalHeader);
                    itemSelectionModal.appendChild(itemSelectionModalBody);
                    
                    itemSelectionModalOverlay.appendChild(itemSelectionModal);
                    
                    // Add to the document
                    document.body.appendChild(itemSelectionModalOverlay);
                } else {
                    // Reset search input
                    const searchInput = document.getElementById('item-search-input');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Clear the items list container to refresh it
                    const itemsListContainer = document.getElementById('items-list-container');
                    if (itemsListContainer) {
                        itemsListContainer.innerHTML = '';
                    }
                }
                
                // Show the item selection modal with animation
                itemSelectionModalOverlay.style.display = 'flex';
                itemSelectionModalOverlay.style.opacity = '1';
                itemSelectionModalOverlay.style.visibility = 'visible';
                
                // Add active class for animation
                setTimeout(() => {
                    itemSelectionModalOverlay.classList.add('active');
                    const itemSelectionModal = document.getElementById('item-selection-modal');
                    if (itemSelectionModal) {
                        itemSelectionModal.classList.add('active');
                    }
                    
                    // Ensure we have the latest pesticide data
                    window.pesticideData = null; // Force refresh
                    
                    // If the main app has a function to get the latest data, use it
                    if (typeof window.getPesticideData === 'function') {
                        window.pesticideData = window.getPesticideData();
                        console.log("Got latest data from getPesticideData:", window.pesticideData.length, "items");
                    } else {
                        // Try to get the data from the DOM if available
                        window.pesticideData = extractPesticideDataFromDOM();
                        console.log("Got latest data from DOM:", window.pesticideData.length, "items");
                    }
                    
                    // Populate the items list after the modal is visible
                    populateItemsList();
                }, 10);
                
                // Add click event to close when clicking outside
                itemSelectionModalOverlay.addEventListener('click', function(e) {
                    if (e.target === itemSelectionModalOverlay) {
                        closeItemSelectionModal();
                    }
                });
            }
            
            // Function to populate the items list from the main pesticide data
            function populateItemsList() {
                const itemsListContainer = document.getElementById('items-list-container');
                if (!itemsListContainer) return;
                
                // Clear existing items
                itemsListContainer.innerHTML = '';
                
                // Get pesticide data from the main app
                let pesticideData = window.pesticideData || [];
                
                // If no pesticide data is available in the window object, try to extract it from the DOM
                if (!pesticideData || pesticideData.length === 0) {
                    pesticideData = extractPesticideDataFromDOM();
                }
                
                if (pesticideData && pesticideData.length > 0) {
                    console.log("Found pesticide data:", pesticideData.length);
                    
                    // Group items by salt category
                    const categorizedItems = {};
                    let uncategorizedItems = [];
                    let currentCategory = null;
                    
                    // First pass: identify all categories
                    pesticideData.forEach((item) => {
                        if (item.price === 0) {
                            // This is a salt category
                            categorizedItems[item.name] = [];
                        }
                    });
                    
                    // Second pass: assign items to their categories
                    pesticideData.forEach((item, index) => {
                        if (item.price === 0) {
                            // This is a salt category
                            currentCategory = item.name;
                        } else if (currentCategory && categorizedItems[currentCategory]) {
                            // Add to the current category
                            categorizedItems[currentCategory].push({
                                item: item,
                                index: index
                            });
                        } else {
                            // No category found, add to uncategorized
                            uncategorizedItems.push({
                                item: item,
                                index: index
                            });
                        }
                    });
                    
                    // Render all categories and their items
                    Object.keys(categorizedItems).forEach(category => {
                        if (categorizedItems[category].length > 0) {
                            // Create category header
                            const categoryHeader = document.createElement('div');
                            categoryHeader.className = 'category-header';
                            categoryHeader.textContent = category;
                            itemsListContainer.appendChild(categoryHeader);
                            
                            // Add all items in this category
                            categorizedItems[category].forEach(({item, index}) => {
                                // Clean up item name to remove company names
                                let cleanName = item.name;
                                // Only remove company names in parentheses or after hyphen
                                if (typeof cleanName === 'string') {
                                    // Remove company names in parentheses
                                    cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
                                    
                                    // Remove company names after hyphen, but keep the name before the hyphen
                                    if (cleanName.includes('-')) {
                                        const parts = cleanName.split('-');
                                        if (parts.length > 1) {
                                            cleanName = parts[0].trim();
                                        }
                                    }
                                }
                                
                                const itemElement = document.createElement('div');
                                itemElement.className = 'selectable-item';
                                itemElement.dataset.index = index;
                                itemElement.dataset.name = cleanName;
                                itemElement.dataset.price = item.price;
                                itemElement.dataset.category = category;
                                
                                const itemName = document.createElement('div');
                                itemName.className = 'selectable-item-name';
                                itemName.textContent = cleanName;
                                
                                const itemPrice = document.createElement('div');
                                itemPrice.className = 'selectable-item-price';
                                itemPrice.textContent = `₹${parseFloat(item.price).toFixed(2)}`;
                                
                                itemElement.appendChild(itemName);
                                itemElement.appendChild(itemPrice);
                                
                                // Add click event to select the item
                                itemElement.addEventListener('click', function() {
                                    selectItemForBill({
                                        name: cleanName,
                                        price: item.price,
                                        category: category
                                    });
                                });
                                
                                itemsListContainer.appendChild(itemElement);
                            });
                        }
                    });
                    
                    // Add uncategorized items if any
                    if (uncategorizedItems.length > 0) {
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'category-header';
                        categoryHeader.textContent = 'Uncategorized';
                        itemsListContainer.appendChild(categoryHeader);
                        
                        uncategorizedItems.forEach(({item, index}) => {
                            // Clean up item name to remove company names
                            let cleanName = item.name;
                            // Only remove company names in parentheses or after hyphen
                            if (typeof cleanName === 'string') {
                                // Remove company names in parentheses
                                cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
                                
                                // Remove company names after hyphen, but keep the name before the hyphen
                                if (cleanName.includes('-')) {
                                    const parts = cleanName.split('-');
                                    if (parts.length > 1) {
                                        cleanName = parts[0].trim();
                                    }
                                }
                            }
                            
                            const itemElement = document.createElement('div');
                            itemElement.className = 'selectable-item';
                            itemElement.dataset.index = index;
                            itemElement.dataset.name = cleanName;
                            itemElement.dataset.price = item.price;
                            itemElement.dataset.category = 'Uncategorized';
                            
                            const itemName = document.createElement('div');
                            itemName.className = 'selectable-item-name';
                            itemName.textContent = cleanName;
                            
                            const itemPrice = document.createElement('div');
                            itemPrice.className = 'selectable-item-price';
                            itemPrice.textContent = `₹${parseFloat(item.price).toFixed(2)}`;
                            
                            itemElement.appendChild(itemName);
                            itemElement.appendChild(itemPrice);
                            
                            // Add click event to select the item
                            itemElement.addEventListener('click', function() {
                                selectItemForBill({
                                    name: cleanName,
                                    price: item.price,
                                    category: 'Uncategorized'
                                });
                            });
                            
                            itemsListContainer.appendChild(itemElement);
                        });
                    }
                } else {
                    // If no items found in DOM either
                    const noItems = document.createElement('div');
                    noItems.className = 'no-items-message';
                    noItems.textContent = 'No items available. Please add items to the main list first.';
                    itemsListContainer.appendChild(noItems);
                    
                    console.log("No pesticide data found in window.pesticideData or DOM");
                }
                
                // Reset item visibility after populating
                const searchInput = document.getElementById('item-search-input');
                if (searchInput && searchInput.value) {
                    filterItems();
                }
            }
            
            // Function to extract pesticide data from the DOM
            function extractPesticideDataFromDOM() {
                console.log("Extracting pesticide data from DOM");
                const extractedData = [];
                const mainItemsList = document.getElementById('items-list');
                
                if (!mainItemsList || mainItemsList.children.length === 0) {
                    return extractedData;
                }
                
                // Convert HTMLCollection to Array for easier manipulation
                const itemElements = Array.from(mainItemsList.children);
                let currentCategory = null;
                
                // First pass: extract all categories and items
                itemElements.forEach((element) => {
                    if (element.classList.contains('salt-category')) {
                        // This is a category header
                        currentCategory = element.textContent.trim();
                        
                        // Add category to the data
                        extractedData.push({
                            name: currentCategory,
                            price: 0, // Categories have price 0
                            saltComposition: ''
                        });
                    } else if (element.classList.contains('item')) {
                        // This is a product item
                        const nameElement = element.querySelector('.item-name');
                        const priceElement = element.querySelector('.item-price');
                        const compositionElement = element.querySelector('.item-composition');
                        
                        if (nameElement && priceElement) {
                            // Extract name (remove price and edit buttons text)
                            let name = nameElement.textContent.trim();
                            name = name.replace(/\s*Edit\s*Price\s*Edit\s*Quantity\s*/gi, '');
                            name = name.replace(/\s*₹\d+(\.\d+)?/g, '');
                            
                            // Extract company name if present
                            let company = '';
                            const companyElement = nameElement.querySelector('.item-company');
                            if (companyElement) {
                                company = companyElement.textContent.trim();
                                // Remove company name from the main name
                                name = name.replace(company, '').trim();
                            }
                            
                            // Extract price
                            let priceText = priceElement.textContent.trim();
                            let price = parseFloat(priceText.replace('₹', '')) || 0;
                            
                            // Extract composition
                            let composition = '';
                            if (compositionElement) {
                                composition = compositionElement.textContent.trim();
                            }
                            
                            // Add item to the data
                            extractedData.push({
                                name: name,
                                price: price,
                                company: company,
                                saltComposition: composition
                            });
                        }
                    }
                });
                
                // Log the extracted data for debugging
                console.log("Extracted data:", extractedData.length, "items");
                
                return extractedData;
            }
            
            // Function to filter items in the selection modal
            function filterItems() {
                const searchInput = document.getElementById('item-search-input');
                const searchTerm = searchInput.value.toLowerCase();
                const items = document.querySelectorAll('.selectable-item');
                const categories = document.querySelectorAll('.category-header');
                
                // First hide all category headers
                categories.forEach(category => {
                    category.style.display = 'none';
                });
                
                // Track which categories have visible items
                const visibleCategories = new Set();
                
                // Filter items and track their categories
                items.forEach(item => {
                    const itemName = item.dataset.name.toLowerCase();
                    const categoryName = item.dataset.category;
                    
                    if (itemName.includes(searchTerm)) {
                        item.style.display = 'flex';
                        // Add this item's category to the visible set
                        if (categoryName) {
                            visibleCategories.add(categoryName);
                        }
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show only category headers that have visible items
                categories.forEach(category => {
                    const categoryName = category.textContent.trim();
                    if (visibleCategories.has(categoryName)) {
                        category.style.display = 'block';
                    }
                });
            }
            
            // Function to select an item from the list and add it to the bill
            function selectItemForBill(item) {
                // Create new item object
                const newItem = {
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: 1,
                    total: parseFloat(item.price)
                };
                
                // Get saved bills from localStorage
                const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
                
                if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
                    // Add new item to the bill
                    if (!savedBills[currentBillIndex].items) {
                        savedBills[currentBillIndex].items = [];
                    }
                    
                    savedBills[currentBillIndex].items.push(newItem);
                    
                    // Recalculate total amount
                    let totalAmount = 0;
                    savedBills[currentBillIndex].items.forEach(item => {
                        totalAmount += parseFloat(item.total || 0);
                    });
                    
                    savedBills[currentBillIndex].totalAmount = `₹${totalAmount.toFixed(2)}`;
                    
                    // Update in localStorage
                    localStorage.setItem('savedBills', JSON.stringify(savedBills));
                    
                    // Close item selection modal
                    closeItemSelectionModal();
                    
                    // Update items list in edit modal
                    updateItemsList(savedBills[currentBillIndex].items);
                    
                    // Show success message
                    if (typeof window.showToast === 'function') {
                        window.showToast('Item added successfully');
                    } else {
                        alert('Item added successfully');
                    }
                }
            }
            
            // Function to close item selection modal
            function closeItemSelectionModal() {
                const itemSelectionModal = document.getElementById('item-selection-modal');
                const itemSelectionModalOverlay = document.getElementById('item-selection-modal-overlay');
                
                if (itemSelectionModal) itemSelectionModal.classList.remove('active');
                if (itemSelectionModalOverlay) itemSelectionModalOverlay.classList.remove('active');
                
                setTimeout(() => {
                    if (itemSelectionModalOverlay) {
                        itemSelectionModalOverlay.style.display = 'none';
                        itemSelectionModalOverlay.style.opacity = '0';
                        itemSelectionModalOverlay.style.visibility = 'hidden';
                    }
                    
                    // Show the edit modal again
                    const editModalOverlay = document.getElementById('edit-bill-modal-overlay');
                    if (editModalOverlay) {
                        editModalOverlay.style.display = 'flex';
                    }
                }, 300);
            }
            
            // Function to update items list in edit modal
            function updateItemsList(items) {
                const itemsList = document.getElementById('edit-bill-items-list');
                if (!itemsList) return;
                
                // Clear items list
                itemsList.innerHTML = '';
                
                if (items && items.length > 0) {
                    items.forEach((item, idx) => {
                        const itemRow = document.createElement('div');
                        itemRow.className = 'edit-bill-item-row';
                        
                        const itemName = document.createElement('div');
                        itemName.className = 'edit-bill-item-name';
                        itemName.textContent = item.name || 'Unknown item';
                        
                        const itemPrice = document.createElement('div');
                        itemPrice.className = 'edit-bill-item-price';
                        
                        // Create price input instead of static text
                        const priceInput = document.createElement('input');
                        priceInput.type = 'number';
                        priceInput.min = '0';
                        priceInput.step = '0.01';
                        priceInput.className = 'edit-bill-item-price-input';
                        priceInput.value = parseFloat(item.price || 0).toFixed(2);
                        priceInput.dataset.index = idx;
                        
                        // Add rupee symbol before price input
                        const priceSymbol = document.createElement('span');
                        priceSymbol.className = 'price-symbol';
                        priceSymbol.textContent = '₹';
                        
                        itemPrice.appendChild(priceSymbol);
                        itemPrice.appendChild(priceInput);
                        
                        const itemQty = document.createElement('div');
                        itemQty.className = 'edit-bill-item-qty';
                        
                        const qtyInput = document.createElement('input');
                        qtyInput.type = 'number';
                        qtyInput.min = '1';
                        qtyInput.className = 'edit-bill-item-qty-input';
                        qtyInput.value = parseInt(item.quantity || 1);
                        qtyInput.dataset.index = idx;
                        
                        itemQty.appendChild(qtyInput);
                        
                        // Create remove button
                        const removeBtn = document.createElement('div');
                        removeBtn.className = 'edit-bill-item-remove';
                        removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
                        removeBtn.title = 'Remove item';
                        removeBtn.dataset.index = idx;
                        
                        // Add click event to remove item
                        removeBtn.addEventListener('click', function() {
                            removeItemFromBill(parseInt(this.dataset.index));
                        });
                        
                        itemRow.appendChild(itemName);
                        itemRow.appendChild(itemPrice);
                        itemRow.appendChild(itemQty);
                        itemRow.appendChild(removeBtn);
                        
                        itemsList.appendChild(itemRow);
                    });
                } else {
                    const noItems = document.createElement('div');
                    noItems.className = 'edit-bill-no-items';
                    noItems.textContent = 'No items in this bill';
                    itemsList.appendChild(noItems);
                }
            }
            
            // Function to remove item from bill
            function removeItemFromBill(index) {
                // Get saved bills from localStorage
                const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
                
                if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
                    // Remove the item from the bill
                    if (savedBills[currentBillIndex].items && 
                        index >= 0 && 
                        index < savedBills[currentBillIndex].items.length) {
                        
                        // Remove the item
                        savedBills[currentBillIndex].items.splice(index, 1);
                        
                        // Recalculate total amount
                        let totalAmount = 0;
                        savedBills[currentBillIndex].items.forEach(item => {
                            totalAmount += parseFloat(item.total || 0);
                        });
                        
                        savedBills[currentBillIndex].totalAmount = `₹${totalAmount.toFixed(2)}`;
                        
                        // Update in localStorage
                        localStorage.setItem('savedBills', JSON.stringify(savedBills));
                        
                        // Update items list in edit modal
                        updateItemsList(savedBills[currentBillIndex].items);
                        
                        // Show success message
                        if (typeof window.showToast === 'function') {
                            window.showToast('Item removed successfully');
                        } else {
                            alert('Item removed successfully');
                        }
                    }
                }
            }
            
            // Function to save edited bill
            function saveEditedBill() {
                // Get edited values
                const editedName = document.getElementById('edit-customer-name').value.trim();
                const editedDate = document.getElementById('edit-customer-date').value;
                
                // Format date for display
                const displayDate = formatDate(editedDate);
                
                // Get saved bills from localStorage to get the current state of items
                const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
                
                // Get the current items from the DOM
                const itemsList = document.getElementById('edit-bill-items-list');
                const itemRows = itemsList.querySelectorAll('.edit-bill-item-row');
                const updatedItems = [];
                
                // Extract data from each item row
                itemRows.forEach((row, index) => {
                    const nameElement = row.querySelector('.edit-bill-item-name');
                    const priceInput = row.querySelector('.edit-bill-item-price-input');
                    const qtyInput = row.querySelector('.edit-bill-item-qty-input');
                    
                    if (nameElement && priceInput && qtyInput) {
                        const name = nameElement.textContent.trim();
                        const price = parseFloat(priceInput.value) || 0;
                        const quantity = parseInt(qtyInput.value) || 1;
                        const total = price * quantity;
                        
                        updatedItems.push({
                            name: name,
                            price: price,
                            quantity: quantity,
                            total: total
                        });
                    }
                });
                
                // Calculate new total amount
                let totalAmount = 0;
                updatedItems.forEach(item => {
                    totalAmount += parseFloat(item.total || 0);
                });
                
                // Create updated bill
                const updatedBill = {
                    customerName: editedName,
                    date: displayDate,
                    totalAmount: `₹${totalAmount.toFixed(2)}`,
                    items: updatedItems
                };
                
                // Update in localStorage
                savedBills[currentBillIndex] = updatedBill;
                localStorage.setItem('savedBills', JSON.stringify(savedBills));
                
                // Close edit modal
                closeEditModal();
                
                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('Bill updated successfully');
                } else {
                    alert('Bill updated successfully');
                }
                
                // Refresh the saved bills list
                if (typeof window.displaySavedBills === 'function') {
                    window.displaySavedBills(savedBills);
                }
            }
            
            // Helper function to format date
            function formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }
    }
    
    // Handle delete button click
    function handleDeleteButtonClick() {
        // Get saved bills from localStorage
        const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
        
        if (currentBillIndex >= 0 && currentBillIndex < savedBills.length) {
            // Delete the bill from saved bills
            savedBills.splice(currentBillIndex, 1);
            localStorage.setItem('savedBills', JSON.stringify(savedBills));
            
            // Close the popup
            closeBillPopup();
            
            // Show toast message
            if (typeof window.showToast === 'function') {
                window.showToast('Bill deleted successfully');
            } else {
                alert('Bill deleted successfully');
            }
            
            // Refresh the saved bills list
            if (typeof window.displaySavedBills === 'function') {
                window.displaySavedBills(savedBills);
            } else {
                // Try to reload the page
                location.reload();
            }
        }
    }
    
    // Close popup when clicking on close button
    billPopupClose.addEventListener('click', closeBillPopup);
    
    // Close popup when clicking outside
    billPopupOverlay.addEventListener('click', function(e) {
        if (e.target === billPopupOverlay) {
            closeBillPopup();
        }
    });
    
    // Make functions available globally
    window.openBillPopup = openBillPopup;
    window.closeBillPopup = closeBillPopup;
    
    console.log('Bill popup functionality initialized');
}); 