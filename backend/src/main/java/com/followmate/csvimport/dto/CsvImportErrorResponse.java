package com.followmate.csvimport.dto;

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
public class CsvImportErrorResponse {

    private Long id;
    private Long batchId;
    private Integer rowNumber;
    private String errorMessage;
    private String rawRowData;
}
