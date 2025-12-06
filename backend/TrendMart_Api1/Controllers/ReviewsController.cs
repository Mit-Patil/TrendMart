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
    public class ReviewsController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public ReviewsController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/Reviews
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            return await _context.Reviews.ToListAsync();
        }

        // GET: api/Reviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Review>> GetReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null)
            {
                return NotFound();
            }

            return review;
        }

        // PUT: api/Reviews/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        // PUT: api/Reviews/5
        [HttpPut("{id}")]
        [AuthRequired] // Enforce login
        public async Task<IActionResult> PutReview(int id, Review review)
        {
            if (id != review.ReviewId)
            {
                return BadRequest();
            }

            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null) { return Unauthorized(); }

            // 1. Check Ownership: Retrieve the existing review data (without tracking)
            var existingReview = await _context.Reviews.AsNoTracking().FirstOrDefaultAsync(r => r.ReviewId == id);

            if (existingReview == null) return NotFound();

            if (existingReview.UserId != userId.Value)
            {
                return StatusCode(403, new { message = "You can only update your own reviews." });
            }

            // Preserve the original date and ensure correct UserID is used
            review.UserId = userId.Value;
            review.ReviewDate = existingReview.ReviewDate;

            _context.Entry(review).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReviewExists(id)) { return NotFound(); }
                else { throw; }
            }

            return NoContent();
        }

        // POST: api/Reviews
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [AuthRequired]
        public async Task<ActionResult<Review>> PostReview(Review review)
        {
            var userId = HttpContext.Session.GetInt32("UserID");

            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            review.UserId = userId.Value; // Set the UserID from session
            review.ReviewDate = DateTime.Now;

            bool alreadyReviewed = await _context.Reviews.AnyAsync(r =>
                r.ProductId == review.ProductId && r.UserId == userId.Value);

            if (alreadyReviewed)
            {
                return Conflict(new { message = "You have already submitted a review for this product." });
            }

            if (review.Rating < 1 || review.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5." });
            }

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetReview", new { id = review.ReviewId }, review);
        }


        // DELETE: api/Reviews/5
        // DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        [AuthRequired] // Enforce login
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null) { return Unauthorized(); }

            var review = await _context.Reviews.FindAsync(id);

            if (review == null)
            {
                return NotFound();
            }

            if (review.UserId != userId.Value)
            {
                return StatusCode(403, new { message = "You can only delete your own reviews." });
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // GET: api/Reviews/by-product/5
        [HttpGet("by-product/{productId}")]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviewsByProductId(int productId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User) // <--- THIS LINE IS CRUCIAL
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.ReviewDate)
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/Reviews/my-reviews
        [HttpGet("my-reviews")]
        [AuthRequired] // Requires user to be logged in
        public async Task<ActionResult<IEnumerable<Review>>> GetMyReviews()
        {
            // Retrieve UserID from session (using GetInt32 since UserID is int in DB)
            var userId = HttpContext.Session.GetInt32("UserID");

            if (userId == null)
            {
                // Should be caught by [AuthRequired], but this is a safeguard
                return Unauthorized(new { message = "Authentication required." });
            }

            var reviews = await _context.Reviews
                .Where(r => r.UserId == userId.Value)
                .OrderByDescending(r => r.ReviewDate)
                .ToListAsync();

            return Ok(reviews);
        }

        private bool ReviewExists(int id)
        {
            return _context.Reviews.Any(e => e.ReviewId == id);
        }
    }
}
