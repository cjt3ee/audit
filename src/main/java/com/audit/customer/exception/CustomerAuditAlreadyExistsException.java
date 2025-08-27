package com.audit.customer.exception;

public class CustomerAuditAlreadyExistsException extends RuntimeException {
    
    public CustomerAuditAlreadyExistsException(String message) {
        super(message);
    }
    
    public CustomerAuditAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}