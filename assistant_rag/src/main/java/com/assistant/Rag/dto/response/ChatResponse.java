package com.assistant.Rag.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChatResponse {
    private Long messageId;
    private Long conversationId;
    private String conversationTitle;
    private String content;
    private List<SourceResponse> sources;
    private Integer rating;
    private String timestamp;

    @Data
    @Builder
    public static class SourceResponse {
        private String document;
        private String article;
        private Integer page;
        private String content;
    }
}
