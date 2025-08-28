package com.audit.customer.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class HttpsConfig {
    // 简化配置，只使用application.yml中的SSL设置
    // HTTP到HTTPS的重定向由Spring Boot自动处理
}