using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Filters; // IMPORTANT: Add this for the AuthRequired filter
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AuthRequired] // 1. SECURITY: Ensures all actions are protected
    public class CartItemsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public CartItemsController(Mydbcontext context)
        {
            _context = context;
        }

        // Helper method to retrieve the user ID from the active session
        private int? GetCurrentUserIdFromSession()
        {
            return HttpContext.Session.GetInt32("UserID");
        }

        // -------------------------------------------------------------------
        // DELETED: GetCartItems(), GetCartItem(id), PutCartItem(id), PostCartItem()
        // These are removed because:
        // 1. Getting the items is handled by the secured CartsController.GetMyCart().
        // 2. Adding/Updating items is handled by the secured CartsController.AddItemToCart().
        // 3. Directly allowing PUT/POST/GET by arbitrary ID is insecure.
        // -------------------------------------------------------------------

        // -------------------------------------------------------------------
        // 🗑️ DELETE: api/CartItems/5 (Securely removes one item by its CartItemID)
        // -------------------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCartItem(int id)
        {
            var userId = GetCurrentUserIdFromSession();
            if (!userId.HasValue) return Unauthorized(); // Should be caught by filter, but safe check

            // 1. Find the CartItem AND verify ownership
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart) // Include the parent Cart to check the UserId
                .FirstOrDefaultAsync(ci => ci.CartItemId == id);

            if (cartItem == null)
            {
                // Return 404 if the item doesn't exist
                return NotFound();
            }

            // 2. CRITICAL SECURITY CHECK: Ensure the cart belongs to the current user
            if (cartItem.Cart.UserId != userId.Value)
            {
                // Return Forbidden if the user tries to delete an item from someone else's cart
                return Forbid("You do not have permission to delete this cart item.");
            }

            // 3. Remove the item
            _context.CartItems.Remove(cartItem);

            // 4. Update the parent Cart's modification time
            cartItem.Cart.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return NoContent(); // Success: 204 No Content
            }
            catch (Exception ex)
            {
                // Handle potential database issues
                Console.WriteLine($"Error deleting cart item: {ex.Message}");
                return StatusCode(500, "An error occurred while deleting the cart item.");
            }
        }

        // -------------------------------------------------------------------
        // 🗑️ DELETE: api/CartItems/clear (Optional: Removes ALL items from the user's cart)
        // -------------------------------------------------------------------
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearMyCart()
        {
            var userId = GetCurrentUserIdFromSession();
            if (!userId.HasValue) return Unauthorized();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                // Nothing to clear
                return NoContent();
            }

            // Remove all items in the collection
            _context.CartItems.RemoveRange(cart.CartItems);

            // Update the cart time
            cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool CartItemExists(int id)
        {
            return _context.CartItems.Any(e => e.CartItemId == id);
        }
    }
}