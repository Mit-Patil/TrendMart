using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class UserProfile
{
    public int ProfileId { get; set; }

    public int? UserId { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Bio { get; set; }

    public string? SocialLinks { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}
