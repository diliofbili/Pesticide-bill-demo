/**
 * Edit Button Fix
 * This script ensures the pencil icon buttons work properly
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add redundant direct event handlers to all edit buttons
    function addRedundantHandlers() {
        const editButtons = document.querySelectorAll('.edit-price-btn');
        
        editButtons.forEach(button => {
            // Remove any existing handlers to prevent duplicates
            button.removeEventListener('click', handleEditButtonClick);
            
            // Add new handler
            button.addEventListener('click', handleEditButtonClick);
            
            // Also add handler to the icon if it exists
            const icon = button.querySelector('i');
            if (icon) {
                icon.removeEventListener('click', handleEditButtonClick);
                icon.addEventListener('click', handleEditButtonClick);
            }
        });
    }
    
    // Handler for edit button clicks
    function handleEditButtonClick(event) {
        event.stopPropagation();
        
        // Get the button (might be the icon's parent)
        const button = event.target.closest('.edit-price-btn');
        if (!button) return;
        
        // Get data-index attribute
        const index = parseInt(button.getAttribute('data-index'));
        
        // Call the existing menu toggle function
        if (typeof toggleEditOptionsMenu === 'function') {
            toggleEditOptionsMenu(index, event);
        }
    }
    
    // Initial setup
    addRedundantHandlers();
    
    // Also update after list rendering
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && 
                (mutation.target.id === 'items-list' || 
                 mutation.target.closest('#items-list'))) {
                addRedundantHandlers();
            }
        });
    });
    
    // Observe the items list for changes
    const itemsList = document.getElementById('items-list');
    if (itemsList) {
        observer.observe(itemsList, { childList: true, subtree: true });
    }
    
    // Apply once after a small delay to ensure all items are rendered
    setTimeout(addRedundantHandlers, 500);
});
