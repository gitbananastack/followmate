package com.followmate.followup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FollowupRequest {

    @NotNull(message = "Lead id is required")
    private Long leadId;

    @NotNull(message = "Follow-up date is required")
    private LocalDateTime followupDate;

    @NotBlank(message = "Remarks are required")
    @Size(max = 2000, message = "Remarks must not exceed 2000 characters")
    private String remarks;

    @Pattern(regexp = "PENDING|COMPLETED|OVERDUE", message = "Status must be PENDING, COMPLETED, or OVERDUE")
    private String status;
}
