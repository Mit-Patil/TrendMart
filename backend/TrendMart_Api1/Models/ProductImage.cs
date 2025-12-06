using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class ProductImage
{
    public int ImageId { get; set; }

    public int? ProductId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public virtual Product? Product { get; set; }
}
