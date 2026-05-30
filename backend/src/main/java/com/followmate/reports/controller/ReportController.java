package com.followmate.reports.controller;

import com.followmate.common.ApiResponse;
import com.followmate.reports.dto.ConversionReportResponse;
import com.followmate.reports.dto.FollowupReportResponse;
import com.followmate.reports.dto.LeadAgingResponse;
import com.followmate.reports.dto.LeadFunnelResponse;
import com.followmate.reports.dto.LeadSourceResponse;
import com.followmate.reports.dto.ReportSummaryResponse;
import com.followmate.reports.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success("Report summary fetched successfully",
                reportService.getSummary()));
    }

    @GetMapping("/lead-funnel")
    public ResponseEntity<ApiResponse<List<LeadFunnelResponse>>> getLeadFunnel() {
        return ResponseEntity.ok(ApiResponse.success("Lead funnel fetched successfully",
                reportService.getLeadFunnel()));
    }

    @GetMapping("/followups")
    public ResponseEntity<ApiResponse<FollowupReportResponse>> getFollowups() {
        return ResponseEntity.ok(ApiResponse.success("Followup report fetched successfully",
                reportService.getFollowups()));
    }

    @GetMapping("/lead-sources")
    public ResponseEntity<ApiResponse<List<LeadSourceResponse>>> getLeadSources() {
        return ResponseEntity.ok(ApiResponse.success("Lead sources fetched successfully",
                reportService.getLeadSources()));
    }

    @GetMapping("/lead-aging")
    public ResponseEntity<ApiResponse<List<LeadAgingResponse>>> getLeadAging() {
        return ResponseEntity.ok(ApiResponse.success("Lead aging fetched successfully",
                reportService.getLeadAging()));
    }

    @GetMapping("/conversion")
    public ResponseEntity<ApiResponse<ConversionReportResponse>> getConversion() {
        return ResponseEntity.ok(ApiResponse.success("Conversion report fetched successfully",
                reportService.getConversion()));
    }
}
