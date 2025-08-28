package com.audit.customer.util;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.Security;
import java.util.Base64;

@Component
public class SM4Util {
    
    private static final String ALGORITHM = "SM4";
    private static final String TRANSFORMATION = "SM4/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;
    
    static {
        Security.addProvider(new BouncyCastleProvider());
    }
    
    /**
     * 生成SM4密钥
     */
    public static SecretKey generateKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM, new BouncyCastleProvider());
        keyGenerator.init(128);
        return keyGenerator.generateKey();
    }
    
    /**
     * 从字符串生成密钥
     */
    public static SecretKey getKeyFromString(String keyString) {
        byte[] keyBytes = keyString.getBytes(StandardCharsets.UTF_8);
        // SM4需要16字节密钥，如果不足则填充，如果超过则截取
        byte[] key = new byte[16];
        System.arraycopy(keyBytes, 0, key, 0, Math.min(keyBytes.length, 16));
        return new SecretKeySpec(key, ALGORITHM);
    }
    
    /**
     * 生成随机IV
     */
    private static byte[] generateIV() {
        byte[] iv = new byte[IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        return iv;
    }
    
    /**
     * SM4加密
     * @param plaintext 明文
     * @param key 密钥
     * @return Base64编码的加密结果（包含IV）
     */
    public static String encrypt(String plaintext, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION, new BouncyCastleProvider());
        byte[] iv = generateIV();
        IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, ivParameterSpec);
        
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        
        // 将IV和密文合并
        byte[] result = new byte[IV_LENGTH + ciphertext.length];
        System.arraycopy(iv, 0, result, 0, IV_LENGTH);
        System.arraycopy(ciphertext, 0, result, IV_LENGTH, ciphertext.length);
        
        return Base64.getEncoder().encodeToString(result);
    }
    
    /**
     * SM4解密
     * @param encryptedData Base64编码的加密数据（包含IV）
     * @param key 密钥
     * @return 解密后的明文
     */
    public static String decrypt(String encryptedData, SecretKey key) throws Exception {
        byte[] data = Base64.getDecoder().decode(encryptedData);
        
        // 提取IV和密文
        byte[] iv = new byte[IV_LENGTH];
        byte[] ciphertext = new byte[data.length - IV_LENGTH];
        System.arraycopy(data, 0, iv, 0, IV_LENGTH);
        System.arraycopy(data, IV_LENGTH, ciphertext, 0, ciphertext.length);
        
        Cipher cipher = Cipher.getInstance(TRANSFORMATION, new BouncyCastleProvider());
        IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.DECRYPT_MODE, key, ivParameterSpec);
        
        byte[] plaintext = cipher.doFinal(ciphertext);
        return new String(plaintext, StandardCharsets.UTF_8);
    }
}