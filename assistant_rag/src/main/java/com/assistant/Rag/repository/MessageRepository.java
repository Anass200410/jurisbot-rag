package com.assistant.Rag.repository;

import com.assistant.Rag.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    void deleteByConversationId(Long conversationId);

    Optional<Message> findByIdAndConversation_Owner_IdAndRole(Long id, Long ownerId, String role);

    long countByRatingIsNotNull();

    @Query("select avg(message.rating) from Message message where message.rating is not null")
    Double getAverageRating();

    @Query("select message.rating, count(message) from Message message where message.rating is not null group by message.rating")
    List<Object[]> countRatingsByValue();

    @EntityGraph(attributePaths = {"conversation", "conversation.owner"})
    List<Message> findTop20ByRatingIsNotNullOrderByRatedAtDesc();
}
