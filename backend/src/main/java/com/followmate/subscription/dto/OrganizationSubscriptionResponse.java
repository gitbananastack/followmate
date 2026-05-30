package com.followmate.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSubscriptionResponse {

    private Long id;
    private Long organizationId;
    private Long planId;
    private String planCode;
    private String planName;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String status;
    private List<String> features;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
