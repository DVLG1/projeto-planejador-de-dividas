package com.example.microplan.repository;

import com.example.microplan.model.PlanoQuitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanoQuitacaoRepository extends JpaRepository<PlanoQuitacao, Long> {
    List<PlanoQuitacao> findByUsuarioId(Long usuarioId);
}
