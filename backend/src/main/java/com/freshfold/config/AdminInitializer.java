package com.freshfold.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;
    private final String email;
    private final String password;

    public AdminInitializer(JdbcTemplate jdbc, PasswordEncoder passwords,
                            @Value("${app.admin.email:admin@freshfold.in}") String email,
                            @Value("${app.admin.password:Admin@123}") String password) {
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer count = jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, email);
        if (count != null && count == 0) {
            jdbc.update("insert into users(name, email, password_hash, role) values ('FreshFold Admin', ?, ?, 'ADMIN')",
                    email, passwords.encode(password));
        }
    }
}
