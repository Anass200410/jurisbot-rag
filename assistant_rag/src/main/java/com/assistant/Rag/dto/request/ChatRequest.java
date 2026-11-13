package com.assistant.Rag.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;

    @NotBlank(message = "La question est obligatoire")
    @Size(max = 4000, message = "La question ne peut pas dépasser 4000 caractères")
    private String question;

    @Pattern(regexp = "fr|ar|en", message = "Langue non prise en charge")
    private String language = "fr";
}
