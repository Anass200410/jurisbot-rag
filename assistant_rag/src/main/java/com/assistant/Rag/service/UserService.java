package com.assistant.Rag.service;


import com.assistant.Rag.entity.User;

public interface UserService {
    User getCurrentUser();
    User findByEmail(String email);
    User save(User user);
    boolean existsByEmail(String email);
}
