package com.taskmanager.controller;

import com.taskmanager.dto.response.DashboardStatsResponse;
import com.taskmanager.entity.User;
import com.taskmanager.service.DashboardService;
import com.taskmanager.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(dashboardService.getStats(user));
    }
}
