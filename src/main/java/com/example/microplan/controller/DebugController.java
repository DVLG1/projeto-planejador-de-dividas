package com.example.microplan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @PostMapping("/echo")
    public ResponseEntity<Map<String,Object>> echo(@RequestBody Map<String,Object> body) {
        // só retorna o que chegou para inspecionar
        return ResponseEntity.ok(body);
    }
}
