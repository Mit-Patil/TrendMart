using System;
using System.Collections.Generic;

namespace TrendMart_Api1.Models;

public partial class Payment
{
    public int PaymentId { get; set; }

    public int? OrderId { get; set; }

    public string PaymentMethod { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTime? PaymentDate { get; set; }

    public string? Status { get; set; }

    public virtual Order? Order { get; set; }
}
