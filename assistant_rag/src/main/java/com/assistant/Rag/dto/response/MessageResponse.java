package com.assistant.Rag.dto.response;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class MessageResponse {
    private Long id;
    private String role;
    private String content;
    private List<Map<String, Object>> sources;
    private Integer rating;
    private LocalDateTime ratedAt;
    private LocalDateTime createdAt;
}
