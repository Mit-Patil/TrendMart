using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrendMart_Api1.Models;

public partial class CartItem
{
    public int CartItemId { get; set; }

    public int CartId { get; set; }

    public int Quantity { get; set; }

    public DateTime? AddedAt { get; set; }

    public int VariantId { get; set; }

    public virtual Cart Cart { get; set; } = null!;

    public virtual ProductVariant Variant { get; set; } = null!;

    [NotMapped]
    public decimal Price { get; set; }
}
