package com.assistant.Rag.controller;

import com.assistant.Rag.dto.request.ConversationRequest;
import com.assistant.Rag.dto.response.ConversationResponse;
import com.assistant.Rag.entity.Conversation;
import com.assistant.Rag.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@Slf4j
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        log.info("📋 GET /conversations - Récupération de toutes les conversations");
        List<ConversationResponse> conversations = conversationService.getUserConversations();
        log.info("📋 {} conversations retournées", conversations.size());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.getConversationDetails(id));
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@RequestBody ConversationRequest request) {
        log.info("📝 POST /conversations - Création d'une nouvelle conversation");
        Conversation conversation = conversationService.createConversation(request);
        log.info("✅ Conversation créée: ID={}", conversation.getId());
        return ResponseEntity.ok(toSummary(conversation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConversationResponse> updateConversation(
            @PathVariable Long id,
            @RequestBody ConversationRequest request) {
        log.info("📝 PUT /conversations/{} - Mise à jour", id);
        Conversation conversation = conversationService.updateConversation(id, request);
        return ResponseEntity.ok(toSummary(conversation));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long id) {
        log.info("🗑️ DELETE /conversations/{} - Suppression", id);
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    private ConversationResponse toSummary(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(List.of())
                .build();
    }
}
