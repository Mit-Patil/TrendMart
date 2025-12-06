using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class OrderItem
{
    public int OrderItemId { get; set; }

    public int? OrderId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public int? VariantId { get; set; }

    public virtual Order? Order { get; set; }

    public virtual ProductVariant? Variant { get; set; } = null!;
}
