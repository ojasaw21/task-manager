package com.taskmanager.dto.request;

import com.taskmanager.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 1000)
    private String description;

    private Project.Status status = Project.Status.ACTIVE;

    private LocalDate deadline;
}
