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
    public class WishlistsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public WishlistsController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/Wishlists
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Wishlist>>> GetWishlists()
        {
            return await _context.Wishlists.ToListAsync();
        }

        // GET: api/Wishlists/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Wishlist>> GetWishlist(int id)
        {
            var wishlist = await _context.Wishlists.FindAsync(id);

            if (wishlist == null)
            {
                return NotFound();
            }

            return wishlist;
        }

        // PUT: api/Wishlists/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWishlist(int id, Wishlist wishlist)
        {
            if (id != wishlist.WishlistId)
            {
                return BadRequest();
            }

            _context.Entry(wishlist).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WishlistExists(id))
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

        // POST: api/Wishlists
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Wishlist>> PostWishlist(Wishlist wishlist)
        {
            _context.Wishlists.Add(wishlist);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetWishlist", new { id = wishlist.WishlistId }, wishlist);
        }

        // DELETE: api/Wishlists/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWishlist(int id)
        {
            var wishlist = await _context.Wishlists.FindAsync(id);
            if (wishlist == null)
            {
                return NotFound();
            }

            _context.Wishlists.Remove(wishlist);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("status/{productId}")]
        public async Task<ActionResult<bool>> GetWishlistStatus(int productId)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null)
            {
                return Unauthorized(); // Should be blocked by filter, but safe to check
            }

            var exists = await _context.Wishlists
                .AnyAsync(w => w.UserId == userId.Value && w.ProductId == productId);

            return Ok(exists);
        }

        [HttpPost("toggle/{productId}")]
        // [AuthRequired] // Inherited from controller decoration
        public async Task<IActionResult> ToggleWishlist(int productId)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null)
            {
                return Unauthorized(); // Should be blocked by filter, but safe to check
            }

            var existingWishlistItem = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId.Value && w.ProductId == productId);

            if (existingWishlistItem == null)
            {
                // Add to wishlist
                var newWishlistItem = new Wishlist
                {
                    UserId = userId.Value, // Use session ID
                    ProductId = productId
                };
                _context.Wishlists.Add(newWishlistItem);
                await _context.SaveChangesAsync();

                return Created(nameof(ToggleWishlist), new { Status = "Added", WishlistId = newWishlistItem.WishlistId });
            }
            else
            {
                // Remove from wishlist
                _context.Wishlists.Remove(existingWishlistItem);
                await _context.SaveChangesAsync();

                return Ok(new { Status = "Removed" });
            }
        }

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyWishlist()
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null)
                return Unauthorized();

            var items = await _context.Wishlists
                .Where(w => w.UserId == userId.Value)
                .Include(w => w.Product)
                .ThenInclude(p => p.ProductImages)
                .Select(w => new
                {
                    productId = w.ProductId,
                    productName = w.Product.Name,
                    price = w.Product.Price,
                    brand = w.Product.Brand,
                    images = w.Product.ProductImages
                                .Select(pi => pi.ImageUrl)
                                .ToList()
                })
                .ToListAsync();

            return Ok(items);
        }


        private bool WishlistExists(int id)
        {
            return _context.Wishlists.Any(e => e.WishlistId == id);
        }
    }
}
