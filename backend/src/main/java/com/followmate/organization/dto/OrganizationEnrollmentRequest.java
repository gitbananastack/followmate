package com.followmate.organization.dto;

import com.followmate.setup.dto.OrganizationLeadFieldRequest;
import com.followmate.setup.dto.OrganizationPipelineStageRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrganizationEnrollmentRequest {

    @NotBlank(message = "Organization name is required")
    @Size(max = 255, message = "Organization name must not exceed 255 characters")
    private String organizationName;

    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    @Size(max = 1000, message = "Address must not exceed 1000 characters")
    private String address;

    @NotBlank(message = "Business type is required")
    @Size(max = 255, message = "Business type must not exceed 255 characters")
    private String businessType;

    @NotNull(message = "Source template id is required")
    private Long sourceTemplateId;

    @Valid
    @NotEmpty(message = "Lead fields are required")
    private List<OrganizationLeadFieldRequest> leadFields;

    @Valid
    @NotEmpty(message = "Pipeline stages are required")
    private List<OrganizationPipelineStageRequest> pipelineStages;
}
