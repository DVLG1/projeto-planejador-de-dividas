package com.example.microplan.repository;

import com.example.microplan.model.PlanoQuitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PlanoQuitacaoRepository extends JpaRepository<PlanoQuitacao, Long> {
    List<PlanoQuitacao> findByUsuarioId(Long usuarioId);

    @Query("select p from PlanoQuitacao p join fetch p.usuario u where u.id = :usuarioId")
    List<PlanoQuitacao> findByUsuarioIdWithUsuario(@Param("usuarioId") Long usuarioId);

    @Query("select p from PlanoQuitacao p join fetch p.usuario u where p.id = :id")
    Optional<PlanoQuitacao> findByIdWithUsuario(@Param("id") Long id);
}
