using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class UserAddress
{
    public int AddressId { get; set; }

    public int? UserId { get; set; }

    public string? FullName { get; set; }

    public string? Phone { get; set; }

    public string? AddressLine1 { get; set; }

    public string? AddressLine2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

    public bool? IsDefault { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual User? User { get; set; }
}
