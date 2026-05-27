package com.followmate.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private Long id;
    private Long organizationId;
    private Long templateId;
    private Long workflowId;
    private String currentStage;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LeadFieldRequest> fields;
    private List<LeadNoteRequest> notes;
}
