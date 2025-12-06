using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Filters;
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public ProductsController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/Products
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            // 🎯 FIX 1: EAGER LOAD IMAGES for the customer product list
            return await _context.Products
                .Include(p => p.ProductImages)
                .ToListAsync();
        }

        // GET: api/Products/5
        // ProductsController.cs

        // GET: api/Products/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
                return NotFound();


            return product;
        }


        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [AuthRequired]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.ProductId)
            {
                return BadRequest();
            }

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
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

        // POST: api/Products
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [AuthRequired]
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");

            if (userId == null || role != "Vendor")
                return Unauthorized(new { message = "Only vendors can create products" });

            product.SellerId = userId.Value;
            product.CreatedAt = DateTime.Now;

            try
            {
                _context.Products.Add(product);
                await _context.SaveChangesAsync();


                /*HttpContext.Session.SetInt32("UserID", userId.Value);
                HttpContext.Session.SetString("Role", role*/


                HttpContext.Session.SetInt32("ProductId",product.ProductId);

                return Ok(new
                {
                    success = true,
                    message = "Product created successfully",
                    product = new
                    {
                        productId = product.ProductId,
                        name = product.Name,
                        description = product.Description,
                        price = product.Price,
                        categoryId = product.CategoryId,
                        brand = product.Brand
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // DELETE: api/Products/5
        [AuthRequired]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<Product>>> GetProductByCategoryId(int categoryId)
        {
            var product = await _context.Products
                .Where(a => a.CategoryId == categoryId)
                .ToListAsync();

            return product; // returns empty list if none found
        }

        [HttpGet("session")]
        public IActionResult GetProductIdFromSession()
        {
            var productId = HttpContext.Session.GetInt32("ProductId");

            if (productId == null)
                return NotFound(new { message = "No product selected in session" });

            return Ok(new { productId });
        }

        // GET: api/Products/vendor
        [HttpGet("vendor/{sellerId}")]
        public async Task<ActionResult<IEnumerable<Product>>> GetVendorProducts(int sellerId)
        {
            var products = await _context.Products
                .Where(p => p.SellerId == sellerId)
                .Include(p => p.ProductImages) // include images
                .ToListAsync();

            return Ok(products);
        }


        // ProductsController.cs

        // ... (inside the ProductsController class)

        [HttpPost("session/set/{productId}")] // <-- The key attribute
        public async Task<IActionResult> SetProductIdInSession(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                return NotFound();

            // Ensure the user is a vendor and owns the product
            var role = HttpContext.Session.GetString("Role");
            var userId = HttpContext.Session.GetInt32("UserID");

            if (role != "Vendor" || product.SellerId != userId)
                return Unauthorized(new { message = "You can only set session for your own products." });

            HttpContext.Session.SetInt32("ProductId", productId);

            return Ok(new { message = $"ProductId {productId} set in session.", success = true });
        }

        [HttpGet("filtered")]
        [AllowAnonymous]
        public async Task<ActionResult> GetFilteredProducts(
            [FromQuery] int? categoryId = null,
            [FromQuery] string? gender = null,
            [FromQuery] string? sizes = null,
            [FromQuery] string? colors = null,
            [FromQuery] string? search = null,
            [FromQuery] decimal minPrice = 0,
            [FromQuery] decimal maxPrice = 10000,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            try
            {
                // Start with base query
                var query = _context.Products
                    .Include(p => p.ProductImages)
                    .Include(p => p.ProductVariants)
                    .AsQueryable();

                // Apply filters
                if (categoryId.HasValue)
                {
                    query = query.Where(p => p.CategoryId == categoryId.Value);
                }

                if (!string.IsNullOrEmpty(gender))
                {
                    query = query.Where(p => p.ProductVariants.Any(v => v.Gender == gender));
                }

                if (!string.IsNullOrEmpty(sizes))
                {
                    var sizeList = sizes.Split(',').Select(s => s.Trim()).ToList();
                    query = query.Where(p => p.ProductVariants.Any(v => sizeList.Contains(v.Size)));
                }

                if (!string.IsNullOrEmpty(colors))
                {
                    var colorList = colors.Split(',').Select(c => c.Trim()).ToList();
                    query = query.Where(p => p.ProductVariants.Any(v => colorList.Contains(v.Color)));
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(p =>
                        p.Name.Contains(search) ||
                        p.Description.Contains(search) ||
                        p.Brand.Contains(search));
                }

                // Price filter
                query = query.Where(p => p.Price >= minPrice && p.Price <= maxPrice);

                // Get total count for pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                // Apply pagination
                var products = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Return response with pagination info
                return Ok(new
                {
                    products = products.Select(p => new
                    {
                        productId = p.ProductId,
                        name = p.Name,
                        description = p.Description,
                        price = p.Price,
                        brand = p.Brand,
                        categoryId = p.CategoryId,
                        productImages = p.ProductImages?.Select(pi => new { imageUrl = pi.ImageUrl }),
                        productVariants = p.ProductVariants?.Select(pv => new
                        {
                            variantId = pv.VariantId,
                            size = pv.Size,
                            color = pv.Color,
                            gender = pv.Gender,
                            stock = pv.Stock
                        })
                    }),
                    totalCount,
                    totalPages,
                    currentPage = page,
                    pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error filtering products", error = ex.Message });
            }
        }
        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductId == id);
        }
    }
}
