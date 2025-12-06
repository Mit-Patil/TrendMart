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
    [AuthRequired]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductVariantsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public ProductVariantsController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/ProductVariants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductVariant>>> GetProductVariants()
        {
            return await _context.ProductVariants.ToListAsync();
        }

        // GET: api/ProductVariants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductVariant>> GetProductVariant(int id)
        {
            var productVariant = await _context.ProductVariants.FindAsync(id);

            if (productVariant == null)
            {
                return NotFound();
            }

            return productVariant;
        }

        // PUT: api/ProductVariants/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductVariant(int id, ProductVariant productVariant)
        {
            if (id != productVariant.VariantId)
            {
                return BadRequest();
            }

            // 1. Security Check (Role and Session)
            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            if (userId == null || role != "Vendor")
                return Unauthorized(new { message = "Only vendors can update variants" });

            // 2. Ownership Check
            var existingVariant = await _context.ProductVariants.FindAsync(id);
            if (existingVariant == null)
                return NotFound();

            var product = await _context.Products.FindAsync(existingVariant.ProductId);
            if (product == null || product.SellerId != userId)
                return Unauthorized("You can only update variants for your own products.");

            // Set the IDs and preserved fields from the existing entity
            productVariant.VariantId = id;
            productVariant.ProductId = existingVariant.ProductId;
            productVariant.CreatedAt = existingVariant.CreatedAt; // Preserve original creation date

            // Use CurrentValues to update the tracked entity safely
            _context.Entry(existingVariant).CurrentValues.SetValues(productVariant);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductVariantExists(id))
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

        // POST: api/ProductVariants
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProductVariant>> PostProductVariant(ProductVariant productVariant)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            var ProductId = HttpContext.Session.GetInt32("ProductId");

            Console.WriteLine("SESSION CHECK => UserID: " + userId + " Role: " + role + " ProductID: " + ProductId);


            if (userId == null || role != "Vendor" || ProductId == null)
                return Unauthorized(new { message = "Only vendors can create products" });

            var product = await _context.Products.FindAsync(ProductId);
            if (product == null)
                return NotFound("Product not found.");
            if (product.SellerId != userId)
                return Unauthorized("You can add variants only for your own products.");

            productVariant.ProductId = ProductId.Value;
            productVariant.CreatedAt = DateTime.Now;

            
            try
            {
                _context.ProductVariants.Add(productVariant);
                await _context.SaveChangesAsync();

                /*HttpContext.Session.SetInt32("UserID", userId.Value);
                HttpContext.Session.SetString("Role", role);
                HttpContext.Session.SetInt32("ProductId", product.ProductId);*/

                return Ok(new
                {
                    success = true,
                    message = "Product Variant created successfully",
                    productVariant = new
                    {
                        VariantId = productVariant.VariantId,
                        productId = productVariant.ProductId,
                        gender = productVariant.Gender,
                        size = productVariant.Size,
                        color = productVariant.Color,
                        stock = productVariant.Stock
                    }
                });
            }
            catch(Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }



        }

        // DELETE: api/ProductVariants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductVariant(int id)
        {
            // 1. Security Check (Role and Session)
            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            if (userId == null || role != "Vendor")
                return Unauthorized(new { message = "Only vendors can delete variants" }); // ADDED SECURITY

            var productVariant = await _context.ProductVariants.FindAsync(id);
            if (productVariant == null)
            {
                return NotFound();
            }

            // 2. Ownership Check
            var product = await _context.Products.FindAsync(productVariant.ProductId);
            if (product == null || product.SellerId != userId)
                return Unauthorized("You can only delete variants for your own products."); // ADDED OWNERSHIP CHECK


            _context.ProductVariants.Remove(productVariant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/ProductVariants/product/5
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<ProductVariant>>> GetVariantsByProductId(int productId)
        {
            var variants = await _context.ProductVariants
                .Where(v => v.ProductId == productId)
                .ToListAsync();

            return Ok(variants); // always 200 OK
        }



        private bool ProductVariantExists(int id)
        {
            return _context.ProductVariants.Any(e => e.VariantId == id);
        }
    }
}
