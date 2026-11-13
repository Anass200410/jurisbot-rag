package com.assistant.Rag.service;

import com.assistant.Rag.dto.FlaskRequest;
import com.assistant.Rag.dto.FlaskResponse;
import com.assistant.Rag.exception.UpstreamServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class FlaskClient {

    private final RestTemplate restTemplate;

    @Value("${flask.api.url:http://localhost:5001}")
    private String flaskApiUrl;

    @Value("${flask.api.chat-endpoint:/api/chat}")
    private String chatEndpoint;

    public FlaskClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public FlaskResponse sendQuestion(String question, String language) {
        log.info("Sending question to RAG service ({} characters, language={})", question.length(), language);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<FlaskRequest> request = new HttpEntity<>(new FlaskRequest(question, language), headers);

        try {
            ResponseEntity<FlaskResponse> response = restTemplate.postForEntity(
                    url(chatEndpoint), request, FlaskResponse.class);
            FlaskResponse body = response.getBody();
            if (!response.getStatusCode().is2xxSuccessful() || body == null) {
                throw new UpstreamServiceException("Invalid response from RAG service");
            }
            return body;
        } catch (UpstreamServiceException exception) {
            throw exception;
        } catch (RestClientException exception) {
            log.warn("RAG service request failed: {}", exception.getMessage());
            throw new UpstreamServiceException("RAG service request failed", exception);
        }
    }

    public boolean healthCheck() {
        try {
            return restTemplate.getForEntity(url("/health"), String.class)
                    .getStatusCode().is2xxSuccessful();
        } catch (Exception exception) {
            log.warn("RAG service health check failed: {}", exception.getMessage());
            return false;
        }
    }

    private String url(String endpoint) {
        return flaskApiUrl.replaceAll("/+$", "") + "/" + endpoint.replaceAll("^/+", "");
    }
}
