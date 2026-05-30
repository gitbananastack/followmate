package com.followmate.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryResponse {

    private Long totalLeads;
    private Long openLeads;
    private Long wonLeads;
    private Long lostLeads;
    private Long pendingFollowups;
    private Long completedFollowups;
    private Long overdueFollowups;
    private Double conversionRate;
}
