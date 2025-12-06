using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Filters;
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AuthRequired]
    public class CartsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public CartsController(Mydbcontext context)
        {
            _context = context;
        }

        private int? GetCurrentUserIdFromSession()
        {
            return HttpContext.Session.GetInt32("UserID");
        }

        // GET: api/Carts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cart>>> GetCarts()
        {
            return await _context.Carts.ToListAsync();
        }

        // GET: api/Carts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Cart>> GetCart(int id)
        {
            var cart = await _context.Carts.FindAsync(id);

            if (cart == null)
            {
                return NotFound();
            }

            return cart;
        }

        // PUT: api/Carts/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCart(int id, Cart cart)
        {
            if (id != cart.CartId)
            {
                return BadRequest();
            }

            _context.Entry(cart).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CartExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Carts
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Cart>> PostCart(Cart cart)
        {
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCart", new { id = cart.CartId }, cart);
        }

        // DELETE: api/Carts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCart(int id)
        {
            var cart = await _context.Carts.FindAsync(id);
            if (cart == null)
            {
                return NotFound();
            }

            _context.Carts.Remove(cart);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("mycart")]
        public async Task<ActionResult<Cart>> GetMyCart()
        {
            var userId = GetCurrentUserIdFromSession();
            if (!userId.HasValue) return Unauthorized();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.ProductImages)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                return Ok(new Cart
                {
                    CartItems = new List<CartItem>(),
                    UserId = userId.Value,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            // Optional: add price from variant product to each cart item
            foreach (var item in cart.CartItems)
            {
                if (item.Variant?.Product != null)
                {
                    item.Price = item.Variant.Product.Price;
                }
                else
                {
                    item.Price = 0;
                }
            }

            return Ok(cart);
        }





        [HttpPost("add")]
        public async Task<IActionResult> AddItemToCart([FromQuery] int variantId, [FromQuery] int quantity)
        {
            var userId = GetCurrentUserIdFromSession();
            if (!userId.HasValue)
            {
                return Unauthorized("You must be logged in to modify your cart.");
            }

            if (quantity <= 0)
            {
                return BadRequest("Quantity must be greater than zero.");
            }

            // 1. Check if the variant exists and get stock
            var variant = await _context.ProductVariants
                .FirstOrDefaultAsync(v => v.VariantId == variantId); // Use variantId parameter

            if (variant == null)
            {
                return NotFound("The specified product variant was not found.");
            }

            if (quantity > variant.Stock) // Use quantity parameter
            {
                return BadRequest($"Insufficient stock. Available: {variant.Stock} for this variant.");
            }

            // 2. Find or Create the User's Cart
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                // Create a new cart if the user doesn't have one
                cart = new Cart { UserId = userId.Value, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // 3. Find or Create/Update the Cart Item
            var cartItem = cart.CartItems
                .FirstOrDefault(ci => ci.VariantId == variantId); // Use variantId parameter

            if (cartItem == null)
            {
                // Item does not exist, so add new one
                cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    VariantId = variantId, // Use variantId parameter
                    Quantity = quantity,   // Use quantity parameter
                    AddedAt = DateTime.UtcNow
                };
                _context.CartItems.Add(cartItem);

            }
            else
            {
                // Item exists, so update quantity
                cartItem.Quantity = quantity; // Use quantity parameter
            }

            // 4. Update Cart's modification date
            cart.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Item successfully added/updated in cart.", cartItemId = cartItem.CartItemId });
            }
            catch (DbUpdateException ex)
            {
                // Log inner exception details for debugging 
                Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
                return StatusCode(500, "Error adding item to cart: Database error occurred.");
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearMyCart()
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (!userId.HasValue) return Unauthorized();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null) return NotFound("Cart not found");

            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cart cleared successfully" });
        }


        [HttpGet("user/{userId}/count")]
        public async Task<IActionResult> GetCartItemCount(int userId)
        {
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
                return Ok(new { count = 0 });

            var count = await _context.CartItems
                .Where(ci => ci.CartId == cart.CartId)
                .SumAsync(ci => (int?)ci.Quantity) ?? 0;

            return Ok(new { count });
        }


        private bool CartExists(int id)
        {
            return _context.Carts.Any(e => e.CartId == id);
        }
    }
}
