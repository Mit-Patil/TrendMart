using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;
using TrendMart_Api1.Services;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        private readonly EmailService _emailService;

        public PaymentsController(Mydbcontext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }


        // GET: api/Payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            return await _context.Payments.ToListAsync();
        }

        // GET: api/Payments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
            {
                return NotFound();
            }

            return payment;
        }

        // PUT: api/Payments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPayment(int id, Payment payment)
        {
            if (id != payment.PaymentId)
            {
                return BadRequest();
            }

            _context.Entry(payment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
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

        // POST: api/Payments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(Payment payment)
        {
            _context.Payments.Add(payment);

            // Update Order payment status
            var order = await _context.Orders
                .Include(o => o.User) // Include user to get email
                .FirstOrDefaultAsync(o => o.OrderId == payment.OrderId);

            if (order != null)
            {
                // Update payment status
                if (payment.Status == "Success")
                {
                    order.PaymentStatus = "Paid";
                }
                else if (payment.Status == "Pending" && payment.PaymentMethod == "COD")
                {
                    order.PaymentStatus = "COD";
                }

                // Save order update
                _context.Entry(order).State = EntityState.Modified;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Error saving payment/order: {ex.Message}");
                return StatusCode(500, "An error occurred while saving payment.");
            }

            // Send email to user
            if (order?.User != null)
            {
                string subject = $"Order #{order.OrderId} Confirmation - TrendMart";
                string body = $@"
            <h3>Thank you for your purchase, {order.User.FirstName}!</h3>
            <p>Your order <strong>#{order.OrderId}</strong> has been successfully placed.</p>
            <p>Total Amount: ₹{payment.Amount}</p>
            <p>Payment Status: {order.PaymentStatus}</p>
            <p>You can view your order details in your account.</p>
            <br>
            <p>— TrendMart Team</p>
        ";

                try
                {
                    await _emailService.SendEmailAsync(order.User.Email, subject, body);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Email sending failed: {ex.Message}");
                }
            }

            return CreatedAtAction("GetPayment", new { id = payment.PaymentId }, payment);
        }




        // DELETE: api/Payments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymentExists(int id)
        {
            return _context.Payments.Any(e => e.PaymentId == id);
        }
    }
}
