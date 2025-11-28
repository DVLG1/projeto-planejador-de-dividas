package com.example.microplan.controller;

import com.example.microplan.model.Divida;
import com.example.microplan.model.Pagamento;
import com.example.microplan.dto.response.PagamentoResponse;
import com.example.microplan.repository.DividaRepository;
import com.example.microplan.repository.PagamentoRepository;
import com.example.microplan.service.DividaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pagamentos")
public class PagamentoController {

    private final PagamentoRepository pagamentoRepo;
    private final DividaRepository dividaRepo;
    private final DividaService dividaService;

    public PagamentoController(PagamentoRepository pagamentoRepo,
                               DividaRepository dividaRepo,
                               DividaService dividaService) {
        this.pagamentoRepo = pagamentoRepo;
        this.dividaRepo = dividaRepo;
        this.dividaService = dividaService;
    }

    @GetMapping
    public List<PagamentoResponse> listar() {
        return pagamentoRepo.findAll().stream().map(PagamentoResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagamentoResponse> buscar(@PathVariable Long id) {
        Optional<Pagamento> p = pagamentoRepo.findById(id);
        return p.map(x -> ResponseEntity.ok(PagamentoResponse.from(x))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Pagamento p) {
        try {
            if (p.getDivida() == null || p.getDivida().getId() == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Pagamento precisa referenciar divida.id"));
            }
            Long dividaId = p.getDivida().getId();
            Divida d = dividaRepo.findById(dividaId).orElseThrow(() -> new Exception("Dívida não encontrada"));
            // atribui a divida completa ao pagamento
            p.setDivida(d);
            // atribui o usuario da divida ao pagamento
            p.setUsuario(d.getUsuario());
            if (p.getData() == null) p.setData(LocalDateTime.now());
            Pagamento salvo = pagamentoRepo.save(p);
            // aplicar o pagamento na dívida
            dividaService.aplicarPagamento(salvo);
            return ResponseEntity.ok(PagamentoResponse.from(salvo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        if (!pagamentoRepo.existsById(id)) return ResponseEntity.notFound().build();
        pagamentoRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
