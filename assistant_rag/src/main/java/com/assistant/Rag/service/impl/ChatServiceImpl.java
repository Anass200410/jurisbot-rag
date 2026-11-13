package com.assistant.Rag.service.impl;

import com.assistant.Rag.dto.FlaskResponse;
import com.assistant.Rag.dto.request.ChatRequest;
import com.assistant.Rag.dto.request.ConversationRequest;
import com.assistant.Rag.dto.response.ChatResponse;
import com.assistant.Rag.entity.Conversation;
import com.assistant.Rag.entity.Message;
import com.assistant.Rag.exception.UpstreamServiceException;
import com.assistant.Rag.repository.MessageRepository;
import com.assistant.Rag.service.ChatService;
import com.assistant.Rag.service.ConversationService;
import com.assistant.Rag.service.FlaskClient;
import com.assistant.Rag.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ConversationService conversationService;
    private final MessageRepository messageRepository;
    private final FlaskClient flaskClient;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    @Override
    public ChatResponse processChat(ChatRequest request) {
        String question = request.getQuestion().trim();
        String language = request.getLanguage() == null ? "fr" : request.getLanguage();

        if (request.getConversationId() != null) {
            conversationService.getConversation(request.getConversationId());
        }

        // Keep the network call outside a database transaction so a slow model does not
        // hold a connection or lock conversation rows for the duration of generation.
        FlaskResponse flaskResponse = flaskClient.sendQuestion(question, language);
        if (flaskResponse.getAnswer() == null || flaskResponse.getAnswer().isBlank()) {
            throw new UpstreamServiceException("RAG service returned an empty answer");
        }

        return transactionTemplate.execute(status -> persistAnswer(request, question, flaskResponse));
    }

    private ChatResponse persistAnswer(ChatRequest request, String question, FlaskResponse flaskResponse) {
        Conversation conversation;
        if (request.getConversationId() == null) {
            ConversationRequest conversationRequest = new ConversationRequest();
            conversationRequest.setTitle("Nouvelle conversation");
            conversation = conversationService.createConversation(conversationRequest);
        } else {
            conversation = conversationService.getConversation(request.getConversationId());
        }

        messageRepository.save(Message.builder()
                .role("USER")
                .content(question)
                .conversation(conversation)
                .build());

        List<Map<String, Object>> flaskSources = flaskResponse.getSources() == null
                ? List.of()
                : flaskResponse.getSources();
        Message assistantMessage = messageRepository.save(Message.builder()
                .role("ASSISTANT")
                .content(flaskResponse.getAnswer())
                .sources(serializeSources(flaskSources))
                .conversation(conversation)
                .build());

        String title = conversation.getTitle();
        if ("Nouvelle conversation".equals(title)) {
            title = question.length() > 50 ? question.substring(0, 50).trim() + "…" : question;
            ConversationRequest titleRequest = new ConversationRequest();
            titleRequest.setTitle(title);
            conversationService.updateConversation(conversation.getId(), titleRequest);
        }

        List<ChatResponse.SourceResponse> sources = new ArrayList<>(flaskSources.size());
        for (Map<String, Object> source : flaskSources) {
            Object page = source.get("page");
            Integer pageNumber = page instanceof Number ? ((Number) page).intValue() : null;
            sources.add(ChatResponse.SourceResponse.builder()
                    .document(stringValue(source.get("document"), "Inconnu"))
                    .article(stringValue(source.get("article"), "N/A"))
                    .page(pageNumber)
                    .content(stringValue(source.get("content"), ""))
                    .build());
        }

        log.info("Chat response saved: conversationId={}, messageId={}",
                conversation.getId(), assistantMessage.getId());
        return ChatResponse.builder()
                .messageId(assistantMessage.getId())
                .conversationId(conversation.getId())
                .conversationTitle(title)
                .content(assistantMessage.getContent())
                .sources(sources)
                .rating(assistantMessage.getRating())
                .timestamp((assistantMessage.getCreatedAt() == null
                        ? LocalDateTime.now()
                        : assistantMessage.getCreatedAt()).toString())
                .build();
    }

    @Override
    @Transactional
    public Integer rateAnswer(Long messageId, Integer rating) {
        Long currentUserId = userService.getCurrentUser().getId();
        Message message = messageRepository
                .findByIdAndConversation_Owner_IdAndRole(messageId, currentUserId, "ASSISTANT")
                .orElseThrow(() -> new IllegalArgumentException("Réponse introuvable"));

        message.setRating(rating);
        message.setRatedAt(LocalDateTime.now());
        return message.getRating();
    }

    private String serializeSources(List<Map<String, Object>> sources) {
        try {
            return objectMapper.writeValueAsString(sources);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Impossible d'enregistrer les sources RAG", exception);
        }
    }

    private String stringValue(Object value, String fallback) {
        return value == null ? fallback : value.toString();
    }
}
