package com.assistant.Rag.config;

import com.assistant.Rag.entity.User;
import com.assistant.Rag.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Slf4j
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap-email:}") String email,
            @Value("${app.admin.bootstrap-password:}") String password,
            @Value("${app.admin.bootstrap-name:Administrateur}") String fullName
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(String... args) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (normalizedEmail.isBlank() || password.isBlank() || userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        userRepository.save(User.builder()
                .fullName(fullName)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(password))
                .role("ADMIN")
                .build());
        log.info("Initial administrator account created for {}", email);
    }
}
