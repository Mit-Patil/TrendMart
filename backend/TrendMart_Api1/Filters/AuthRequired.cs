using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TrendMart_Api1.Filters
{
    public class AuthRequired : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var session = context.HttpContext.Session;

            var userId = session.GetInt32("UserID");
            var role = session.GetString("Role");

            if (userId == null)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "User not logged in"
                });
                return;
            }

            await next();
        }
    }
}
