package com.freshfold.auth;

import com.freshfold.auth.AuthDtos.AuthResponse;
import com.freshfold.auth.AuthDtos.LoginRequest;
import com.freshfold.auth.AuthDtos.SignupRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder passwords) {
        this.jdbc = jdbc;
        this.passwords = passwords;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        try {
            jdbc.update("insert into users(name, email, password_hash, role) values (?, ?, ?, 'CUSTOMER')",
                    request.name().trim(), email, passwords.encode(request.password()));
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return issueToken(findByEmail(email));
    }

    public AuthResponse login(LoginRequest request) {
        var account = jdbc.query("select id, name, email, password_hash, role from users where email = ?",
                (row, number) -> new Account(row.getLong("id"), row.getString("name"), row.getString("email"),
                        row.getString("password_hash"), row.getString("role")),
                request.email().trim().toLowerCase(Locale.ROOT)).stream().findFirst()
                .orElseThrow(() -> unauthorized());
        if (!passwords.matches(request.password(), account.passwordHash())) throw unauthorized();
        return issueToken(account);
    }

    public AuthUser authenticate(String rawToken) {
        return jdbc.query("""
                select u.id, u.name, u.email, u.role
                from auth_tokens t join users u on u.id = t.user_id
                where t.token_hash = ? and t.expires_at > current_timestamp
                """, (row, number) -> new AuthUser(row.getLong("id"), row.getString("name"),
                row.getString("email"), row.getString("role")), hash(rawToken)).stream().findFirst().orElse(null);
    }

    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) jdbc.update("delete from auth_tokens where token_hash = ?", hash(rawToken));
    }

    private Account findByEmail(String email) {
        return jdbc.queryForObject("select id, name, email, password_hash, role from users where email = ?",
                (row, number) -> new Account(row.getLong("id"), row.getString("name"), row.getString("email"),
                        row.getString("password_hash"), row.getString("role")), email);
    }

    private AuthResponse issueToken(Account account) {
        String token = UUID.randomUUID() + "." + UUID.randomUUID();
        jdbc.update("delete from auth_tokens where expires_at <= current_timestamp");
        jdbc.update("insert into auth_tokens(user_id, token_hash, expires_at) values (?, ?, ?)",
                account.id(), hash(token), LocalDateTime.now().plusDays(30));
        return new AuthResponse(token, new AuthUser(account.id(), account.name(), account.email(), account.role()));
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record Account(Long id, String name, String email, String passwordHash, String role) {}
}
