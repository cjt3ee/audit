package com.audit.consumer.service;

import com.audit.consumer.dto.UserAuditFormMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekAiService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeepSeekAiService.class);
    private static final String DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
    
    private String apiKey = "sk-d7b633a53d034ace9a8266f25c19cbf6";
    
    @Autowired
    private ObjectMapper objectMapper;
    
    public String generateAuditStrategy(UserAuditFormMessage.FormData formData) {
        logger.info("=== STARTING DEEPSEEK AI CALL ===");
        
        try {
            logger.info("Step 1: Building prompt from form data...");
            String prompt = buildPrompt(formData);
            logger.info("  - Prompt length: {} characters", prompt.length());
            logger.info("  - Prompt preview: {}", prompt.substring(0, Math.min(150, prompt.length())) + "...");
            
            logger.info("Step 2: Building request body...");
            Map<String, Object> requestBody = buildRequestBody(prompt);
            
            String jsonRequest = objectMapper.writeValueAsString(requestBody);
            logger.info("Step 3: Sending HTTP request to DeepSeek API...");
            logger.info("  - API URL: {}", DEEPSEEK_API_URL);
            logger.info("  - Request size: {} bytes", jsonRequest.getBytes().length);
            logger.info("  - Request payload (first 200 chars): {}", jsonRequest.substring(0, Math.min(200, jsonRequest.length())));
            
            long requestStart = System.currentTimeMillis();
            
            try (CloseableHttpClient httpClient = createHttpClient()) {
                HttpPost httpPost = new HttpPost(DEEPSEEK_API_URL);
                httpPost.setHeader("Content-Type", "application/json");
                httpPost.setHeader("Authorization", "Bearer " + apiKey);
                httpPost.setEntity(new StringEntity(jsonRequest, ContentType.APPLICATION_JSON));
                
                logger.info("Step 4: Executing HTTP request...");
                try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                    long requestEnd = System.currentTimeMillis();
                    int statusCode = response.getCode();
                    String responseBody = new String(response.getEntity().getContent().readAllBytes(), "UTF-8");
                    
                    logger.info("Step 5: Received HTTP response in {}ms", (requestEnd - requestStart));
                    logger.info("  - Status Code: {}", statusCode);
                    logger.info("  - Response size: {} bytes", responseBody.getBytes().length);
                    logger.info("  - Raw response body: {}", responseBody);
                    
                    if (statusCode == 200) {
                        logger.info("Step 6: Parsing successful response...");
                        String result = parseSuccessResponse(responseBody);
                        logger.info("  - Parsed AI response: {}", result);
                        logger.info("✅ DeepSeek AI call completed successfully");
                        logger.info("=== DEEPSEEK AI CALL COMPLETE ===");
                        return result;
                    } else {
                        logger.warn("❌ DeepSeek API returned non-200 status: {}", statusCode);
                        logger.warn("Response body: {}", responseBody.substring(0, Math.min(500, responseBody.length())));
                        return "暂时繁忙，无法生成策略";
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("❌ Error calling DeepSeek API", e);
            logger.error("Exception type: {}", e.getClass().getSimpleName());
            logger.error("Exception message: {}", e.getMessage());
            return "暂时繁忙，无法生成策略";
        }
    }
    
    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 10) return "***";
        return apiKey.substring(0, 6) + "***" + apiKey.substring(apiKey.length() - 4);
    }
    
    private CloseableHttpClient createHttpClient() {
        RequestConfig config = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(15))
                .setResponseTimeout(Timeout.ofSeconds(15))
                .build();
        
        return HttpClients.custom()
                .setDefaultRequestConfig(config)
                .build();
    }
    
    private String buildPrompt(UserAuditFormMessage.FormData formData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请根据以下客户风险问卷信息，生成具体的审核策略建议：\n\n");
        prompt.append("风险评分: ").append(formData.getRiskScore()).append("\n");
        prompt.append("投资者类型: ").append(formData.getInvestorType()).append("\n");
        prompt.append("计划投资金额: ").append(formData.getInvestmentAmount()).append("元\n");
        prompt.append("年收入代码: ").append(formData.getAnnualIncome()).append("\n");
        prompt.append("可承受最大亏损比例代码: ").append(formData.getMaxLoss()).append("\n");
        
        if (formData.getCustomerAge() != null) {
            prompt.append("客户年龄: ").append(formData.getCustomerAge()).append("岁\n");
        }
        
        if (formData.getOccupation() != null && !formData.getOccupation().trim().isEmpty()) {
            prompt.append("职业: ").append(formData.getOccupation()).append("\n");
        }
        
        prompt.append("\n请提供针对性的审核建议，包括：\n");
        prompt.append("1. 重点关注的风险点\n");
        prompt.append("2. 建议的审核策略\n");
        prompt.append("3. 需要特别核实的信息\n");
        prompt.append("4. 给出推荐的风险评分（根据客户的各项信息）以及风险分类。保守型：评分< 40 稳健型: 40-69 激进型: 70-100\n" );
        prompt.append("5. 你可以修正客户自带的风险评分，判断是否准确。给出修正建议及理由\n" );
        prompt.append("请确保回复简洁明了，控制在250字以内。");
        
        return prompt.toString();
    }
    
    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-chat");
        requestBody.put("stream", false);
        
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", "您是一位专业的金融风险审核专家，请根据客户的风险问卷信息提供专业的审核策略建议。");
        
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        
        requestBody.put("messages", List.of(systemMessage, userMessage));
        
        return requestBody;
    }
    
    private String parseSuccessResponse(String responseBody) throws Exception {
        logger.info("Parsing DeepSeek API response...");
        JsonNode responseJson = objectMapper.readTree(responseBody);
        
        logger.info("Response JSON structure:");
        logger.info("  - Has 'choices' field: {}", responseJson.has("choices"));
        if (responseJson.has("usage")) {
            JsonNode usage = responseJson.get("usage");
            logger.info("  - Token usage: {}", usage.toString());
        }
        
        JsonNode choices = responseJson.get("choices");
        
        if (choices != null && choices.isArray() && choices.size() > 0) {
            logger.info("  - Choices array size: {}", choices.size());
            JsonNode firstChoice = choices.get(0);
            logger.info("  - First choice: {}", firstChoice.toString());
            
            JsonNode message = firstChoice.get("message");
            if (message != null) {
                logger.info("  - Message object: {}", message.toString());
                JsonNode content = message.get("content");
                if (content != null) {
                    String aiResponse = content.asText().trim();
                    logger.info("🤖 AI Generated Response (Full):");
                    logger.info("╔════════════════════════════════════════╗");
                    logger.info("║ {}", aiResponse);
                    logger.info("╚════════════════════════════════════════╝");
                    logger.info("Response length: {} characters", aiResponse.length());
                    return aiResponse;
                }
            }
        }
        
        logger.warn("❌ Unexpected response format from DeepSeek API");
        logger.warn("Full response: {}", responseBody);
        return "暂时繁忙，无法生成策略";
    }
}