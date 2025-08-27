package com.audit.customer.dto;

import java.util.List;

public class AuditTaskResponse {
    
    private Integer auditorLevel;
    private Integer taskCount;
    private List<AuditTaskDto> tasks;
    
    public AuditTaskResponse() {}
    
    public AuditTaskResponse(Integer auditorLevel, List<AuditTaskDto> tasks) {
        this.auditorLevel = auditorLevel;
        this.tasks = tasks;
        this.taskCount = tasks != null ? tasks.size() : 0;
    }
    
    public Integer getAuditorLevel() {
        return auditorLevel;
    }
    
    public void setAuditorLevel(Integer auditorLevel) {
        this.auditorLevel = auditorLevel;
    }
    
    public Integer getTaskCount() {
        return taskCount;
    }
    
    public void setTaskCount(Integer taskCount) {
        this.taskCount = taskCount;
    }
    
    public List<AuditTaskDto> getTasks() {
        return tasks;
    }
    
    public void setTasks(List<AuditTaskDto> tasks) {
        this.tasks = tasks;
        this.taskCount = tasks != null ? tasks.size() : 0;
    }
}