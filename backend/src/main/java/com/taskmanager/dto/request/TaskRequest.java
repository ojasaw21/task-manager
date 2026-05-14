package com.taskmanager.dto.request;

import com.taskmanager.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(min = 2, max = 300)
    private String title;

    @Size(max = 2000)
    private String description;

    private Task.Status status = Task.Status.TODO;
    private Task.Priority priority = Task.Priority.MEDIUM;
    private LocalDate dueDate;
    private Long assigneeId;
}
