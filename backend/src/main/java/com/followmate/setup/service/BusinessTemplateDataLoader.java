package com.followmate.setup.service;

import com.followmate.setup.entity.BusinessTemplateField;
import com.followmate.setup.entity.BusinessTemplateMaster;
import com.followmate.setup.entity.BusinessTemplateStage;
import com.followmate.setup.repository.BusinessTemplateFieldRepository;
import com.followmate.setup.repository.BusinessTemplateMasterRepository;
import com.followmate.setup.repository.BusinessTemplateStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BusinessTemplateDataLoader implements CommandLineRunner {

    private static final String ART_GALLERY = "ART_GALLERY";

    private final BusinessTemplateMasterRepository businessTemplateMasterRepository;
    private final BusinessTemplateFieldRepository businessTemplateFieldRepository;
    private final BusinessTemplateStageRepository businessTemplateStageRepository;

    @Override
    public void run(String... args) {
        seedArtGalleryTemplate();
        seedEducationTemplate();
    }

    private void seedArtGalleryTemplate() {
        BusinessTemplateMaster template = businessTemplateMasterRepository
                .findByBusinessTypeAndActiveTrue(ART_GALLERY)
                .orElseGet(() -> businessTemplateMasterRepository.save(BusinessTemplateMaster.builder()
                        .templateName("Art Gallery CRM")
                        .businessType(ART_GALLERY)
                        .active(true)
                        .build()));

        if (businessTemplateFieldRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .isEmpty()) {
            businessTemplateFieldRepository.saveAll(List.of(
                    field(template.getId(), "customerName", "Customer Name", "TEXT", true, 1, null),
                    field(template.getId(), "phoneNumber", "Phone Number", "PHONE", true, 2, null),
                    field(template.getId(), "email", "Email", "EMAIL", false, 3, null),
                    field(template.getId(), "artworkName", "Artwork / Requirement", "TEXT", true, 4, null),
                    field(template.getId(), "budget", "Budget", "NUMBER", false, 5, null),
                    field(template.getId(), "interestLevel", "Interest Level", "DROPDOWN", false, 6,
                            "High,Medium,Low"),
                    field(template.getId(), "remarks", "Remarks", "TEXTAREA", false, 7, null)
            ));
        }

        if (businessTemplateStageRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .isEmpty()) {
            businessTemplateStageRepository.saveAll(List.of(
                    stage(template.getId(), "NEW_INQUIRY", 1),
                    stage(template.getId(), "CONTACTED", 2),
                    stage(template.getId(), "FOLLOW_UP", 3),
                    stage(template.getId(), "NEGOTIATION", 4),
                    stage(template.getId(), "WON", 5),
                    stage(template.getId(), "LOST", 6)
            ));
        }
    }

    private void seedEducationTemplate() {
        BusinessTemplateMaster template = businessTemplateMasterRepository
                .findByBusinessTypeAndActiveTrue("EDUCATION")
                .orElseGet(() -> businessTemplateMasterRepository.save(BusinessTemplateMaster.builder()
                        .templateName("Education Admissions CRM")
                        .businessType("EDUCATION")
                        .active(true)
                        .build()));

        if (businessTemplateFieldRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .isEmpty()) {
            businessTemplateFieldRepository.saveAll(List.of(
                    field(template.getId(), "studentName", "Student Name", "TEXT", true, 1, null),
                    field(template.getId(), "guardianPhone", "Guardian Phone", "PHONE", true, 2, null),
                    field(template.getId(), "courseInterested", "Course Interested", "TEXT", true, 3, null),
                    field(template.getId(), "admissionStage", "Admission Stage", "DROPDOWN", false, 4,
                            "Inquiry,Counselling,Application,Enrolled")
            ));
        }

        if (businessTemplateStageRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .isEmpty()) {
            businessTemplateStageRepository.saveAll(List.of(
                    stage(template.getId(), "NEW_INQUIRY", 1),
                    stage(template.getId(), "COUNSELLING", 2),
                    stage(template.getId(), "APPLICATION", 3),
                    stage(template.getId(), "ENROLLED", 4),
                    stage(template.getId(), "DROPPED", 5)
            ));
        }
    }

    private BusinessTemplateField field(
            Long templateId,
            String fieldName,
            String fieldLabel,
            String fieldType,
            boolean mandatory,
            int displayOrder,
            String dropdownOptions
    ) {
        return BusinessTemplateField.builder()
                .templateId(templateId)
                .fieldName(fieldName)
                .fieldLabel(fieldLabel)
                .fieldType(fieldType)
                .mandatory(mandatory)
                .displayOrder(displayOrder)
                .dropdownOptions(dropdownOptions)
                .active(true)
                .build();
    }

    private BusinessTemplateStage stage(Long templateId, String stageName, int displayOrder) {
        return BusinessTemplateStage.builder()
                .templateId(templateId)
                .stageName(stageName)
                .displayOrder(displayOrder)
                .active(true)
                .build();
    }
}
