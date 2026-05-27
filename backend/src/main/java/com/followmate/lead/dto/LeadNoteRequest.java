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
public class LeadNoteRequest {

    @NotBlank(message = "Note text is required")
    @Size(max = 2000, message = "Note text must not exceed 2000 characters")
    private String noteText;
}
