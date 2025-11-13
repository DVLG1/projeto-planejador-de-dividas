package com.example.microplan.repository;

import com.example.microplan.model.Divida;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DividaRepository extends JpaRepository<Divida, Long> {
    List<Divida> findByUsuarioId(Long usuarioId);
}
