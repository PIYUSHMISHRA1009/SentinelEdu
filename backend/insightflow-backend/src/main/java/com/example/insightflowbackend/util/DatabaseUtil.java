package com.example.insightflowbackend.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class to handle Oracle database result normalization.
 * Oracle returns column names in UPPERCASE, but our frontend expects lowercase.
 */
public class DatabaseUtil {

    /**
     * Converts Oracle UPPERCASE column names to lowercase for a single row.
     * 
     * @param row Map with UPPERCASE keys from Oracle query
     * @return Map with lowercase keys
     */
    public static Map<String, Object> normalizeKeys(Map<String, Object> row) {
        Map<String, Object> normalized = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            String key = entry.getKey().toLowerCase();
            normalized.put(key, entry.getValue());
        }
        
        return normalized;
    }

    /**
     * Converts Oracle UPPERCASE column names to lowercase for multiple rows.
     * 
     * @param rows List of maps with UPPERCASE keys from Oracle query
     * @return List of maps with lowercase keys
     */
    public static List<Map<String, Object>> normalizeKeys(List<Map<String, Object>> rows) {
        List<Map<String, Object>> normalized = new ArrayList<>();
        
        for (Map<String, Object> row : rows) {
            normalized.add(normalizeKeys(row));
        }
        
        return normalized;
    }

    /**
     * Safely gets a Number value from a map and converts to Integer.
     * Handles both Integer and BigDecimal from Oracle.
     * 
     * @param map Source map
     * @param key Key to retrieve
     * @return Integer value or null
     */
    public static Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    /**
     * Safely gets a Number value from a map and converts to Double.
     * 
     * @param map Source map
     * @param key Key to retrieve
     * @return Double value or null
     */
    public static Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }

    /**
     * Safely gets a String value from a map.
     * 
     * @param map Source map
     * @param key Key to retrieve
     * @return String value or null
     */
    public static String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }
}
