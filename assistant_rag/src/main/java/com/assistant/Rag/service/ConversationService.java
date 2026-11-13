package com.assistant.Rag.service;


import com.assistant.Rag.dto.request.ConversationRequest;
import com.assistant.Rag.dto.response.ConversationResponse;
import com.assistant.Rag.entity.Conversation;
import java.util.List;

public interface ConversationService {
    Conversation createConversation(ConversationRequest request);
    Conversation getConversation(Long id);
    ConversationResponse getConversationDetails(Long id);
    List<ConversationResponse> getUserConversations();
    Conversation updateConversation(Long id, ConversationRequest request);
    void deleteConversation(Long id);
}
