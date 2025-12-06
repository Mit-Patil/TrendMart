using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Filters;
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AuthRequired]
    public class OrdersController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public OrdersController(Mydbcontext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            return HttpContext.Session.GetInt32("UserID");
        }

        // ----------------------------------------------------
        // STEP 1: Create Order only
        // ----------------------------------------------------
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] Dictionary<string, int> data)
        {
            if (!data.TryGetValue("addressId", out int addressId))
                return BadRequest("AddressId is required.");

            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized("Not logged in");

            var address = await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.AddressId == addressId && a.UserId == userId.Value);

            if (address == null) return BadRequest("Invalid Address");

            var order = new Order
            {
                UserId = userId.Value,
                OrderDate = DateTime.UtcNow,
                Status = "Pending",
                PaymentStatus = "Unpaid",
                AddressId = addressId,
                TotalAmount = 0
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order created successfully",
                orderId = order.OrderId
            });
        }

        // ----------------------------------------------------
        // GET MY ORDERS
        // ----------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            var orders = await _context.Orders
                .Where(o => o.UserId == userId.Value)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Variant)
                        .ThenInclude(v => v.Product)
                .Include(o => o.Address)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        // ----------------------------------------------------
        // GET SINGLE ORDER WITH ITEMS
        // ----------------------------------------------------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (!userId.HasValue) return Unauthorized();

            var order = await _context.Orders
                .Where(o => o.OrderId == id && o.UserId == userId.Value)
                .Include(o => o.OrderItems)         // Include order items
                    .ThenInclude(oi => oi.Variant) // Include variant
                        .ThenInclude(v => v.Product) // Include product
                .Include(o => o.Address)           // Include address
                .FirstOrDefaultAsync();

            if (order == null) return NotFound("Order not found");

            return Ok(order);
        }

    }
}
