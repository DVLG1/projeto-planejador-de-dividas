package com.example.microplan.controller;

import com.example.microplan.model.Divida;
import com.example.microplan.service.SerasaImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mock/serasa")
public class SerasaMockController {

    private final SerasaImportService serasaImportService;

    public SerasaMockController(SerasaImportService serasaImportService) {
        this.serasaImportService = serasaImportService;
    }

    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<Map<String,Object>> consultaCpf(@PathVariable String cpf) {
        List<Map<String, Object>> dividas = serasaImportService.generateMockDividas(cpf);
        int score = serasaImportService.getScore(cpf);
        var resp = Map.of(
            "cpf", cpf,
            "score", score,
            "lista_negativada", false,
            "dividas", dividas
        );

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/import")
    public ResponseEntity<?> importarPorCpf(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("cpf") || !body.containsKey("usuarioId")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Campos 'cpf' e 'usuarioId' são obrigatórios"));
            }

            String cpf = (String) body.get("cpf");
            Object uidObj = body.get("usuarioId");
            Long usuarioId;
            if (uidObj instanceof Number) {
                usuarioId = ((Number) uidObj).longValue();
            } else {
                usuarioId = Long.parseLong(uidObj.toString());
            }

            List<Divida> imported = serasaImportService.importarPorCpf(cpf, usuarioId);
            return ResponseEntity.ok(imported);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
