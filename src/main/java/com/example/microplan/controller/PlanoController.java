package com.example.microplan.controller;

import com.example.microplan.dto.GeneratePlanRequest;
import com.example.microplan.model.PlanoQuitacao;
import com.example.microplan.dto.response.PlanoQuitacaoResponse;
import com.example.microplan.service.PlanoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
            return ResponseEntity.ok(PlanoQuitacaoResponse.from(p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PlanoQuitacaoResponse>> porUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(planoService.buscarPorUsuario(usuarioId).stream().map(PlanoQuitacaoResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        return planoService.buscarPorId(id)
                .map(PlanoQuitacaoResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarERecalcular(@PathVariable Long id,
                                                  @RequestBody Map<String, Object> body) {
        try {
            String estrategia = body.get("estrategia") != null ? body.get("estrategia").toString() : null;
            Object v = body.get("valorDisponivelMensal");
            if (v == null) return ResponseEntity.badRequest().body(Map.of("error", "valorDisponivelMensal é obrigatório"));
            BigDecimal valor = new BigDecimal(v.toString());
            PlanoQuitacao atualizado = planoService.atualizarERecalcularPlano(id, estrategia, valor);
            return ResponseEntity.ok(PlanoQuitacaoResponse.from(atualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            planoService.deletarPlano(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
