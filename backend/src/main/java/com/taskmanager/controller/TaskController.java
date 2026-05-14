package com.taskmanager.controller;

import com.taskmanager.dto.request.StatusUpdateRequest;
import com.taskmanager.dto.request.TaskRequest;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.entity.User;
import com.taskmanager.service.TaskService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId,
                                                                 @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, user));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long projectId,
                                                    @Valid @RequestBody TaskRequest request,
                                                    @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(projectId, request, user));
    }

    @GetMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.getTask(id, user));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id,
                                                    @Valid @RequestBody TaskRequest request,
                                                    @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.updateTask(id, request, user));
    }

    @PatchMapping("/api/tasks/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id,
                                                      @Valid @RequestBody StatusUpdateRequest request,
                                                      @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.updateStatus(id, request, user));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        taskService.deleteTask(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/tasks/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.getMyTasks(user));
    }

    @GetMapping("/api/tasks/overdue")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.getEntityByEmail(ud.getUsername());
        return ResponseEntity.ok(taskService.getOverdueTasks(user));
    }
}
