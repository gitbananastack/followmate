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
public class FollowupReportResponse {

    private Long pending;
    private Long completed;
    private Long overdue;
    private Long today;
}
