package com.followmate.subscription.dto;

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
public class FeatureResponse {

    private Long id;
    private String featureCode;
    private String featureName;
    private String description;
    private Boolean active;
}
