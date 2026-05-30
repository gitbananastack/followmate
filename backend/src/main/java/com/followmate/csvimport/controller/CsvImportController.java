package com.followmate.csvimport.controller;

import com.followmate.common.ApiResponse;
import com.followmate.csvimport.dto.CsvImportBatchResponse;
import com.followmate.csvimport.dto.CsvImportErrorResponse;
import com.followmate.csvimport.dto.CsvImportPreviewResponse;
import com.followmate.csvimport.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/csv-import")
@RequiredArgsConstructor
public class CsvImportController {

    private final CsvImportService csvImportService;

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CsvImportPreviewResponse>> preview(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "organizationId", required = false) Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("CSV preview generated successfully",
                csvImportService.preview(file, organizationId)));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CsvImportBatchResponse>> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam("columnMapping") String columnMapping,
            @RequestParam(value = "organizationId", required = false) Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("CSV import completed",
                csvImportService.importCsv(file, columnMapping, organizationId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<CsvImportBatchResponse>>> history(
            @RequestParam(value = "organizationId", required = false) Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("CSV import history fetched successfully",
                csvImportService.getHistory(organizationId)));
    }

    @GetMapping("/history/{batchId}/errors")
    public ResponseEntity<ApiResponse<List<CsvImportErrorResponse>>> errors(
            @PathVariable Long batchId,
            @RequestParam(value = "organizationId", required = false) Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("CSV import errors fetched successfully",
                csvImportService.getErrors(batchId, organizationId)));
    }
}
