package com.example.insightflowbackend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String username;

    @JsonProperty("current_password")
    @JsonAlias({"currentPassword"})
    private String currentPassword;

    @JsonProperty("new_password")
    @JsonAlias({"newPassword"})
    private String newPassword;
}
