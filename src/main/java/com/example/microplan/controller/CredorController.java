package com.example.microplan.controller;

import com.example.microplan.model.Credor;
import com.example.microplan.dto.response.CredorResponse;
import com.example.microplan.repository.CredorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/credores")
public class CredorController {

    private final CredorRepository credorRepo;

    public CredorController(CredorRepository credorRepo) {
        this.credorRepo = credorRepo;
    }

    @GetMapping
    public List<CredorResponse> listar() {
        return credorRepo.findAll().stream().map(CredorResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CredorResponse> buscar(@PathVariable Long id) {
        Optional<Credor> c = credorRepo.findById(id);
        return c.map(x -> ResponseEntity.ok(CredorResponse.from(x)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Credor> criar(@RequestBody Credor credor) {
        Credor salvo = credorRepo.save(credor);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Credor> atualizar(@PathVariable Long id, @RequestBody Credor dados) {
        return credorRepo.findById(id).map(c -> {
            c.setNome(dados.getNome());
            c.setContato(dados.getContato());
            credorRepo.save(c);
            return ResponseEntity.ok(c);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        if (!credorRepo.existsById(id)) return ResponseEntity.notFound().build();
        credorRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
