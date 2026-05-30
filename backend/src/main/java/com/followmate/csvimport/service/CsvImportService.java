package com.followmate.csvimport.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.followmate.auth.entity.User;
import com.followmate.csvimport.dto.CsvImportBatchResponse;
import com.followmate.csvimport.dto.CsvImportErrorResponse;
import com.followmate.csvimport.dto.CsvImportPreviewResponse;
import com.followmate.csvimport.entity.CsvImportBatch;
import com.followmate.csvimport.entity.CsvImportError;
import com.followmate.csvimport.repository.CsvImportBatchRepository;
import com.followmate.csvimport.repository.CsvImportErrorRepository;
import com.followmate.lead.entity.Lead;
import com.followmate.lead.entity.LeadDynamicField;
import com.followmate.lead.repository.LeadDynamicFieldRepository;
import com.followmate.lead.repository.LeadRepository;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.entity.OrganizationLeadField;
import com.followmate.setup.entity.OrganizationPipelineStage;
import com.followmate.setup.repository.OrganizationLeadFieldRepository;
import com.followmate.setup.repository.OrganizationPipelineStageRepository;
import com.followmate.subscription.service.FeatureAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CsvImportService {

    private static final int PREVIEW_LIMIT = 20;
    private static final int MAX_FIELD_VALUE_LENGTH = 2000;
    private static final String CSV_IMPORT_FEATURE = "CSV_IMPORT";

    private final CsvImportBatchRepository csvImportBatchRepository;
    private final CsvImportErrorRepository csvImportErrorRepository;
    private final LeadRepository leadRepository;
    private final LeadDynamicFieldRepository leadDynamicFieldRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationLeadFieldRepository organizationLeadFieldRepository;
    private final OrganizationPipelineStageRepository organizationPipelineStageRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final FeatureAccessService featureAccessService;
    private final ObjectMapper objectMapper;

    public CsvImportPreviewResponse preview(MultipartFile file, Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateCsvImportRole(currentUser);
        Long organizationId = resolveOrganizationId(currentUser, requestedOrganizationId);
        validateOrganization(organizationId);
        validateCsvImportFeature(organizationId);

        CsvData csvData = readCsv(file);
        return CsvImportPreviewResponse.builder()
                .headers(csvData.headers())
                .previewRows(csvData.rows().stream().limit(PREVIEW_LIMIT).toList())
                .build();
    }

    @Transactional
    public CsvImportBatchResponse importCsv(MultipartFile file, String columnMappingJson, Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateCsvImportRole(currentUser);
        Long organizationId = resolveOrganizationId(currentUser, requestedOrganizationId);
        validateOrganization(organizationId);
        validateCsvImportFeature(organizationId);

        CsvData csvData = readCsv(file);
        Map<String, String> columnMapping = parseColumnMapping(columnMappingJson);
        ImportContext context = buildImportContext(organizationId, csvData.headers(), columnMapping);

        CsvImportBatch batch = csvImportBatchRepository.save(CsvImportBatch.builder()
                .organizationId(organizationId)
                .fileName(StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "upload.csv")
                .totalRows(csvData.rows().size())
                .successRows(0)
                .failedRows(0)
                .status("PROCESSING")
                .createdBy(currentUser.getId())
                .build());

        int successRows = 0;
        int failedRows = 0;
        for (int index = 0; index < csvData.rows().size(); index++) {
            Map<String, String> row = csvData.rows().get(index);
            int rowNumber = index + 2;
            try {
                importRow(row, context);
                successRows++;
            } catch (Exception ex) {
                failedRows++;
                csvImportErrorRepository.save(CsvImportError.builder()
                        .batchId(batch.getId())
                        .rowNumber(rowNumber)
                        .errorMessage(trimMessage(ex.getMessage()))
                        .rawRowData(toRawRowData(row))
                        .build());
            }
        }

        batch.setSuccessRows(successRows);
        batch.setFailedRows(failedRows);
        batch.setStatus(determineStatus(successRows, failedRows));
        return toBatchResponse(csvImportBatchRepository.save(batch));
    }

    public List<CsvImportBatchResponse> getHistory(Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateCsvImportRole(currentUser);
        Long organizationId = resolveOrganizationId(currentUser, requestedOrganizationId);
        validateCsvImportFeature(organizationId);
        return csvImportBatchRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId)
                .stream()
                .map(this::toBatchResponse)
                .toList();
    }

    public List<CsvImportErrorResponse> getErrors(Long batchId, Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateCsvImportRole(currentUser);
        Long organizationId = resolveOrganizationId(currentUser, requestedOrganizationId);
        validateCsvImportFeature(organizationId);
        CsvImportBatch batch = csvImportBatchRepository.findByIdAndOrganizationId(batchId, organizationId)
                .orElseThrow(() -> new AccessDeniedException("Access denied"));

        return csvImportErrorRepository.findByBatchIdOrderByRowNumberAsc(batch.getId())
                .stream()
                .map(this::toErrorResponse)
                .toList();
    }

    private void importRow(Map<String, String> row, ImportContext context) {
        Map<String, String> fieldValues = new LinkedHashMap<>();
        for (Map.Entry<String, String> mapping : context.columnMapping().entrySet()) {
            String fieldName = mapping.getValue();
            String value = row.getOrDefault(mapping.getKey(), "");
            validateFieldValue(fieldName, value);
            fieldValues.put(fieldName, value);
        }

        context.sourceFieldName().ifPresent(sourceFieldName -> {
            if (!StringUtils.hasText(fieldValues.get(sourceFieldName))) {
                fieldValues.put(sourceFieldName, "CSV");
            }
        });

        validateMandatoryFields(context.setupFields(), fieldValues);

        Lead savedLead = leadRepository.save(Lead.builder()
                .organizationId(context.organizationId())
                .currentStage(context.initialStage())
                .status(context.initialStage())
                .build());

        List<LeadDynamicField> dynamicFields = fieldValues.entrySet()
                .stream()
                .map(entry -> LeadDynamicField.builder()
                        .leadId(savedLead.getId())
                        .fieldName(entry.getKey())
                        .fieldValue(entry.getValue() == null ? "" : entry.getValue())
                        .build())
                .toList();
        leadDynamicFieldRepository.saveAll(dynamicFields);
    }

    private ImportContext buildImportContext(Long organizationId, List<String> csvHeaders, Map<String, String> columnMapping) {
        if (columnMapping.isEmpty()) {
            throw new IllegalArgumentException("Column mapping is required");
        }

        Set<String> headerSet = new HashSet<>(csvHeaders);
        for (String header : columnMapping.keySet()) {
            if (!headerSet.contains(header)) {
                throw new IllegalArgumentException("Mapped CSV header not found: " + header);
            }
        }

        List<OrganizationLeadField> setupFields = organizationLeadFieldRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId);
        if (setupFields.isEmpty()) {
            throw new IllegalArgumentException("No lead fields configured for this organization");
        }

        Map<String, OrganizationLeadField> setupFieldsByName = setupFields.stream()
                .collect(Collectors.toMap(OrganizationLeadField::getFieldName, Function.identity()));
        Set<String> mappedFieldNames = new HashSet<>();
        for (String fieldName : columnMapping.values()) {
            if (!StringUtils.hasText(fieldName)) {
                throw new IllegalArgumentException("Mapped field name is required");
            }
            if (!setupFieldsByName.containsKey(fieldName)) {
                throw new IllegalArgumentException("Invalid field for organization setup: " + fieldName);
            }
            if (!mappedFieldNames.add(fieldName)) {
                throw new IllegalArgumentException("Duplicate mapped field is not allowed: " + fieldName);
            }
        }

        String initialStage = organizationPipelineStageRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId)
                .stream()
                .findFirst()
                .map(OrganizationPipelineStage::getStageName)
                .orElseThrow(() -> new IllegalArgumentException("No pipeline stages configured for this organization"));

        Optional<String> sourceFieldName = setupFields.stream()
                .map(OrganizationLeadField::getFieldName)
                .filter(this::isSourceField)
                .findFirst();

        return new ImportContext(organizationId, columnMapping, setupFields, initialStage, sourceFieldName);
    }

    private Map<String, String> parseColumnMapping(String columnMappingJson) {
        if (!StringUtils.hasText(columnMappingJson)) {
            throw new IllegalArgumentException("Column mapping is required");
        }

        try {
            return objectMapper.readValue(columnMappingJson, new TypeReference<Map<String, String>>() {
            });
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid column mapping JSON");
        }
    }

    private CsvData readCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required");
        }

        List<List<String>> rows;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            rows = parseCsvRecords(reader);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read CSV file");
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        List<String> headers = rows.get(0).stream()
                .map(this::stripBom)
                .map(String::trim)
                .toList();
        if (headers.stream().anyMatch(header -> !StringUtils.hasText(header))) {
            throw new IllegalArgumentException("CSV headers must not be blank");
        }
        if (new HashSet<>(headers).size() != headers.size()) {
            throw new IllegalArgumentException("Duplicate CSV headers are not allowed");
        }

        List<Map<String, String>> dataRows = rows.stream()
                .skip(1)
                .filter(row -> row.stream().anyMatch(StringUtils::hasText))
                .map(row -> toRowMap(headers, row))
                .toList();

        return new CsvData(headers, dataRows);
    }

    private List<List<String>> parseCsvRecords(BufferedReader reader) throws IOException {
        List<List<String>> records = new ArrayList<>();
        List<String> record = new ArrayList<>();
        StringBuilder currentValue = new StringBuilder();
        boolean inQuotes = false;
        boolean hasRecordContent = false;
        int nextChar;

        while ((nextChar = reader.read()) != -1) {
            char currentChar = (char) nextChar;
            hasRecordContent = true;

            if (currentChar == '"') {
                reader.mark(1);
                int peek = reader.read();
                if (inQuotes && peek == '"') {
                    currentValue.append('"');
                } else {
                    inQuotes = !inQuotes;
                    if (peek != -1) {
                        reader.reset();
                    }
                }
            } else if (currentChar == ',' && !inQuotes) {
                record.add(currentValue.toString().trim());
                currentValue.setLength(0);
            } else if ((currentChar == '\n' || currentChar == '\r') && !inQuotes) {
                if (currentChar == '\r') {
                    reader.mark(1);
                    int peek = reader.read();
                    if (peek != '\n' && peek != -1) {
                        reader.reset();
                    }
                }
                record.add(currentValue.toString().trim());
                records.add(record);
                record = new ArrayList<>();
                currentValue.setLength(0);
                hasRecordContent = false;
            } else {
                currentValue.append(currentChar);
            }
        }

        if (inQuotes) {
            throw new IllegalArgumentException("Invalid CSV format: unmatched quote");
        }

        if (hasRecordContent || currentValue.length() > 0 || !record.isEmpty()) {
            record.add(currentValue.toString().trim());
            records.add(record);
        }

        return records;
    }

    private Map<String, String> toRowMap(List<String> headers, List<String> row) {
        Map<String, String> rowMap = new LinkedHashMap<>();
        for (int index = 0; index < headers.size(); index++) {
            rowMap.put(headers.get(index), index < row.size() ? row.get(index) : "");
        }
        return rowMap;
    }

    private void validateMandatoryFields(List<OrganizationLeadField> setupFields, Map<String, String> fieldValues) {
        for (OrganizationLeadField setupField : setupFields) {
            if (Boolean.TRUE.equals(setupField.getMandatory())
                    && !StringUtils.hasText(fieldValues.get(setupField.getFieldName()))) {
                throw new IllegalArgumentException("Mandatory field is missing: " + setupField.getFieldName());
            }
        }
    }

    private void validateFieldValue(String fieldName, String value) {
        if (value != null && value.length() > MAX_FIELD_VALUE_LENGTH) {
            throw new IllegalArgumentException("Field value exceeds 2000 characters: " + fieldName);
        }
    }

    private Long resolveOrganizationId(User currentUser, Long requestedOrganizationId) {
        if (authenticatedUserService.isOrgAdmin(currentUser)) {
            Long organizationId = authenticatedUserService.requireOrganizationId(currentUser);
            if (requestedOrganizationId != null && !organizationId.equals(requestedOrganizationId)) {
                throw new AccessDeniedException("Access denied");
            }
            return organizationId;
        }

        if (requestedOrganizationId == null) {
            throw new IllegalArgumentException("Organization id is required");
        }

        return requestedOrganizationId;
    }

    private void validateCsvImportRole(User currentUser) {
        if (!authenticatedUserService.isOrgAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new IllegalArgumentException("Organization not found with id: " + organizationId);
        }
    }

    private void validateCsvImportFeature(Long organizationId) {
        if (!featureAccessService.hasFeature(organizationId, CSV_IMPORT_FEATURE)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private boolean isSourceField(String fieldName) {
        String normalized = fieldName.replace("_", "").replace("-", "").replace(" ", "").toLowerCase();
        return "source".equals(normalized) || "leadsource".equals(normalized);
    }

    private String stripBom(String value) {
        return value.startsWith("\uFEFF") ? value.substring(1) : value;
    }

    private String determineStatus(int successRows, int failedRows) {
        if (failedRows == 0) {
            return "COMPLETED";
        }
        if (successRows == 0) {
            return "FAILED";
        }
        return "COMPLETED_WITH_ERRORS";
    }

    private String trimMessage(String message) {
        String safeMessage = StringUtils.hasText(message) ? message : "Row import failed";
        return safeMessage.length() > 2000 ? safeMessage.substring(0, 2000) : safeMessage;
    }

    private String toRawRowData(Map<String, String> row) {
        try {
            return objectMapper.writeValueAsString(row);
        } catch (JsonProcessingException ex) {
            return row.toString();
        }
    }

    private CsvImportBatchResponse toBatchResponse(CsvImportBatch batch) {
        return CsvImportBatchResponse.builder()
                .id(batch.getId())
                .organizationId(batch.getOrganizationId())
                .fileName(batch.getFileName())
                .totalRows(batch.getTotalRows())
                .successRows(batch.getSuccessRows())
                .failedRows(batch.getFailedRows())
                .status(batch.getStatus())
                .createdBy(batch.getCreatedBy())
                .createdAt(batch.getCreatedAt())
                .build();
    }

    private CsvImportErrorResponse toErrorResponse(CsvImportError error) {
        return CsvImportErrorResponse.builder()
                .id(error.getId())
                .batchId(error.getBatchId())
                .rowNumber(error.getRowNumber())
                .errorMessage(error.getErrorMessage())
                .rawRowData(error.getRawRowData())
                .build();
    }

    private record CsvData(List<String> headers, List<Map<String, String>> rows) {
    }

    private record ImportContext(
            Long organizationId,
            Map<String, String> columnMapping,
            List<OrganizationLeadField> setupFields,
            String initialStage,
            Optional<String> sourceFieldName
    ) {
    }
}
