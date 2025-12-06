using Microsoft.EntityFrameworkCore;
using TrendMart_Api1.Models;
using Microsoft.AspNetCore.Http;
using TrendMart_Api1.Services; // Needed for SameSiteMode and CookieSecurePolicy

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();
// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DB Context
builder.Services.AddDbContext<Mydbcontext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("userstring"))
);

// CORS for React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // ⭐️ Your React URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;

    // ⭐️ REQUIRED FOR CROSS-ORIGIN/CORS
    options.Cookie.SameSite = SameSiteMode.None;

    // ⭐️ THE FIX: MUST BE 'Always' when SameSite=None is used, 
    // especially since your API appears to be running on HTTPS (https://localhost:5198).
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.IdleTimeout = TimeSpan.FromHours(12);
});



builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddTransient<EmailService>();



builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowReactApp"); // Must come before session/auth

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.Run();