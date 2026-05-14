package com.taskmanager.service;

import com.taskmanager.dto.request.ProjectRequest;
import com.taskmanager.dto.response.ProjectResponse;
import com.taskmanager.dto.response.UserResponse;
import com.taskmanager.entity.*;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public List<ProjectResponse> getProjectsForUser(User user) {
        List<Project> projects = user.getRole() == User.Role.ADMIN
                ? projectRepository.findAll()
                : projectRepository.findAllProjectsForUser(user);
        return projects.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProjectResponse getProject(Long id, User currentUser) {
        Project project = findProject(id);
        checkAccess(project, currentUser);
        return toResponse(project);
    }

    public ProjectResponse createProject(ProjectRequest request, User creator) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Project.Status.ACTIVE)
                .deadline(request.getDeadline())
                .createdBy(creator)
                .build();
        return toResponse(projectRepository.save(project));
    }

    public ProjectResponse updateProject(Long id, ProjectRequest request, User currentUser) {
        Project project = findProject(id);
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can update projects");
        }
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        project.setDeadline(request.getDeadline());
        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can delete projects");
        }
        Project project = findProject(id);
        projectRepository.delete(project);
    }

    @Transactional
    public void addMember(Long projectId, Long userId, User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can add members");
        }
        Project project = findProject(projectId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (memberRepository.existsByProjectAndUser(project, user)) {
            throw new IllegalArgumentException("User is already a member of this project");
        }
        memberRepository.save(ProjectMember.builder().project(project).user(user).build());
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can remove members");
        }
        Project project = findProject(projectId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        memberRepository.deleteByProjectAndUser(project, user);
    }

    public List<UserResponse> getMembers(Long projectId) {
        Project project = findProject(projectId);
        return memberRepository.findByProject(project).stream()
                .map(pm -> UserResponse.from(pm.getUser()))
                .collect(Collectors.toList());
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    private void checkAccess(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        boolean isMember = memberRepository.existsByProjectAndUser(project, user);
        boolean isCreator = project.getCreatedBy().getId().equals(user.getId());
        if (!isMember && !isCreator) {
            throw new AccessDeniedException("Access denied to this project");
        }
    }

    private ProjectResponse toResponse(Project project) {
        long total = taskRepository.countByProject(project);
        long completed = taskRepository.countByProjectAndStatus(project, Task.Status.DONE);
        int memberCount = memberRepository.findByProject(project).size();
        ProjectResponse response = ProjectResponse.from(project);
        response.setTotalTasks((int) total);
        response.setCompletedTasks((int) completed);
        response.setMemberCount(memberCount);
        return response;
    }
}
