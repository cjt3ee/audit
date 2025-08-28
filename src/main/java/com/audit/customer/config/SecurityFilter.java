package com.audit.customer.config;

import com.audit.customer.util.SecurityUtil;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class SecurityFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        SecurityRequestWrapper wrappedRequest = new SecurityRequestWrapper(httpRequest);
        
        chain.doFilter(wrappedRequest, response);
    }
    
    private static class SecurityRequestWrapper extends HttpServletRequestWrapper {
        
        public SecurityRequestWrapper(HttpServletRequest request) {
            super(request);
        }
        
        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return sanitizeParameter(value);
        }
        
        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }
            
            String[] sanitizedValues = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                sanitizedValues[i] = sanitizeParameter(values[i]);
            }
            return sanitizedValues;
        }
        
        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = super.getParameterMap();
            for (Map.Entry<String, String[]> entry : map.entrySet()) {
                String[] values = entry.getValue();
                for (int i = 0; i < values.length; i++) {
                    values[i] = sanitizeParameter(values[i]);
                }
            }
            return map;
        }
        
        private String sanitizeParameter(String value) {
            if (value == null) {
                return null;
            }
            
            // SQL注入检测
            if (SecurityUtil.containsSqlInjection(value)) {
                throw new IllegalArgumentException("输入包含非法字符");
            }
            
            // XSS防护
            return SecurityUtil.sanitizeInput(value);
        }
    }
}