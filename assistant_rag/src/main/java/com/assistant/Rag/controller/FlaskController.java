package com.assistant.Rag.controller;

import com.assistant.Rag.service.FlaskClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/flask")
@RequiredArgsConstructor
public class FlaskController {

    private final FlaskClient flaskClient;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        boolean isHealthy = flaskClient.healthCheck();

        response.put("status", isHealthy ? "connected" : "disconnected");
        if (isHealthy) {
            response.put("message", "Flask is running");
        } else {
            response.put("message", "Flask is not responding");
        }

        return ResponseEntity.ok(response);
    }
}
