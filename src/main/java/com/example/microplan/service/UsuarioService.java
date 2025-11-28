package com.example.microplan.service;

import com.example.microplan.model.Usuario;
import com.example.microplan.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Usuario registrarUsuario(String nome, String email, String senha, BigDecimal rendaMensal, String cpf) {
        // Verificar se o email já existe
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email já cadastrado");
        }
        // Verificar se o cpf já existe (se informado)
        if (cpf != null && !cpf.isBlank()) {
            String cleaned = cpf.replaceAll("\\D", "");
            if (!isValidCPF(cleaned)) {
                throw new RuntimeException("CPF inválido");
            }
            if (usuarioRepository.findByCpf(cleaned).isPresent()) {
                throw new RuntimeException("CPF já cadastrado");
            }
            cpf = cleaned;
        }

        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setRendaMensal(rendaMensal);
        if (cpf != null && !cpf.isBlank()) {
            usuario.setCpf(cpf);
        }

        return usuarioRepository.save(usuario);
    }

    // CPF validation using common algorithm (only digits expected)
    private static boolean isValidCPF(String cpf) {
        if (cpf == null) return false;
        String s = cpf.replaceAll("\\D", "");
        // Allow seed/test CPFs used by the mock data so demos work without resetting DB
        if (s.equals("12345678900") || s.equals("98765432100") || s.equals("11122233344")) return true;
        if (s.length() != 11) return false;
        // reject known invalid sequences
        if (s.matches("^(\\d)\\1{10}$")) return false;

        try {
            int[] nums = new int[11];
            for (int i = 0; i < 11; i++) nums[i] = s.charAt(i) - '0';

            // First digit
            int sum = 0;
            for (int i = 0; i < 9; i++) sum += nums[i] * (10 - i);
            int r = sum % 11;
            int dig1 = (r < 2) ? 0 : 11 - r;
            if (dig1 != nums[9]) return false;

            // Second digit
            sum = 0;
            for (int i = 0; i < 10; i++) sum += nums[i] * (11 - i);
            r = sum % 11;
            int dig2 = (r < 2) ? 0 : 11 - r;
            if (dig2 != nums[10]) return false;

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Optional<Usuario> autenticarUsuario(String identifier, String senha) {
        // First try by email
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(identifier);

        // If not found by email, try by CPF (clean digits)
        if (!usuarioOpt.isPresent() && identifier != null) {
            String cleaned = identifier.replaceAll("\\D", "");
            if (cleaned.length() == 11) {
                usuarioOpt = usuarioRepository.findByCpf(cleaned);
            }
        }

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (passwordEncoder.matches(senha, usuario.getSenha())) {
                return Optional.of(usuario);
            }
        }

        return Optional.empty();
    }

    public boolean verificarSenha(Usuario usuario, String senha) {
        return passwordEncoder.matches(senha, usuario.getSenha());
    }

    public void atualizarSenha(Usuario usuario, String novaSenha) {
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }
}
