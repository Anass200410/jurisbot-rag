package com.assistant.Rag.service.impl;

import com.assistant.Rag.entity.User;
import com.assistant.Rag.exception.ResourceNotFoundException;
import com.assistant.Rag.repository.UserRepository;
import com.assistant.Rag.service.UserService;
import com.assistant.Rag.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return findByEmail(email);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + email));
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}