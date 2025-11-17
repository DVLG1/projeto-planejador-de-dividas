package com.example.microplan.service;
import java.math.RoundingMode;
import com.example.microplan.model.Divida;
import com.example.microplan.model.Pagamento;
import com.example.microplan.repository.DividaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class DividaService {

    private final DividaRepository dividaRepo;

    public DividaService(DividaRepository dividaRepo) {
        this.dividaRepo = dividaRepo;
    }

    public Divida salvar(Divida d) {
        // normaliza valores null
        if (d.getSaldoAtual() == null) d.setSaldoAtual(BigDecimal.ZERO);
        if (d.getParcelaMinima() == null) d.setParcelaMinima(BigDecimal.ZERO);
        if (d.getTaxaJurosAnual() == null) d.setTaxaJurosAnual(BigDecimal.ZERO);
        return dividaRepo.save(d);
    }

    public Optional<Divida> buscarPorId(Long id) {
        return dividaRepo.findById(id);
    }

    public List<Divida> listarPorUsuario(Long usuarioId) {
        return dividaRepo.findByUsuarioId(usuarioId);
    }

    @Transactional
    public Divida aplicarPagamento(Pagamento pagamento) throws Exception {
        if (pagamento.getDivida() == null || pagamento.getDivida().getId() == null) {
            throw new Exception("Pagamento deve referenciar uma divida existente");
        }
        Long dividaId = pagamento.getDivida().getId();
        Divida d = dividaRepo.findById(dividaId).orElseThrow(() -> new Exception("Dívida não encontrada"));
        BigDecimal valor = pagamento.getValor() == null ? BigDecimal.ZERO : pagamento.getValor();
        // valida se o valor é maior que o saldo
        if (d.getSaldoAtual() == null) d.setSaldoAtual(BigDecimal.ZERO);
        if (valor.compareTo(d.getSaldoAtual()) > 0) {
            throw new Exception("Valor do pagamento maior que o saldo da dívida");
        }

        // subtrai valor do saldo (com escala correta)
        BigDecimal novoSaldo = d.getSaldoAtual().subtract(valor).setScale(2, RoundingMode.HALF_UP);

        if (novoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
            // se zera a dívida, remove do banco sem salvar duas vezes
            dividaRepo.deleteById(dividaId);
            d.setSaldoAtual(BigDecimal.ZERO);
            return d;
        } else {
            d.setSaldoAtual(novoSaldo);
            return dividaRepo.save(d);
        }
    }

    public void apagar(Long id) {
        dividaRepo.deleteById(id);
    }
}
