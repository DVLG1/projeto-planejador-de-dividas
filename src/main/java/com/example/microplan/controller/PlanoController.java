package com.example.microplan.controller;

import com.example.microplan.dto.GeneratePlanRequest;
import com.example.microplan.model.PlanoQuitacao;
import com.example.microplan.service.PlanoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/planos")
public class PlanoController {

    private final PlanoService planoService;

    public PlanoController(PlanoService planoService) {
        this.planoService = planoService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> gerar(@RequestBody GeneratePlanRequest req) {
        try {
            PlanoQuitacao p = planoService.gerarPlano(req);
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        return planoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PlanoQuitacao>> porUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(planoService.buscarPorUsuario(usuarioId));
    }
}
