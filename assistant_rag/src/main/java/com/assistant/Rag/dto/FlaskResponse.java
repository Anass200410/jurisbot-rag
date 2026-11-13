package com.assistant.Rag.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class FlaskResponse {
    private String answer; 
    private List<Map<String, Object>> sources;
}