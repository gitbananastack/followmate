package com.followmate.lead.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadFieldsUpdateRequest {

    @Valid
    @NotEmpty(message = "Lead fields are required")
    private List<LeadFieldRequest> fields;
}
