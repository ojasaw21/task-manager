package com.taskmanager.dto.request;

import com.taskmanager.entity.Task;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    @NotNull(message = "Status is required")
    private Task.Status status;
}
