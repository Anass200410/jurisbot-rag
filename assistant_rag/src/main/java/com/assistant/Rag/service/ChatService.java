package com.assistant.Rag.service;


import com.assistant.Rag.dto.request.ChatRequest;
import com.assistant.Rag.dto.response.ChatResponse;

public interface ChatService {
    ChatResponse processChat(ChatRequest request);
    Integer rateAnswer(Long messageId, Integer rating);
}
