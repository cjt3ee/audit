package com.audit.customer.controller;

import com.audit.customer.dto.ApiResponse;
import com.audit.customer.dto.CustomerQuestionnaireRequest;
import com.audit.customer.exception.CustomerAlreadyExistsException;
import com.audit.customer.service.CustomerQuestionnaireService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerQuestionnaireController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerQuestionnaireController.class);

    @Autowired
    private CustomerQuestionnaireService customerQuestionnaireService;

    @PostMapping("/questionnaire")
    public ResponseEntity<ApiResponse<Long>> submitQuestionnaire(
            @Valid @RequestBody CustomerQuestionnaireRequest request,
            BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder();
            bindingResult.getFieldErrors().forEach(error ->
                errorMsg.append(error.getDefaultMessage()).append("; ")
            );
            logger.warn("Validation failed: {}", errorMsg.toString());
            return ResponseEntity.badRequest().body(ApiResponse.error(errorMsg.toString()));
        }

        try {
            Long customerId = customerQuestionnaireService.createCustomerQuestionnaire(request);
            logger.info("Customer questionnaire created successfully with ID: {}", customerId);
            return ResponseEntity.ok(ApiResponse.success("问卷提交成功", customerId));
        } catch (CustomerAlreadyExistsException e) {
            logger.warn("Customer already exists: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating customer questionnaire", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
}