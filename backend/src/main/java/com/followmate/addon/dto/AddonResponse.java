package com.followmate.addon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddonResponse {

    private Long id;
    private String addonCode;
    private String addonName;
    private String description;
    private BigDecimal monthlyPrice;
    private String featureCode;
    private Boolean active;
}
