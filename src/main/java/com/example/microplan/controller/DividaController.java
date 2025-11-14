package com.example.microplan.controller;

import com.example.microplan.model.Divida;
import com.example.microplan.dto.response.DividaResponse;
import com.example.microplan.repository.DividaRepository;
import com.example.microplan.service.DividaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dividas")
public class DividaController {

    private final DividaRepository dividaRepo;
    private final DividaService dividaService;

    public DividaController(DividaRepository dividaRepo, DividaService dividaService) {
        this.dividaRepo = dividaRepo;
        this.dividaService = dividaService;
    }

    @GetMapping
    public List<DividaResponse> listarTodas() {
        return dividaRepo.findAll().stream().map(DividaResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DividaResponse> buscar(@PathVariable Long id) {
        Optional<Divida> d = dividaRepo.findById(id);
        return d.map(x -> ResponseEntity.ok(DividaResponse.from(x))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<DividaResponse>> porUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(dividaRepo.findByUsuarioId(usuarioId).stream().map(DividaResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Divida d) {
        try {
            Divida salvo = dividaService.salvar(d);
            return ResponseEntity.ok(DividaResponse.from(salvo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Divida dados) {
        return dividaRepo.findById(id).map(d -> {
            d.setDescricao(dados.getDescricao());
            d.setSaldoAtual(dados.getSaldoAtual());
            d.setTaxaJurosAnual(dados.getTaxaJurosAnual());
            d.setParcelaMinima(dados.getParcelaMinima());
            d.setVencimentoMensal(dados.getVencimentoMensal());
            d.setCredor(dados.getCredor());
            d.setUsuario(dados.getUsuario());
            dividaRepo.save(d);
            return ResponseEntity.ok(DividaResponse.from(d));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        if (!dividaRepo.existsById(id)) return ResponseEntity.notFound().build();
        dividaRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
