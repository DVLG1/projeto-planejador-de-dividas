package com.example.microplan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mock/serasa")
public class SerasaMockController {

    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<Map<String,Object>> consultaCpf(@PathVariable String cpf) {
        var resp = Map.of(
            "cpf", cpf,
            "score", 650,
            "lista_negativada", false,
            "dividas", List.of(
                Map.of("id", 1, "credor", "Banco XPTO", "valor", 1200.00, "vencimento", "2025-10-10"),
                Map.of("id", 2, "credor", "Financeira Y", "valor", 800.00, "vencimento", "2025-12-05")
            )
        );

        return ResponseEntity.ok(resp);
    }
}
