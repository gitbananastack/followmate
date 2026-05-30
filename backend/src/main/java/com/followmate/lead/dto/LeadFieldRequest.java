package com.followmate.lead.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class LeadFieldRequest {

    @NotBlank(message = "Field name is required")
    @Size(max = 255, message = "Field name must not exceed 255 characters")
    private String fieldName;

    @Size(max = 2000, message = "Field value must not exceed 2000 characters")
    private String fieldValue;
}
