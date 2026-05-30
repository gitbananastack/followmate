package com.followmate.addon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationAddonResponse {

    private Long organizationAddonId;
    private Long organizationId;
    private Long addonId;
    private String addonCode;
    private String addonName;
    private String description;
    private BigDecimal monthlyPrice;
    private String featureCode;
    private Boolean enabled;
    private LocalDate startDate;
    private LocalDate expiryDate;
}
