package com.taskmanager.service;

import com.taskmanager.dto.response.DashboardStatsResponse;
import com.taskmanager.dto.response.ProjectResponse;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.entity.*;
import com.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;

    public DashboardStatsResponse getStats(User user) {
        List<Project> projects = user.getRole() == User.Role.ADMIN
                ? projectRepository.findAll()
                : projectRepository.findAllProjectsForUser(user);

        List<Task> allTasks = user.getRole() == User.Role.ADMIN
                ? taskRepository.findAll()
                : taskRepository.findByAssignee(user);

        long total = allTasks.size();
        long completed = allTasks.stream().filter(t -> t.getStatus() == Task.Status.DONE).count();
        long inProgress = allTasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        long review = allTasks.stream().filter(t -> t.getStatus() == Task.Status.REVIEW).count();
        long todo = allTasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count();
        long overdue = allTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()) && t.getStatus() != Task.Status.DONE)
                .count();

        double completionRate = total > 0 ? (double) completed / total * 100 : 0;

        List<TaskResponse> recentTasks = allTasks.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(8)
                .map(TaskResponse::from)
                .collect(Collectors.toList());

        List<TaskResponse> overdueList = allTasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()) && t.getStatus() != Task.Status.DONE)
                .map(TaskResponse::from)
                .collect(Collectors.toList());

        List<ProjectResponse> projectResponses = projects.stream()
                .map(p -> {
                    long ptotal = taskRepository.countByProject(p);
                    long pcomplete = taskRepository.countByProjectAndStatus(p, Task.Status.DONE);
                    int members = memberRepository.findByProject(p).size();
                    ProjectResponse pr = ProjectResponse.from(p);
                    pr.setTotalTasks((int) ptotal);
                    pr.setCompletedTasks((int) pcomplete);
                    pr.setMemberCount(members);
                    return pr;
                })
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalProjects(projects.size())
                .totalTasks(total)
                .completedTasks(completed)
                .inProgressTasks(inProgress)
                .reviewTasks(review)
                .todoTasks(todo)
                .overdueTasks(overdue)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .myRecentTasks(recentTasks)
                .myProjects(projectResponses)
                .overdueTasksList(overdueList)
                .build();
    }
}
