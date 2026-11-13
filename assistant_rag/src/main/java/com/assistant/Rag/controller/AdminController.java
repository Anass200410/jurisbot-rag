package com.assistant.Rag.controller;

import com.assistant.Rag.entity.Message;
import com.assistant.Rag.entity.User;
import com.assistant.Rag.repository.ConversationRepository;
import com.assistant.Rag.repository.MessageRepository;
import com.assistant.Rag.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final RestTemplate restTemplate;
    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${flask.api.url:http://localhost:5001}")
    private String flaskApiUrl;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable")));
    }

    @PutMapping("/users/{id}/promote")
    public ResponseEntity<User> promoteUser(@PathVariable Long id) {
        User user = findUser(id);
        user.setRole("ADMIN");
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/users/{id}/demote")
    public ResponseEntity<User> demoteUser(@PathVariable Long id) {
        User user = findUser(id);
        user.setRole("USER");
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("Utilisateur introuvable");
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalAdmins", userRepository.countByRole("ADMIN"));
        stats.put("totalConversations", conversationRepository.count());
        stats.put("totalMessages", messageRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/feedback")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getFeedback() {
        Map<Integer, Long> distribution = new TreeMap<>();
        for (int stars = 1; stars <= 5; stars++) {
            distribution.put(stars, 0L);
        }
        for (Object[] row : messageRepository.countRatingsByValue()) {
            distribution.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        List<Map<String, Object>> recent = new ArrayList<>();
        for (Message message : messageRepository.findTop20ByRatingIsNotNullOrderByRatedAtDesc()) {
            Map<String, Object> item = new HashMap<>();
            item.put("messageId", message.getId());
            item.put("rating", message.getRating());
            item.put("ratedAt", message.getRatedAt());
            item.put("answer", excerpt(message.getContent(), 260));
            item.put("user", message.getConversation().getOwner().getFullName());
            recent.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("count", messageRepository.countByRatingIsNotNull());
        Double average = messageRepository.getAverageRating();
        response.put("average", average == null ? 0.0 : Math.round(average * 100.0) / 100.0);
        response.put("distribution", distribution);
        response.put("recent", recent);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getDocuments() {
        try {
            return ResponseEntity.ok(restTemplate.getForObject(flaskUrl("/api/admin/documents"), Map.class));
        } catch (Exception exception) {
            log.warn("Could not fetch document list from RAG service", exception);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Impossible de contacter le service documentaire",
                    "documents", List.of(),
                    "count", 0
            ));
        }
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            Resource resource = file.getResource();
            body.add("file", resource);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            RestTemplate uploadClient = restTemplateBuilder
                    .connectTimeout(Duration.ofSeconds(5))
                    .readTimeout(Duration.ofMinutes(10))
                    .build();
            return ResponseEntity.ok(uploadClient.postForObject(
                    flaskUrl("/api/admin/documents/upload"), new HttpEntity<>(body, headers), Map.class));
        } catch (Exception exception) {
            log.error("Could not upload a document to the RAG service", exception);
            return ResponseEntity.internalServerError().body(Map.of("error", "Échec de l'envoi du document"));
        }
    }

    @DeleteMapping("/documents/{filename}")
    public ResponseEntity<?> deleteDocument(@PathVariable String filename) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(flaskUrl("/api/admin/documents"))
                    .pathSegment(filename)
                    .build()
                    .encode()
                    .toUri();
            restTemplate.delete(uri);
            return ResponseEntity.noContent().build();
        } catch (Exception exception) {
            log.error("Could not delete document {}", filename, exception);
            return ResponseEntity.internalServerError().body(Map.of("error", "Échec de la suppression du document"));
        }
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        return proxyGet("/api/admin/metrics", "Impossible de récupérer les métriques");
    }

    @PostMapping("/pipeline/ingest")
    public ResponseEntity<?> triggerIngestion() {
        try {
            RestTemplate ingestionClient = restTemplateBuilder
                    .connectTimeout(Duration.ofSeconds(5))
                    .readTimeout(Duration.ofMinutes(31))
                    .build();
            return ResponseEntity.ok(ingestionClient.postForObject(
                    flaskUrl("/api/admin/pipeline/ingest"), null, Map.class));
        } catch (Exception exception) {
            log.error("Could not start PDF ingestion", exception);
            return ResponseEntity.internalServerError().body(Map.of("error", "Échec du lancement de l'ingestion"));
        }
    }

    @GetMapping("/pipeline/status")
    public ResponseEntity<?> getPipelineStatus() {
        return proxyGet("/api/admin/pipeline/status", "Impossible de récupérer le statut du pipeline");
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
    }

    private ResponseEntity<?> proxyGet(String endpoint, String errorMessage) {
        try {
            return ResponseEntity.ok(restTemplate.getForObject(flaskUrl(endpoint), Map.class));
        } catch (Exception exception) {
            log.warn("Could not reach RAG service at {}", endpoint, exception);
            return ResponseEntity.internalServerError().body(Map.of("error", errorMessage));
        }
    }

    private String flaskUrl(String endpoint) {
        return flaskApiUrl.replaceAll("/+$", "") + "/" + endpoint.replaceAll("^/+", "");
    }

    private String excerpt(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text == null ? "" : text;
        }
        return text.substring(0, maxLength).trim() + "…";
    }
}
