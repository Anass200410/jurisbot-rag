package com.assistant.Rag.service.impl;

import com.assistant.Rag.dto.request.ConversationRequest;
import com.assistant.Rag.dto.response.ConversationResponse;
import com.assistant.Rag.dto.response.MessageResponse;
import com.assistant.Rag.entity.Conversation;
import com.assistant.Rag.entity.Message;
import com.assistant.Rag.entity.User;
import com.assistant.Rag.exception.ResourceNotFoundException;
import com.assistant.Rag.repository.ConversationRepository;
import com.assistant.Rag.repository.MessageRepository;
import com.assistant.Rag.service.ConversationService;
import com.assistant.Rag.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Conversation createConversation(ConversationRequest request) {
        User currentUser = userService.getCurrentUser();

        Conversation conversation = Conversation.builder()
                .title(request.getTitle() != null ? request.getTitle() : "Nouvelle conversation")
                .owner(currentUser)
                .messages(new ArrayList<>())
                .build();

        Conversation saved = conversationRepository.save(conversation);
        log.info("✅ Conversation créée: ID={}", saved.getId());
        return saved;
    }

    @Override
    @Transactional
    public Conversation getConversation(Long id) {
        User currentUser = userService.getCurrentUser();
        return conversationRepository.findByIdAndOwnerId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationDetails(Long id) {
        return toResponse(getConversation(id), true);
    }

    @Override
    public List<ConversationResponse> getUserConversations() {
        User currentUser = userService.getCurrentUser();
        List<Conversation> conversations = conversationRepository
                .findByOwnerIdOrderByUpdatedAtDesc(currentUser.getId());

        log.info("📋 {} conversations trouvées", conversations.size());

        return conversations.stream()
                .map(conversation -> toResponse(conversation, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Conversation updateConversation(Long id, ConversationRequest request) {
        Conversation conversation = getConversation(id);
        conversation.setTitle(request.getTitle());
        return conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public void deleteConversation(Long id) {
        User currentUser = userService.getCurrentUser();
        if (!conversationRepository.existsByIdAndOwnerId(id, currentUser.getId())) {
            throw new ResourceNotFoundException("Conversation non trouvée");
        }
        messageRepository.deleteByConversationId(id);
        conversationRepository.deleteById(id);
        log.info("🗑️ Conversation supprimée: ID={}", id);
    }

    private ConversationResponse toResponse(Conversation conversation, boolean includeMessages) {
        List<MessageResponse> messages = includeMessages
                ? conversation.getMessages().stream().map(this::toMessageResponse).collect(Collectors.toList())
                : List.of();
        return ConversationResponse.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(messages)
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .sources(parseSources(message.getSources()))
                .rating(message.getRating())
                .ratedAt(message.getRatedAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private List<Map<String, Object>> parseSources(String sources) {
        if (sources == null || sources.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(sources, new TypeReference<>() {});
        } catch (Exception exception) {
            log.warn("Could not parse stored message sources: {}", exception.getMessage());
            return new ArrayList<>();
        }
    }
}
