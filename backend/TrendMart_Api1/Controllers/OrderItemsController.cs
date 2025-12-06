using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;
using System.Linq;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderItemsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public OrderItemsController(Mydbcontext context)
        {
            _context = context;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddItems([FromBody] List<OrderItem> items)
        {
            if (items == null || items.Count == 0)
                return BadRequest("No items provided.");

            // Ensure OrderId exists and is same for all items
            if (!items.First().OrderId.HasValue)
                return BadRequest("OrderId is missing.");

            int orderId = items.First().OrderId.Value;

            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
                return BadRequest("Order does not exist.");

            decimal total = 0;

            foreach (var item in items)
            {
                var variant = await _context.ProductVariants
                    .Include(v => v.Product)
                    .FirstOrDefaultAsync(v => v.VariantId == item.VariantId);

                if (variant == null)
                    return BadRequest($"Variant {item.VariantId} not found");

                if (variant.Stock < item.Quantity)
                    return BadRequest($"Insufficient stock for {variant.Product.Name}");

                // Deduct stock
                variant.Stock -= item.Quantity;

                // Price
                item.Price = variant.Product.Price;

                total += item.Price * item.Quantity;

                _context.OrderItems.Add(item);
            }

            // Add total to order
            order.TotalAmount += total;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Items added successfully", totalAdded = total });
        }
    }
}
