package com.audit.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class AuditConsumerApplication {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditConsumerApplication.class);
    
    public static void main(String[] args) {
        logger.info("🚀 Starting Audit Consumer Service...");
        SpringApplication.run(AuditConsumerApplication.class, args);
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        logger.info("===============================================");
        logger.info("🎉 AUDIT CONSUMER SERVICE STARTED SUCCESSFULLY");
        logger.info("===============================================");
        logger.info("✅ Kafka Consumer is ready to process messages");
        logger.info("📡 Listening on topic: user_audit_form_topic");
        logger.info("🤖 DeepSeek AI integration enabled");
        logger.info("💾 Database connection established");
        logger.info("🔍 Ready to process audit form messages...");
        logger.info("===============================================");
    }
}