package com.example.microplan.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Microplan API")
                        .version("0.0.1")
                        .description("API para o Microplan - planejador de dívidas. Endpoints para usuários, credores, dívidas, pagamentos e geração de planos.")
                        .contact(new Contact().name("Microplan Dev").email("devnull@example.local"))
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT"))
                );
    }
}
