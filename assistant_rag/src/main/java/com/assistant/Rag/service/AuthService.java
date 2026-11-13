package com.assistant.Rag.service;


import com.assistant.Rag.dto.request.LoginRequest;
import com.assistant.Rag.dto.request.RegisterRequest;
import com.assistant.Rag.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void changePassword(String oldPassword, String newPassword);
}
