using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;
using System.IO;
using TrendMart_Api1.Services;

namespace TrendMart_Api1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfilesController : ControllerBase
    {
        private readonly Mydbcontext _context;
        private readonly EmailService _emailService;
        public UserProfilesController(Mydbcontext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/UserProfiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserProfile>>> GetUserProfiles()
        {
            return await _context.UserProfiles.ToListAsync();
        }

        // GET: api/UserProfiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserProfile>> GetUserProfile(int id)
        {
            var userProfile = await _context.UserProfiles.FindAsync(id);
            if (userProfile == null) return NotFound();
            return userProfile;
        }

        // GET: api/UserProfiles/user/7
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<UserProfile>> GetProfileByUserId(int userId)
        {
            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return NotFound();

            return profile;
        }

        // POST: api/UserProfiles
        [HttpPost]
        public async Task<IActionResult> PostUserProfile(
     [FromForm] UserProfile profile,
     IFormFile? profileImage = null)
        {
            if (profileImage != null)
            {
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/profileImages");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(profileImage.FileName)}";
                var filePath = Path.Combine(folder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await profileImage.CopyToAsync(stream);
                }

                profile.ProfilePictureUrl = $"http://localhost:5198/profileImages/{fileName}";
            }
            else
            {
                profile.ProfilePictureUrl ??= ""; // default empty if not provided
            }

            profile.UpdatedAt = DateTime.Now;

            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();

            return Ok(profile);
        }





        // PUT: api/UserProfiles/user/7
        [HttpPut("user/{userId}")]
        public async Task<IActionResult> UpdateOrCreateProfileByUserId(
    int userId,
    [FromForm] UserProfile profileData
)
        {
            if (profileData == null)
                return BadRequest("Profile data is missing.");

            // Handle file upload (existing code)
            if (Request.Form.Files.Count > 0)
            {
                var file = Request.Form.Files[0];
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/profileImages");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                profileData.ProfilePictureUrl = $"http://localhost:5198/profileImages/{fileName}";
            }

            var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profileData.UserId = userId;
                profileData.UpdatedAt = DateTime.Now;

                _context.UserProfiles.Add(profileData);
                await _context.SaveChangesAsync();

                // Send email to user
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    var subject = "Welcome to TrendMart!";
                    var body = $"<h3>Hello {user.FirstName},</h3><p>Your profile has been successfully created!</p>";
                    await _emailService.SendEmailAsync(user.Email, subject, body);
                }

                return Ok(profileData);
            }
            else
            {
                profile.DateOfBirth = profileData.DateOfBirth;
                profile.Gender = profileData.Gender;
                profile.Bio = profileData.Bio;
                profile.SocialLinks = profileData.SocialLinks;

                if (!string.IsNullOrEmpty(profileData.ProfilePictureUrl))
                    profile.ProfilePictureUrl = profileData.ProfilePictureUrl;

                profile.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Optional: send email on update
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    var subject = "Profile Updated - TrendMart";
                    var body = $"<h3>Hello {user.FirstName},</h3><p>Your profile has been successfully updated!</p>";
                    await _emailService.SendEmailAsync(user.Email, subject, body);
                }

                return Ok(profile);
            }
        }





        // DELETE: api/UserProfiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserProfile(int id)
        {
            var userProfile = await _context.UserProfiles.FindAsync(id);
            if (userProfile == null) return NotFound();

            _context.UserProfiles.Remove(userProfile);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserProfileExists(int id)
        {
            return _context.UserProfiles.Any(e => e.ProfileId == id);
        }
    }
}
