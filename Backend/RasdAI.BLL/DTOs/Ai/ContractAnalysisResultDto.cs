using System;
using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Ai;

public class ContractAnalysisResultDto
{
    public int Id { get; set; }
    public string Summary { get; set; } = string.Empty;
    public List<string> Parties { get; set; } = new();
    public string ExpiryDate { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public List<ContractRiskDto> Risks { get; set; } = new();
    public bool IsDemo { get; set; }
}

public class ContractRiskDto
{
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Blue"; // e.g. "Red" (High), "Orange" (Medium), "Blue" (Low/Info)
}
