package com.example.microplan.repository;

import com.example.microplan.model.Divida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DividaRepository extends JpaRepository<Divida, Long> {
    List<Divida> findByUsuarioId(Long usuarioId);

    @Query("select d from Divida d join fetch d.usuario u left join fetch d.credor c")
    List<Divida> findAllWithUsuarioAndCredor();

    @Query("select d from Divida d join fetch d.usuario u left join fetch d.credor c where u.id = :usuarioId")
    List<Divida> findByUsuarioIdWithUsuarioAndCredor(@Param("usuarioId") Long usuarioId);
}
