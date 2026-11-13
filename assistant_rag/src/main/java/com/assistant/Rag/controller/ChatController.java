package com.assistant.Rag.controller;


import com.assistant.Rag.dto.request.ChatRequest;
import com.assistant.Rag.dto.request.RatingRequest;
import com.assistant.Rag.dto.response.ChatResponse;
import com.assistant.Rag.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> processChat(@Valid @RequestBody ChatRequest request) {
        log.info("Chat request received ({} characters)", request.getQuestion().length());
        return ResponseEntity.ok(chatService.processChat(request));
    }

    @PutMapping("/messages/{messageId}/rating")
    public ResponseEntity<Map<String, Object>> rateAnswer(
            @PathVariable Long messageId,
            @Valid @RequestBody RatingRequest request
    ) {
        Integer rating = chatService.rateAnswer(messageId, request.getRating());
        return ResponseEntity.ok(Map.of("messageId", messageId, "rating", rating));
    }
}
