package com.example.microplan.repository;

import com.example.microplan.model.Credor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CredorRepository extends JpaRepository<Credor, Long> {
	Optional<Credor> findFirstByNome(String nome);
}
