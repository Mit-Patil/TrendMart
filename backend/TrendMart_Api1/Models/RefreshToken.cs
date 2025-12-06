using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class RefreshToken
{
    public int TokenId { get; set; }

    public int? UserId { get; set; }

    public string? Token { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public virtual User? User { get; set; }
}
