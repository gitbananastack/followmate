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
public class ConversionReportResponse {

    private Long totalLeads;
    private Long wonLeads;
    private Long lostLeads;
    private Long openLeads;
    private Double conversionRate;
}
