using System.Collections.Generic;

namespace RasdAI.BLL.DTOs.Ai;

public class InterviewAnalysisResultDto
{
    public string Transcript { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string JobRole { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Weaknesses { get; set; } = new();
    public string Recommendation { get; set; } = "Consider"; // Accept | Consider | Reject
    public string RecommendationExplanation { get; set; } = string.Empty;
    public int OverallScore { get; set; } = 70;
    public bool IsDemo { get; set; }
}
