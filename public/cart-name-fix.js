// Fix for item names overlapping with minus buttons in cart

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Initial check
  setTimeout(fixCartItemNameOverlap, 50); // Small delay to ensure proper rendering
  
  // Also check whenever cart updates
  const observer = new MutationObserver(() => {
    setTimeout(fixCartItemNameOverlap, 50);
  });
  
  // Watch for changes in the selected-items-list
  const targetNode = document.getElementById('selected-items-list');
  if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
  }
  
  // Also check on resize
  window.addEventListener('resize', function() {
    setTimeout(fixCartItemNameOverlap, 100);
  });
});

// Fix item names that would overlap with the minus button
function fixCartItemNameOverlap() {
  // First, find all selected-item-row elements to add invisible boundary markers
  const rows = document.querySelectorAll('.selected-item-row');
  
  rows.forEach(function(row) {
    // Get the minus button in each row
    const minusBtn = row.querySelector('.decrease-selected');
    const nameElement = row.querySelector('.selected-item-name');
    
    if (!minusBtn || !nameElement) return;
    
    // Reset any previous fix first
    nameElement.style.display = '';
    nameElement.style.maxWidth = '';
    nameElement.style.whiteSpace = '';
    nameElement.style.marginBottom = '';
    
    // Get the position of the minus button
    const btnRect = minusBtn.getBoundingClientRect();
    
    // Create an invisible vertical boundary line at 15px before the minus button
    const boundaryPosition = btnRect.left - 15; // 15px buffer before the button
    
    // Get the right edge position of the name element
    const nameRect = nameElement.getBoundingClientRect();
    
    // If the name extends beyond our invisible boundary line, wrap the text
    if (nameRect.right > boundaryPosition) {
      // Text crosses the boundary line, force it to wrap to two lines
      nameElement.style.display = 'block';
      nameElement.style.maxWidth = '100%';
      nameElement.style.marginBottom = '5px';
      nameElement.style.whiteSpace = 'normal';
    }
  });
};

/**
 * Enhanced Cart Behavior
 * - Auto-collapse cart when reaching end of page
 * - Auto-expand when scrolling up
 * - Allow manual expand/collapse with arrow button regardless of position
 */

document.addEventListener('DOMContentLoaded', () => {
    // Track if we're at the bottom of the page
    let isAtBottom = false;
    // Track if the cart was auto-collapsed (not user collapsed)
    let autoCollapsed = false;
    
    // Get required elements
    const cart = document.querySelector('.selected-items-container');
    const arrowBtn = document.getElementById('toggle-cart-arrow');
    
    // Function to check if we're at the bottom of the page
    function checkBottomOfPage() {
        // Consider "at bottom" when within 50px of the bottom
        const atBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 50;
        
        if (atBottom !== isAtBottom) {
            isAtBottom = atBottom;
            
            // Only affect floating cart
            if (cart.classList.contains('floating-cart')) {
                if (isAtBottom) {
                    // Add a class to better style the cart at bottom
                    cart.classList.add('at-page-bottom');
                    
                    // Auto-collapse if user hasn't manually expanded
                    if (!window.userCollapsed && !cart.classList.contains('cart-collapsed')) {
                        cart.classList.add('no-transition');
                        cart.classList.add('cart-collapsed');
                        if (arrowBtn) arrowBtn.textContent = '↑';
                        autoCollapsed = true;
                        
                        // Clean up transition class after a delay
                        setTimeout(() => {
                            cart.classList.remove('no-transition');
                        }, 50);
                    }
                } else {
                    // Remove bottom styling
                    cart.classList.remove('at-page-bottom');
                    
                    // Auto-expand when scrolling back up, but only if it was auto-collapsed
                    if (autoCollapsed && cart.classList.contains('cart-collapsed')) {
                        cart.classList.add('no-transition');
                        cart.classList.remove('cart-collapsed');
                        if (arrowBtn) arrowBtn.textContent = '↓';
                        autoCollapsed = false;
                        
                        // Ensure scroll indicator is updated
                        if (typeof updateFloatingCartScrollIndicator === 'function') {
                            updateFloatingCartScrollIndicator();
                        }
                        
                        // Clean up transition class after a delay
                        setTimeout(() => {
                            cart.classList.remove('no-transition');
                        }, 50);
                    }
                }
            }
        }
    }
    
    // Override the toggleCartCollapse function to handle user interactions properly
    if (window.toggleCartCollapse) {
        const originalToggleCartCollapse = window.toggleCartCollapse;
        
        window.toggleCartCollapse = function() {
            // When user manually toggles, set userCollapsed based on current state
            autoCollapsed = false; // User action overrides auto behavior
            originalToggleCartCollapse();
        };
    }
    
    // Listen for scroll events with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                checkBottomOfPage();
                scrollTimeout = null;
            }, 100); // Check every 100ms for better performance
        }
    }, { passive: true });
    
    // Check on initial load
    setTimeout(checkBottomOfPage, 500);
});
