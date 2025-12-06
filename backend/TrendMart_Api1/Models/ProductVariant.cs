using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TrendMart_Api1.Models;

public partial class ProductVariant
{
    public int? VariantId { get; set; }

    public int ProductId { get; set; }

    public string Gender { get; set; } = null!;

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public int? Stock { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [JsonIgnore]
    public virtual Product? Product { get; set; } = null!;
}
