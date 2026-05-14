package com.taskmanager.service;

import com.taskmanager.dto.request.StatusUpdateRequest;
import com.taskmanager.dto.request.TaskRequest;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.entity.*;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;

    public List<TaskResponse> getTasksByProject(Long projectId, User currentUser) {
        Project project = findProject(projectId);
        checkProjectAccess(project, currentUser);
        return taskRepository.findByProject(project).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public TaskResponse getTask(Long id, User currentUser) {
        Task task = findTask(id);
        checkProjectAccess(task.getProject(), currentUser);
        return TaskResponse.from(task);
    }

    public TaskResponse createTask(Long projectId, TaskRequest request, User creator) {
        Project project = findProject(projectId);
        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + request.getAssigneeId()));
        }
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Task.Status.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : Task.Priority.MEDIUM)
                .dueDate(request.getDueDate())
                .project(project)
                .assignee(assignee)
                .createdBy(creator)
                .build();
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request, User currentUser) {
        Task task = findTask(id);
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());
        if (!isAdmin && !isAssignee) {
            throw new AccessDeniedException("You don't have permission to update this task");
        }
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long id, StatusUpdateRequest request, User currentUser) {
        Task task = findTask(id);
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());
        if (!isAdmin && !isAssignee) {
            throw new AccessDeniedException("You don't have permission to update this task's status");
        }
        task.setStatus(request.getStatus());
        return TaskResponse.from(taskRepository.save(task));
    }

    public void deleteTask(Long id, User currentUser) {
        // Secondary guard — primary gate is in SecurityConfig (hasRole ADMIN)
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can delete tasks");
        }
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found: " + id);
        }
        taskRepository.deleteById(id);
    }

    public List<TaskResponse> getMyTasks(User user) {
        return taskRepository.findByAssignee(user).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getOverdueTasks(User currentUser) {
        // Secondary guard — primary gate is in SecurityConfig (hasRole ADMIN)
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can view all overdue tasks");
        }
        return taskRepository.findOverdueTasks(LocalDate.now()).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    private void checkProjectAccess(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        boolean isMember = memberRepository.existsByProjectAndUser(project, user);
        boolean isCreator = project.getCreatedBy().getId().equals(user.getId());
        if (!isMember && !isCreator) {
            throw new AccessDeniedException("Access denied to this project");
        }
    }
}
