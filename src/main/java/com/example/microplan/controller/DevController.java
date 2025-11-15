package com.example.microplan.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

@Controller
public class DevController {

    @GetMapping("/dev")
    public String devLoginPage() {
        return "dev-login";
    }

    @PostMapping("/dev/login")
    public String authenticate(@RequestParam String username,
                             @RequestParam String password,
                             HttpSession session,
                             Map<String, Object> model) {

        if ("admin".equals(username) && "admin123".equals(password)) {
            session.setAttribute("devAuthenticated", true);
            return "redirect:/dev/dashboard";
        } else {
            model.put("error", "Credenciais inválidas");
            return "dev-login";
        }
    }

    @GetMapping("/dev/dashboard")
    public String devDashboard(HttpSession session) {
        Boolean authenticated = (Boolean) session.getAttribute("devAuthenticated");
        if (authenticated == null || !authenticated) {
            return "redirect:/dev";
        }
        return "dev-dashboard";
    }

    @GetMapping("/dev/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/dev";
    }
}
