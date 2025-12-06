using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserAddressesController : ControllerBase
    {
        private readonly Mydbcontext _context;

        public UserAddressesController(Mydbcontext context)
        {
            _context = context;
        }

        // ---------------------------------------------------------
        // GET ALL ADDRESSES
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserAddress>>> GetUserAddresses()
        {
            return await _context.UserAddresses
                .AsNoTracking()
                .ToListAsync();
        }

        // ---------------------------------------------------------
        // GET ADDRESS BY ID
        // ---------------------------------------------------------
        [HttpGet("{id}")]
        public async Task<ActionResult<UserAddress>> GetUserAddress(int id)
        {
            var userAddress = await _context.UserAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AddressId == id);

            if (userAddress == null)
                return NotFound();

            return userAddress;
        }

        // ---------------------------------------------------------
        // ADD NEW ADDRESS
        // ---------------------------------------------------------
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<UserAddress>> PostUserAddress(UserAddress userAddress)
        {
            // Remove navigation to avoid circular loops
            userAddress.User = null;
            userAddress.Orders = null;

            _context.UserAddresses.Add(userAddress);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUserAddress), new { id = userAddress.AddressId }, userAddress);
        }

        // ---------------------------------------------------------
        // UPDATE EXISTING ADDRESS
        // ---------------------------------------------------------
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUserAddress(int id, UserAddress userAddress)
        {
            if (id != userAddress.AddressId)
                return BadRequest("ID mismatch");

            // Remove navigation to prevent recursion
            userAddress.User = null;
            userAddress.Orders = null;

            _context.Entry(userAddress).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserAddressExists(id))
                    return NotFound();

                throw;
            }

            return NoContent();
        }

        // ---------------------------------------------------------
        // DELETE ADDRESS
        // ---------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserAddress(int id)
        {
            var userAddress = await _context.UserAddresses.FindAsync(id);
            if (userAddress == null)
                return NotFound();

            _context.UserAddresses.Remove(userAddress);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ---------------------------------------------------------
        // GET ALL ADDRESSES FOR A USER
        // ---------------------------------------------------------
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetAddressesByUserId(int userId)
        {
            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == userId)
                .AsNoTracking()
                .ToListAsync();

            return Ok(addresses);
        }

        // ---------------------------------------------------------
        // CREATE OR UPDATE MULTIPLE ADDRESSES FOR USER
        // ---------------------------------------------------------
        [HttpPut("user/{userId}")]
        public async Task<IActionResult> UpdateOrCreateAddressesByUserId(
            int userId,
            List<UserAddress> addresses)
        {
            if (addresses == null || addresses.Count == 0)
                return BadRequest("No addresses provided.");

            foreach (var addr in addresses)
            {
                addr.User = null;
                addr.Orders = null;

                if (addr.AddressId > 0)
                {
                    // Update existing
                    var existing = await _context.UserAddresses
                        .FirstOrDefaultAsync(a => a.AddressId == addr.AddressId);

                    if (existing != null)
                    {
                        existing.FullName = addr.FullName;
                        existing.Phone = addr.Phone;
                        existing.AddressLine1 = addr.AddressLine1;
                        existing.AddressLine2 = addr.AddressLine2;
                        existing.City = addr.City;
                        existing.State = addr.State;
                        existing.PostalCode = addr.PostalCode;
                        existing.Country = addr.Country;
                        existing.IsDefault = addr.IsDefault;

                        continue;
                    }
                }

                // Create new
                addr.UserId = userId;
                _context.UserAddresses.Add(addr);
            }

            await _context.SaveChangesAsync();
            return Ok(addresses);
        }

        private bool UserAddressExists(int id)
        {
            return _context.UserAddresses.Any(e => e.AddressId == id);
        }
    }
}
