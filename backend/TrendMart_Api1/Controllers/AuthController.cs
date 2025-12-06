using Microsoft.AspNetCore.Mvc;
using TrendMart_Api1.Models;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly Mydbcontext _db;

    public AuthController(Mydbcontext db)
    {
        _db = db;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto model)
    {
        var user = _db.Users
            .FirstOrDefault(x => x.Email == model.Email && x.PasswordHash == model.Password);

        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        // store session
        HttpContext.Session.SetInt32("UserID", user.UserId);
        HttpContext.Session.SetString("Username", user.Email);
        HttpContext.Session.SetString("Role", user.Role);

        return Ok(new
        {
            message = "Login successful",
            userId = user.UserId,
            role = user.Role,
            username = user.Email
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = HttpContext.Session.GetInt32("UserID");
        if (userId == null)
            return Unauthorized(new { loggedIn = false });

        return Ok(new
        {
            loggedIn = true,
            userId = userId,
            username = HttpContext.Session.GetString("Username"),
            role = HttpContext.Session.GetString("Role") // include role
        });
    }
}

public class LoginDto
{
    public string Email { get; set; }
    public string Password { get; set; }
}
