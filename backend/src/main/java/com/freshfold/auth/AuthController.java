package com.freshfold.auth;

import com.freshfold.auth.AuthDtos.AuthResponse;
import com.freshfold.auth.AuthDtos.LoginRequest;
import com.freshfold.auth.AuthDtos.SignupRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse signup(@Valid @RequestBody SignupRequest request) { return auth.signup(request); }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) { return auth.login(request); }

    @GetMapping("/me")
    AuthUser me(@AuthenticationPrincipal AuthUser user) { return user; }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        auth.logout(bearer(authorization));
    }

    private String bearer(String header) {
        return header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
    }
}
