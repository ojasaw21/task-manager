package com.taskmanager.dto.response;

import com.taskmanager.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Project.Status status;
    private LocalDate deadline;
    private UserResponse createdBy;
    private LocalDateTime createdAt;
    private int totalTasks;
    private int completedTasks;
    private int memberCount;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .deadline(project.getDeadline())
                .createdBy(UserResponse.from(project.getCreatedBy()))
                .createdAt(project.getCreatedAt())
                .build();
    }
}
