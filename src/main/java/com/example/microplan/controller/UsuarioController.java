package com.example.microplan.controller;

import com.example.microplan.dto.response.UsuarioResponse;
import com.example.microplan.model.Usuario;
import com.example.microplan.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
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
            @Positive(message = "rendaMensal deve ser positiva") java.math.BigDecimal rendaMensal
    ) {}

    private record UpdateUsuarioRequest(
            String nome,
            @Email(message = "email inválido") String email,
            @Positive(message = "rendaMensal deve ser positiva") java.math.BigDecimal rendaMensal
    ) {}

    private final UsuarioRepository usuarioRepo;

    public UsuarioController(UsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
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

    @PostMapping
    @Operation(summary = "Criar usuário")
    @ApiResponse(responseCode = "201", description = "Criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
    public ResponseEntity<?> criar(@Valid @RequestBody CreateUsuarioRequest req) {
        Optional<Usuario> existing = usuarioRepo.findByEmail(req.email());
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "email já cadastrado"));
        }
        try {
            Usuario u = new Usuario();
            u.setNome(req.nome());
            u.setEmail(req.email());
            u.setRendaMensal(req.rendaMensal());
            Usuario salvo = usuarioRepo.save(u);
            URI location = URI.create("/api/usuarios/" + salvo.getId());
            return ResponseEntity.created(location).body(UsuarioResponse.from(salvo));
        } catch (DataIntegrityViolationException dive) {
            return ResponseEntity.badRequest().body(Map.of("error", "violação de integridade: " + dive.getMostSpecificCause().getMessage()));
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
}
