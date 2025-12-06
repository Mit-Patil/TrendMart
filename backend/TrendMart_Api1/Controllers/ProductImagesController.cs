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
    public class ProductImagesController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public ProductImagesController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/ProductImages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductImage>>> GetProductImages()
        {
            return await _context.ProductImages.ToListAsync();
        }

        // GET: api/ProductImages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductImage>> GetProductImage(int id)
        {
            var productImage = await _context.ProductImages.FindAsync(id);

            if (productImage == null)
            {
                return NotFound();
            }

            return productImage;
        }

        // PUT: api/ProductImages/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        // ProductImagesController.cs

        // ... (Around line 47 in your original code)

        // PUT: api/ProductImages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductImage(int id, ProductImage productImage)
        {
            if (id != productImage.ImageId)
            {
                return BadRequest();
            }

            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            if (userId == null || role != "Vendor")
                return Unauthorized(new { message = "Only vendors can update images" }); // ADDED SECURITY

            var existingImage = await _context.ProductImages.FindAsync(id);
            if (existingImage == null)
                return NotFound();

            var product = await _context.Products.FindAsync(existingImage.ProductId);
            if (product == null || product.SellerId != userId)
                return Unauthorized("You can only update images for your own products."); // ADDED OWNERSHIP CHECK

            productImage.ImageId = id;

            productImage.ProductId = existingImage.ProductId;

            _context.Entry(existingImage).CurrentValues.SetValues(productImage); 

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductImageExists(id))
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

        // POST: api/ProductImages
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<IActionResult> PostProductImage([FromForm] IFormFile ImageFile)
        {

            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            var ProductId = HttpContext.Session.GetInt32("ProductId");

            if (userId == null || role != "Vendor" || ProductId == null)
                return Unauthorized(new { message = "Only vendors can create products (or ProductId is missing in session)." });

            if (ImageFile == null || ImageFile.Length == 0)
                return BadRequest("No image file uploaded.");

            var product = await _context.Products.FindAsync(ProductId);
            if (product == null)
                return NotFound("Product not found.");
            if (product.SellerId != userId)
                return Unauthorized("You can upload images only for your own products.");

            // Create folder if not exists
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(ImageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await ImageFile.CopyToAsync(stream);

            var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/products/{fileName}";

            var productImage = new ProductImage
            {
                ProductId = ProductId,
                ImageUrl = imageUrl
            };

            _context.ProductImages.Add(productImage);
            await _context.SaveChangesAsync();

            /*HttpContext.Session.SetInt32("UserID", userId.Value);
            HttpContext.Session.SetString("Role", role);
            HttpContext.Session.SetInt32("ProductId", product.ProductId);*/

            return Ok(new { Message = "Image uploaded successfully", ImageUrl = imageUrl });
        }


        // DELETE: api/ProductImages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductImage(int id)
        {
            // 1. Security Check (Role and Session)
            var userId = HttpContext.Session.GetInt32("UserID");
            var role = HttpContext.Session.GetString("Role");
            if (userId == null || role != "Vendor")
                return Unauthorized(new { message = "Only vendors can delete images" }); // ADDED SECURITY

            var productImage = await _context.ProductImages.FindAsync(id);
            if (productImage == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FindAsync(productImage.ProductId);
            if (product == null || product.SellerId != userId)
                return Unauthorized("You can only delete images for your own products."); // ADDED OWNERSHIP CHECK


            _context.ProductImages.Remove(productImage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/ProductImages/product/5
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<ProductImage>>> GetImagesByProductId(int productId)
        {
            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ToListAsync();

            if (images == null || !images.Any())
            {
                return NotFound("No images found for this product.");
            }

            return Ok(images);
        }


        private bool ProductImageExists(int id)
        {
            return _context.ProductImages.Any(e => e.ImageId == id);
        }
    }
}
