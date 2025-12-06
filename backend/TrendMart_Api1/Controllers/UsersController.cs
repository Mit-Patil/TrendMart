using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public UsersController(Mydbcontext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // PUT: api/Users/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.UserId)
            {
                return BadRequest();
            }

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // POST: api/Users
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            user.CreatedAt = DateTime.UtcNow;
            user.LastLogin = DateTime.UtcNow;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            HttpContext.Session.SetInt32("userId", user.UserId);

            return CreatedAtAction("GetUser", new { id = user.UserId }, user);
        }


        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("session")]
        public IActionResult GetUserIdFromSession()
        {
            var userId = HttpContext.Session.GetInt32("UserID");
            if (userId == null)
                return NotFound(new { message = "No User Found in session" });

            return Ok(new { userId });
        }



        [HttpDelete("Complete/{id}")]
        public async Task<IActionResult> DeleteUserCompletely(int id)
        {
            // Include related entities
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .Include(u => u.UserAddresses)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound("User not found");

            try
            {
                // Remove profile if it exists
                if (user.UserProfile != null)
                    _context.UserProfiles.Remove(user.UserProfile);

                // Remove addresses if any exist
                if (user.UserAddresses != null && user.UserAddresses.Any())
                    _context.UserAddresses.RemoveRange(user.UserAddresses);

                // Remove user
                _context.Users.Remove(user);

                // Save changes
                await _context.SaveChangesAsync();

                return NoContent(); // 204 success
            }
            catch (DbUpdateException dbEx)
            {
                // Log exception
                Console.WriteLine("DbUpdateException: " + dbEx.Message);
                return StatusCode(500, "Database error while deleting user");
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return StatusCode(500, "Failed to delete user completely");
            }
        }


        // GET: api/Users/by-email?email=test@gmail.com
        [HttpGet("by-email")]
        public IActionResult GetUserByEmail([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email)) return BadRequest("Email required");

            var user = _context.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return NotFound();
            return Ok(user);
        }


        // PUT: api/Users/upgradeToVendor
        [HttpPut("upgradeToVendor")]
        public async Task<IActionResult> UpgradeToVendor()
        {
            var userId = HttpContext.Session.GetInt32("UserID");

            if (userId == null)
                return Unauthorized(new { success = false, message = "User not logged in" });

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (user.Role == "Vendor")
                return BadRequest(new { success = false, message = "You are already a Vendor" });

            // Update DB role
            user.Role = "Vendor";
            await _context.SaveChangesAsync();

            // 🔥 Update SESSION role too
            HttpContext.Session.SetString("Role", "Vendor");

            return Ok(new { success = true, message = "Role upgraded successfully" });
        }






        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }
    }
}
