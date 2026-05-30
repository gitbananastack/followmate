package com.followmate.lead.service;

import com.followmate.lead.dto.LeadFieldRequest;
import com.followmate.lead.dto.LeadNoteRequest;
import com.followmate.lead.dto.LeadRequest;
import com.followmate.lead.dto.LeadResponse;
import com.followmate.lead.entity.Lead;
import com.followmate.lead.entity.LeadDynamicField;
import com.followmate.lead.entity.LeadNote;
import com.followmate.lead.repository.LeadDynamicFieldRepository;
import com.followmate.lead.repository.LeadNoteRepository;
import com.followmate.lead.repository.LeadRepository;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.auth.entity.User;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.entity.OrganizationLeadField;
import com.followmate.setup.entity.OrganizationPipelineStage;
import com.followmate.setup.repository.OrganizationLeadFieldRepository;
import com.followmate.setup.repository.OrganizationPipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadDynamicFieldRepository leadDynamicFieldRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationLeadFieldRepository organizationLeadFieldRepository;
    private final OrganizationPipelineStageRepository organizationPipelineStageRepository;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public LeadResponse createLead(LeadRequest request) {
        User currentUser = authenticatedUserService.getCurrentUser();
        Long organizationId = resolveOrganizationIdForCreate(currentUser, request.getOrganizationId());
        validateOrganization(organizationId);
        validateOrganizationLeadFields(organizationId, request.getFields());
        String currentStage = determineInitialStage(organizationId);

        Lead lead = Lead.builder()
                .organizationId(organizationId)
                .currentStage(currentStage)
                .status(currentStage)
                .build();

        Lead savedLead = leadRepository.save(lead);
        saveDynamicFields(savedLead.getId(), request.getFields());

        return toResponse(savedLead);
    }

    public List<LeadResponse> getAllLeads(Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        List<Lead> leads = authenticatedUserService.isSuperAdmin(currentUser)
                ? getSuperAdminLeads(requestedOrganizationId)
                : leadRepository.findByOrganizationId(authenticatedUserService.requireOrganizationId(currentUser));

        return leads
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LeadResponse getLeadById(Long id) {
        return toResponse(findAccessibleLeadById(id));
    }

    public LeadResponse updateLeadStage(Long id, String currentStage) {
        Lead lead = findAccessibleLeadById(id);
        String stage = currentStage.trim();
        validateOrganizationPipelineStage(lead.getOrganizationId(), stage);
        lead.setCurrentStage(stage);
        lead.setStatus(stage);
        return toResponse(leadRepository.save(lead));
    }

    @Transactional
    public LeadResponse updateLeadFields(Long id, List<LeadFieldRequest> fields) {
        Lead lead = findAccessibleLeadById(id);
        validateOrganizationLeadFields(lead.getOrganizationId(), fields);
        leadDynamicFieldRepository.deleteByLeadId(lead.getId());
        saveDynamicFields(lead.getId(), fields);
        Lead savedLead = leadRepository.save(lead);
        return toResponse(savedLead);
    }

    public LeadResponse addNoteToLead(Long id, LeadNoteRequest request) {
        Lead lead = findAccessibleLeadById(id);
        leadNoteRepository.save(LeadNote.builder()
                .leadId(lead.getId())
                .noteText(request.getNoteText())
                .build());

        return toResponse(lead);
    }

    @Transactional
    public void deleteLead(Long id) {
        Lead lead = findAccessibleLeadById(id);
        leadDynamicFieldRepository.deleteByLeadId(lead.getId());
        leadNoteRepository.deleteByLeadId(lead.getId());
        leadRepository.delete(lead);
    }

    private Lead findLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
    }

    private Lead findAccessibleLeadById(Long id) {
        User currentUser = authenticatedUserService.getCurrentUser();

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return findLeadById(id);
        }

        return leadRepository.findByIdAndOrganizationId(id, authenticatedUserService.requireOrganizationId(currentUser))
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    private List<Lead> getSuperAdminLeads(Long requestedOrganizationId) {
        if (requestedOrganizationId == null) {
            return leadRepository.findAll();
        }

        validateOrganization(requestedOrganizationId);
        return leadRepository.findByOrganizationId(requestedOrganizationId);
    }

    private Long resolveOrganizationIdForCreate(User currentUser, Long requestedOrganizationId) {
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            return authenticatedUserService.requireOrganizationId(currentUser);
        }

        if (requestedOrganizationId == null) {
            throw new IllegalArgumentException("Organization id is required");
        }

        return requestedOrganizationId;
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new RuntimeException("Organization not found with id: " + organizationId);
        }
    }

    private void validateOrganizationLeadFields(Long organizationId, List<LeadFieldRequest> leadFields) {
        List<OrganizationLeadField> setupFields = organizationLeadFieldRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId);
        if (setupFields.isEmpty()) {
            throw new IllegalArgumentException("No lead fields configured for this organization");
        }

        Map<String, OrganizationLeadField> setupFieldsByName = setupFields.stream()
                .collect(Collectors.toMap(OrganizationLeadField::getFieldName, Function.identity()));
        Set<String> submittedFieldNames = leadFields.stream()
                .map(LeadFieldRequest::getFieldName)
                .collect(Collectors.toSet());

        if (submittedFieldNames.size() != leadFields.size()) {
            throw new IllegalArgumentException("Duplicate lead fields are not allowed");
        }

        for (LeadFieldRequest field : leadFields) {
            if (!setupFieldsByName.containsKey(field.getFieldName())) {
                throw new IllegalArgumentException("Invalid field for organization setup: " + field.getFieldName());
            }
        }

        for (OrganizationLeadField setupField : setupFields) {
            if (Boolean.TRUE.equals(setupField.getMandatory())
                    && (!submittedFieldNames.contains(setupField.getFieldName())
                    || !hasSubmittedValue(leadFields, setupField.getFieldName()))) {
                throw new IllegalArgumentException("Mandatory field is missing: " + setupField.getFieldName());
            }
        }
    }

    private String determineInitialStage(Long organizationId) {
        List<OrganizationPipelineStage> stages = organizationPipelineStageRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId);
        if (stages.isEmpty()) {
            throw new IllegalArgumentException("No pipeline stages configured for this organization");
        }

        return stages.get(0).getStageName();
    }

    private boolean hasSubmittedValue(List<LeadFieldRequest> leadFields, String fieldName) {
        return leadFields.stream()
                .filter(field -> fieldName.equals(field.getFieldName()))
                .findFirst()
                .map(field -> StringUtils.hasText(field.getFieldValue()))
                .orElse(false);
    }

    private void validateOrganizationPipelineStage(Long organizationId, String stageName) {
        boolean stageExists = organizationPipelineStageRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId)
                .stream()
                .anyMatch(stage -> stage.getStageName().equals(stageName));

        if (!stageExists) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private void saveDynamicFields(Long leadId, List<LeadFieldRequest> fields) {
        List<LeadDynamicField> dynamicFields = fields.stream()
                .map(field -> LeadDynamicField.builder()
                        .leadId(leadId)
                        .fieldName(field.getFieldName())
                        .fieldValue(field.getFieldValue())
                        .build())
                .toList();

        leadDynamicFieldRepository.saveAll(dynamicFields);
    }

    private LeadResponse toResponse(Lead lead) {
        return LeadResponse.builder()
                .id(lead.getId())
                .organizationId(lead.getOrganizationId())
                .templateId(lead.getTemplateId())
                .workflowId(lead.getWorkflowId())
                .currentStage(lead.getCurrentStage())
                .status(lead.getStatus())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .fields(toFieldResponses(lead.getId()))
                .notes(toNoteResponses(lead.getId()))
                .build();
    }

    private List<LeadFieldRequest> toFieldResponses(Long leadId) {
        return leadDynamicFieldRepository.findByLeadId(leadId)
                .stream()
                .map(field -> LeadFieldRequest.builder()
                        .fieldName(field.getFieldName())
                        .fieldValue(field.getFieldValue())
                        .build())
                .toList();
    }

    private List<LeadNoteRequest> toNoteResponses(Long leadId) {
        return leadNoteRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
                .stream()
                .map(note -> LeadNoteRequest.builder()
                        .noteText(note.getNoteText())
                        .build())
                .toList();
    }
}
