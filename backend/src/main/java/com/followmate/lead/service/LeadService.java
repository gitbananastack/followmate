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
import com.followmate.template.entity.TemplateField;
import com.followmate.template.entity.TemplateMaster;
import com.followmate.template.repository.TemplateFieldRepository;
import com.followmate.template.repository.TemplateMasterRepository;
import com.followmate.workflow.entity.WorkflowMaster;
import com.followmate.workflow.entity.WorkflowStage;
import com.followmate.workflow.repository.WorkflowMasterRepository;
import com.followmate.workflow.repository.WorkflowStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final TemplateMasterRepository templateMasterRepository;
    private final TemplateFieldRepository templateFieldRepository;
    private final WorkflowMasterRepository workflowMasterRepository;
    private final WorkflowStageRepository workflowStageRepository;

    @Transactional
    public LeadResponse createLead(LeadRequest request) {
        validateOrganization(request.getOrganizationId());
        validateTemplateFields(request.getTemplateId(), request.getFields());
        String currentStage = determineInitialStage(request.getWorkflowId());

        Lead lead = Lead.builder()
                .organizationId(request.getOrganizationId())
                .templateId(request.getTemplateId())
                .workflowId(request.getWorkflowId())
                .currentStage(currentStage)
                .status(currentStage)
                .build();

        Lead savedLead = leadRepository.save(lead);
        saveDynamicFields(savedLead.getId(), request.getFields());

        return toResponse(savedLead);
    }

    public List<LeadResponse> getAllLeads() {
        return leadRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LeadResponse getLeadById(Long id) {
        return toResponse(findLeadById(id));
    }

    public LeadResponse updateLeadStage(Long id, String currentStage) {
        Lead lead = findLeadById(id);
        lead.setCurrentStage(currentStage);
        lead.setStatus(currentStage);
        return toResponse(leadRepository.save(lead));
    }

    public LeadResponse addNoteToLead(Long id, LeadNoteRequest request) {
        Lead lead = findLeadById(id);
        leadNoteRepository.save(LeadNote.builder()
                .leadId(lead.getId())
                .noteText(request.getNoteText())
                .build());

        return toResponse(lead);
    }

    private Lead findLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new RuntimeException("Organization not found with id: " + organizationId);
        }
    }

    private void validateTemplateFields(Long templateId, List<LeadFieldRequest> leadFields) {
        TemplateMaster template = templateMasterRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        if (!Boolean.TRUE.equals(template.getActive())) {
            throw new RuntimeException("Template is not active");
        }

        List<TemplateField> templateFields = templateFieldRepository.findByTemplateIdOrderByDisplayOrderAsc(templateId);
        Map<String, TemplateField> templateFieldsByName = templateFields.stream()
                .collect(Collectors.toMap(TemplateField::getFieldName, Function.identity()));
        Set<String> submittedFieldNames = leadFields.stream()
                .map(LeadFieldRequest::getFieldName)
                .collect(Collectors.toSet());

        if (submittedFieldNames.size() != leadFields.size()) {
            throw new RuntimeException("Duplicate lead fields are not allowed");
        }

        for (LeadFieldRequest field : leadFields) {
            if (!templateFieldsByName.containsKey(field.getFieldName())) {
                throw new RuntimeException("Invalid field for template: " + field.getFieldName());
            }
        }

        for (TemplateField templateField : templateFields) {
            if (Boolean.TRUE.equals(templateField.getMandatory())
                    && !submittedFieldNames.contains(templateField.getFieldName())) {
                throw new RuntimeException("Mandatory field is missing: " + templateField.getFieldName());
            }
        }
    }

    private String determineInitialStage(Long workflowId) {
        WorkflowMaster workflow = workflowMasterRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found with id: " + workflowId));

        if (!Boolean.TRUE.equals(workflow.getActive())) {
            throw new RuntimeException("Workflow is not active");
        }

        List<WorkflowStage> stages = workflowStageRepository.findByWorkflowIdOrderByDisplayOrderAsc(workflowId);
        if (stages.isEmpty()) {
            throw new RuntimeException("Workflow has no stages");
        }

        return stages.get(0).getStageName();
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
