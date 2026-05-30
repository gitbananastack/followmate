package com.followmate.setup.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Entity
@Table(name = "business_template_fields")
public class BusinessTemplateField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long templateId;

    @Column(nullable = false)
    private String fieldName;

    @Column(nullable = false)
    private String fieldLabel;

    @Column(nullable = false)
    private String fieldType;

    @Builder.Default
    @Column(nullable = false)
    private Boolean mandatory = false;

    @Column(nullable = false)
    private Integer displayOrder;

    @Column(length = 2000)
    private String dropdownOptions;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
