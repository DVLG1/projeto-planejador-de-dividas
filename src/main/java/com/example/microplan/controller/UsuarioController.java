package com.example.microplan.controller;

import com.example.microplan.model.Usuario;
import com.example.microplan.dto.response.UsuarioResponse;
import com.example.microplan.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepo;

    public UsuarioController(UsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioRepo.findAll().stream().map(UsuarioResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> buscar(@PathVariable Long id) {
        Optional<Usuario> u = usuarioRepo.findById(id);
        return u.map(x -> ResponseEntity.ok(UsuarioResponse.from(x)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Usuario usuario) {
        // basic validation: email required
        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email é obrigatório"));
        }

        // check duplicate email
        Optional<Usuario> existing = usuarioRepo.findByEmail(usuario.getEmail());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email já cadastrado"));
        }

        try {
            Usuario salvo = usuarioRepo.save(usuario);
            return ResponseEntity.ok(salvo);
        } catch (DataIntegrityViolationException dive) {
            return ResponseEntity.badRequest().body(Map.of("error", "violação de integridade: " + dive.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Usuario dados) {
        return usuarioRepo.findById(id).map(u -> {
            if (dados.getEmail() != null && !dados.getEmail().equals(u.getEmail())) {
                Optional<Usuario> byEmail = usuarioRepo.findByEmail(dados.getEmail());
                if (byEmail.isPresent() && !byEmail.get().getId().equals(id)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "email já cadastrado por outro usuário"));
                }
                u.setEmail(dados.getEmail());
            }
            u.setNome(dados.getNome());
            u.setRendaMensal(dados.getRendaMensal());
            usuarioRepo.save(u);
            return ResponseEntity.ok(u);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        if (!usuarioRepo.existsById(id)) return ResponseEntity.notFound().build();
        usuarioRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
