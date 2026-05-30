package com.followmate.reports.service;

import com.followmate.auth.entity.User;
import com.followmate.followup.entity.Followup;
import com.followmate.followup.repository.FollowupRepository;
import com.followmate.lead.entity.Lead;
import com.followmate.lead.entity.LeadDynamicField;
import com.followmate.lead.repository.LeadDynamicFieldRepository;
import com.followmate.lead.repository.LeadRepository;
import com.followmate.reports.dto.ConversionReportResponse;
import com.followmate.reports.dto.FollowupReportResponse;
import com.followmate.reports.dto.LeadAgingResponse;
import com.followmate.reports.dto.LeadFunnelResponse;
import com.followmate.reports.dto.LeadSourceResponse;
import com.followmate.reports.dto.ReportSummaryResponse;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.security.RoleAuthorizationService;
import com.followmate.setup.entity.OrganizationPipelineStage;
import com.followmate.setup.repository.OrganizationPipelineStageRepository;
import com.followmate.subscription.service.FeatureAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final String REPORTS_FEATURE = "REPORTS";
    private static final String PENDING_STATUS = "PENDING";
    private static final String COMPLETED_STATUS = "COMPLETED";
    private static final String LOST_STAGE = "LOST";
    private static final Set<String> WON_STAGES = Set.of(
            "WON",
            "SOLD",
            "ADMISSION_DONE",
            "BOOKED",
            "COMPLETED",
            "CONFIRMED"
    );

    private final LeadRepository leadRepository;
    private final LeadDynamicFieldRepository leadDynamicFieldRepository;
    private final FollowupRepository followupRepository;
    private final OrganizationPipelineStageRepository organizationPipelineStageRepository;
    private final RoleAuthorizationService roleAuthorizationService;
    private final AuthenticatedUserService authenticatedUserService;
    private final FeatureAccessService featureAccessService;

    public ReportSummaryResponse getSummary() {
        ReportData reportData = loadReportData();
        ConversionCounts conversionCounts = calculateConversionCounts(reportData.leads());
        FollowupCounts followupCounts = calculateFollowupCounts(reportData.followups());

        return ReportSummaryResponse.builder()
                .totalLeads(conversionCounts.totalLeads())
                .openLeads(conversionCounts.openLeads())
                .wonLeads(conversionCounts.wonLeads())
                .lostLeads(conversionCounts.lostLeads())
                .pendingFollowups(followupCounts.pending())
                .completedFollowups(followupCounts.completed())
                .overdueFollowups(followupCounts.overdue())
                .conversionRate(conversionCounts.conversionRate())
                .build();
    }

    public List<LeadFunnelResponse> getLeadFunnel() {
        ReportData reportData = loadReportData();
        Map<String, Long> countByStage = reportData.leads()
                .stream()
                .collect(Collectors.groupingBy(lead -> normalizeStage(lead.getCurrentStage()), Collectors.counting()));

        return organizationPipelineStageRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(reportData.organizationId())
                .stream()
                .map(OrganizationPipelineStage::getStageName)
                .map(stageName -> LeadFunnelResponse.builder()
                        .stageName(stageName)
                        .count(countByStage.getOrDefault(normalizeStage(stageName), 0L))
                        .build())
                .toList();
    }

    public FollowupReportResponse getFollowups() {
        return toFollowupReportResponse(calculateFollowupCounts(loadReportData().followups()));
    }

    public List<LeadSourceResponse> getLeadSources() {
        ReportData reportData = loadReportData();
        if (reportData.leads().isEmpty()) {
            return List.of();
        }

        Map<Long, String> sourceByLeadId = loadSourceByLeadId(reportData.leads());
        Map<String, Long> counts = reportData.leads()
                .stream()
                .map(lead -> sourceByLeadId.getOrDefault(lead.getId(), "UNKNOWN"))
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));

        return counts.entrySet()
                .stream()
                .map(entry -> LeadSourceResponse.builder()
                        .source(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    public List<LeadAgingResponse> getLeadAging() {
        List<Lead> openLeads = loadReportData().leads()
                .stream()
                .filter(lead -> !isWonLead(lead) && !isLostLead(lead))
                .toList();
        LocalDateTime now = LocalDateTime.now();

        Map<String, Long> buckets = new LinkedHashMap<>();
        buckets.put("0-7 days", 0L);
        buckets.put("8-15 days", 0L);
        buckets.put("16-30 days", 0L);
        buckets.put("30+ days", 0L);

        for (Lead lead : openLeads) {
            String bucket = getAgingBucket(Duration.between(lead.getCreatedAt(), now).toDays());
            buckets.put(bucket, buckets.get(bucket) + 1);
        }

        return buckets.entrySet()
                .stream()
                .map(entry -> LeadAgingResponse.builder()
                        .bucket(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    public ConversionReportResponse getConversion() {
        ConversionCounts conversionCounts = calculateConversionCounts(loadReportData().leads());

        return ConversionReportResponse.builder()
                .totalLeads(conversionCounts.totalLeads())
                .wonLeads(conversionCounts.wonLeads())
                .lostLeads(conversionCounts.lostLeads())
                .openLeads(conversionCounts.openLeads())
                .conversionRate(conversionCounts.conversionRate())
                .build();
    }

    private ReportData loadReportData() {
        Long organizationId = requireReportsOrganizationId();
        List<Lead> leads = leadRepository.findByOrganizationId(organizationId);
        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        List<Followup> followups = leadIds.isEmpty() ? List.of() : followupRepository.findByLeadIdIn(leadIds);

        return new ReportData(organizationId, leads, followups);
    }

    private Long requireReportsOrganizationId() {
        User currentUser = roleAuthorizationService.requireOrgAdmin();
        Long organizationId = authenticatedUserService.requireOrganizationId(currentUser);
        if (!featureAccessService.hasFeature(organizationId, REPORTS_FEATURE)) {
            throw new AccessDeniedException("Access denied");
        }
        return organizationId;
    }

    private ConversionCounts calculateConversionCounts(List<Lead> leads) {
        long totalLeads = leads.size();
        long wonLeads = leads.stream().filter(this::isWonLead).count();
        long lostLeads = leads.stream().filter(this::isLostLead).count();
        long openLeads = Math.max(totalLeads - wonLeads - lostLeads, 0);
        double conversionRate = totalLeads == 0 ? 0.0 : (wonLeads * 100.0) / totalLeads;

        return new ConversionCounts(totalLeads, wonLeads, lostLeads, openLeads, roundOneDecimal(conversionRate));
    }

    private FollowupCounts calculateFollowupCounts(List<Followup> followups) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        long pending = followups.stream().filter(this::isPendingFollowup).count();
        long completed = followups.stream().filter(this::isCompletedFollowup).count();
        long overdue = followups.stream()
                .filter(this::isPendingFollowup)
                .filter(followup -> followup.getFollowupDate().isBefore(now))
                .count();
        long todayCount = followups.stream()
                .filter(followup -> followup.getFollowupDate().toLocalDate().equals(today))
                .count();

        return new FollowupCounts(pending, completed, overdue, todayCount);
    }

    private Map<Long, String> loadSourceByLeadId(List<Lead> leads) {
        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        return leadDynamicFieldRepository.findByLeadIdIn(leadIds)
                .stream()
                .filter(field -> isSourceField(field.getFieldName()))
                .filter(field -> field.getFieldValue() != null && !field.getFieldValue().isBlank())
                .collect(Collectors.toMap(
                        LeadDynamicField::getLeadId,
                        field -> field.getFieldValue().trim().toUpperCase(),
                        (first, second) -> first
                ));
    }

    private FollowupReportResponse toFollowupReportResponse(FollowupCounts followupCounts) {
        return FollowupReportResponse.builder()
                .pending(followupCounts.pending())
                .completed(followupCounts.completed())
                .overdue(followupCounts.overdue())
                .today(followupCounts.today())
                .build();
    }

    private boolean isWonLead(Lead lead) {
        return WON_STAGES.contains(normalizeStage(lead.getCurrentStage()));
    }

    private boolean isLostLead(Lead lead) {
        return LOST_STAGE.equals(normalizeStage(lead.getCurrentStage()));
    }

    private boolean isPendingFollowup(Followup followup) {
        return PENDING_STATUS.equalsIgnoreCase(followup.getStatus());
    }

    private boolean isCompletedFollowup(Followup followup) {
        return COMPLETED_STATUS.equalsIgnoreCase(followup.getStatus());
    }

    private boolean isSourceField(String fieldName) {
        String normalized = fieldName == null ? "" : fieldName.replace("_", "")
                .replace("-", "")
                .replace(" ", "")
                .toLowerCase();
        return "source".equals(normalized) || "leadsource".equals(normalized);
    }

    private String normalizeStage(String stageName) {
        return stageName == null ? "" : stageName.trim().toUpperCase();
    }

    private String getAgingBucket(long ageInDays) {
        if (ageInDays <= 7) {
            return "0-7 days";
        }
        if (ageInDays <= 15) {
            return "8-15 days";
        }
        if (ageInDays <= 30) {
            return "16-30 days";
        }
        return "30+ days";
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record ReportData(Long organizationId, List<Lead> leads, List<Followup> followups) {
    }

    private record ConversionCounts(
            long totalLeads,
            long wonLeads,
            long lostLeads,
            long openLeads,
            double conversionRate
    ) {
    }

    private record FollowupCounts(long pending, long completed, long overdue, long today) {
    }
}
