package com.example.microplan.controller;

import com.example.microplan.dto.response.UsuarioResponse;
import com.example.microplan.model.Usuario;
import com.example.microplan.repository.UsuarioRepository;
import com.example.microplan.service.FinancialHealthService;
import com.example.microplan.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
// imports cleaned: removed unused pagination and DataIntegrity imports
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
// BigDecimal referenced via fully-qualified name in records; top-level import not required
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
@Validated
@CrossOrigin
public class UsuarioController {

        private record CreateUsuarioRequest(
            @NotBlank(message = "nome é obrigatório") String nome,
            @NotBlank(message = "email é obrigatório") @Email(message = "email inválido") String email,
            @NotBlank(message = "senha é obrigatória") String senha,
            @Positive(message = "rendaMensal deve ser positiva") java.math.BigDecimal rendaMensal,
            String cpf
        ) {}

        private record LoginRequest(
            @NotBlank(message = "email é obrigatório") String email,
            @NotBlank(message = "senha é obrigatória") String senha
        ) {}

    private record UpdateUsuarioRequest(
            String nome,
            @Email(message = "email inválido") String email,
            @Positive(message = "rendaMensal deve ser positiva") java.math.BigDecimal rendaMensal
    ) {}

    private final UsuarioRepository usuarioRepo;
    private final UsuarioService usuarioService;
    private final FinancialHealthService financialHealthService;

    public UsuarioController(UsuarioRepository usuarioRepo, UsuarioService usuarioService, FinancialHealthService financialHealthService) {
        this.usuarioRepo = usuarioRepo;
        this.usuarioService = usuarioService;
        this.financialHealthService = financialHealthService;
    }

    @GetMapping
    @Operation(summary = "Listar usuários")
    public ResponseEntity<List<UsuarioResponse>> listar() {
        List<UsuarioResponse> usuarios = usuarioRepo.findAll().stream().map(UsuarioResponse::from).toList();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por ID")
    @ApiResponse(responseCode = "200", description = "Usuário encontrado",
            content = @Content(schema = @Schema(implementation = UsuarioResponse.class)))
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    public ResponseEntity<UsuarioResponse> buscar(@PathVariable Long id) {
        Optional<Usuario> u = usuarioRepo.findById(id);
        return u.map(x -> ResponseEntity.ok(UsuarioResponse.from(x)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar novo usuário")
    @ApiResponse(responseCode = "201", description = "Usuário registrado com sucesso")
    @ApiResponse(responseCode = "409", description = "Email já cadastrado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    public ResponseEntity<?> registrar(@Valid @RequestBody CreateUsuarioRequest req) {
        try {
                Usuario salvo = usuarioService.registrarUsuario(req.nome(), req.email(), req.senha(), req.rendaMensal(), req.cpf());
            return ResponseEntity.created(URI.create("/api/usuarios/" + salvo.getId()))
                    .body(Map.of("message", "Usuário registrado com sucesso", "user", UsuarioResponse.from(salvo)));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email já cadastrado")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "email já cadastrado"));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Erro ao registrar usuário: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login de usuário")
    @ApiResponse(responseCode = "200", description = "Login realizado com sucesso")
    @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            Optional<Usuario> usuarioOpt = usuarioService.autenticarUsuario(req.email(), req.senha());
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                return ResponseEntity.ok(Map.of(
                    "message", "Login realizado com sucesso",
                    "user", UsuarioResponse.from(usuario)
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Email ou senha incorretos"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Erro no login: " + e.getMessage()));
        }
    }

    @PostMapping
    @Operation(summary = "Criar usuário (deprecated - usar /register)")
    @ApiResponse(responseCode = "201", description = "Criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    public ResponseEntity<?> criar(@Valid @RequestBody CreateUsuarioRequest req) {
        try {
            Usuario salvo = usuarioService.registrarUsuario(req.nome(), req.email(), req.senha(), req.rendaMensal(), req.cpf());
            URI location = URI.create("/api/usuarios/" + salvo.getId());
            return ResponseEntity.created(location).body(UsuarioResponse.from(salvo));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email já cadastrado")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "email já cadastrado"));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Erro ao criar conta: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar usuário")
    @ApiResponse(responseCode = "200", description = "Atualizado")
    @ApiResponse(responseCode = "404", description = "Não encontrado")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody UpdateUsuarioRequest dados) {
        return usuarioRepo.findById(id).map(u -> {
            if (dados.email() != null && !dados.email().equals(u.getEmail())) {
                Optional<Usuario> byEmail = usuarioRepo.findByEmail(dados.email());
                if (byEmail.isPresent() && !byEmail.get().getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "email já cadastrado por outro usuário"));
                }
                u.setEmail(dados.email());
            }
            if (dados.nome() != null) u.setNome(dados.nome());
            if (dados.rendaMensal() != null) u.setRendaMensal(dados.rendaMensal());
            usuarioRepo.save(u);
            return ResponseEntity.ok(UsuarioResponse.from(u));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Apagar usuário")
    @ApiResponse(responseCode = "204", description = "Apagado")
    @ApiResponse(responseCode = "404", description = "Não encontrado")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        if (!usuarioRepo.existsById(id)) return ResponseEntity.notFound().build();
        usuarioRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/score-saude-financeira")
    @Operation(summary = "Calcular Score de Saúde Financeira")
    @ApiResponse(responseCode = "200", description = "Score calculado")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    public ResponseEntity<Map<String, Object>> calcularScoreSaudeFinanceira(@PathVariable Long id) {
        if (!usuarioRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            int score = financialHealthService.calcularScoreSaudeFinanceira(id);
            return ResponseEntity.ok(Map.of(
                "usuarioId", id,
                "score", score,
                "classificacao", classificarScore(score)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String classificarScore(int score) {
        if (score >= 80) return "Excelente";
        else if (score >= 60) return "Bom";
        else if (score >= 40) return "Ruim";
        else if (score >= 20) return "Crítico";
        else return "Extremo";
    }
}
