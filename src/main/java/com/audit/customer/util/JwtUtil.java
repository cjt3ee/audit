package com.audit.customer.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    
    @Value("${jwt.secret:audit-system-jwt-secret-key-for-sm4-encryption-2024}")
    private String secret;
    
    @Value("${jwt.expiration:7200000}") // 2小时，单位毫秒
    private Long expiration;
    
    private SecretKey sm4Key;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    private SecretKey getSM4Key() {
        if (sm4Key == null) {
            sm4Key = SM4Util.getKeyFromString(secret);
        }
        return sm4Key;
    }
    
    /**
     * 生成JWT Token（使用SM4加密payload）
     */
    public String generateToken(Long auditorId, String username, Integer stage) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("auditorId", auditorId);
        claims.put("username", username);
        claims.put("stage", stage);
        claims.put("iat", new Date().getTime());
        
        try {
            // 将关键信息用SM4加密
            String encryptedAuditorId = SM4Util.encrypt(auditorId.toString(), getSM4Key());
            String encryptedUsername = SM4Util.encrypt(username, getSM4Key());
            String encryptedStage = SM4Util.encrypt(stage.toString(), getSM4Key());
            
            Map<String, Object> encryptedClaims = new HashMap<>();
            encryptedClaims.put("eid", encryptedAuditorId); // encrypted auditor id
            encryptedClaims.put("eum", encryptedUsername);  // encrypted username
            encryptedClaims.put("est", encryptedStage);     // encrypted stage
            encryptedClaims.put("iat", new Date().getTime());
            
            return createToken(encryptedClaims, username);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate encrypted token", e);
        }
    }
    
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * 验证token并解密获取审核员信息
     */
    public AuditorInfo validateTokenAndGetAuditorInfo(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            
            // 解密关键信息
            String encryptedAuditorId = claims.get("eid", String.class);
            String encryptedUsername = claims.get("eum", String.class);
            String encryptedStage = claims.get("est", String.class);
            
            if (encryptedAuditorId == null || encryptedUsername == null || encryptedStage == null) {
                throw new RuntimeException("Invalid token format");
            }
            
            Long auditorId = Long.parseLong(SM4Util.decrypt(encryptedAuditorId, getSM4Key()));
            String username = SM4Util.decrypt(encryptedUsername, getSM4Key());
            Integer stage = Integer.parseInt(SM4Util.decrypt(encryptedStage, getSM4Key()));
            
            return new AuditorInfo(auditorId, username, stage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate token or decrypt data", e);
        }
    }
    
    /**
     * 从token获取username（不解密，用于subject验证）
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }
    
    /**
     * 从token获取过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }
    
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * 验证token是否过期
     */
    public Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
    
    /**
     * 验证token
     */
    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 审核员信息内部类
     */
    public static class AuditorInfo {
        private Long auditorId;
        private String username;
        private Integer stage;
        
        public AuditorInfo(Long auditorId, String username, Integer stage) {
            this.auditorId = auditorId;
            this.username = username;
            this.stage = stage;
        }
        
        public Long getAuditorId() {
            return auditorId;
        }
        
        public String getUsername() {
            return username;
        }
        
        public Integer getStage() {
            return stage;
        }
    }
}