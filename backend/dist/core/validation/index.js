"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecordPayload = validateRecordPayload;
const client_1 = require("@prisma/client");
/**
 * Validates a record body payload against the dynamic fields of an entity schema.
 * Strips unknown fields, enforces types, formats values, and applies defaults.
 */
function validateRecordPayload(payload, fields, isUpdate = false) {
    const errors = [];
    const sanitizedData = {};
    if (!payload || typeof payload !== 'object') {
        return {
            valid: false,
            errors: [{ field: '_payload', message: 'Payload must be a valid JSON object' }],
            data: {},
        };
    }
    // Validate each defined field in the entity schema
    for (const field of fields) {
        const value = payload[field.apiSlug];
        const exists = field.apiSlug in payload;
        // 1. Handle missing/null value
        if (!exists || value === undefined || value === null) {
            if (!isUpdate) {
                if (field.required) {
                    // If a defaultValue is available, we use that
                    if (field.defaultValue !== null && field.defaultValue !== undefined && field.defaultValue !== '') {
                        sanitizedData[field.apiSlug] = castValue(field.defaultValue, field.type, field.options);
                    }
                    else {
                        errors.push({ field: field.apiSlug, message: `Field '${field.name}' is required` });
                    }
                }
                else if (field.defaultValue !== null && field.defaultValue !== undefined && field.defaultValue !== '') {
                    sanitizedData[field.apiSlug] = castValue(field.defaultValue, field.type, field.options);
                }
                else {
                    sanitizedData[field.apiSlug] = null;
                }
            }
            continue;
        }
        // 2. Handle required field validation on UPDATE (value is provided but empty/null)
        if (isUpdate && field.required && (value === null || value === '')) {
            errors.push({ field: field.apiSlug, message: `Field '${field.name}' cannot be empty` });
            continue;
        }
        // 3. Type-specific validations and sanitization
        try {
            const validatedValue = validateAndCastField(value, field);
            sanitizedData[field.apiSlug] = validatedValue;
        }
        catch (err) {
            errors.push({ field: field.apiSlug, message: err.message || `Invalid value for ${field.name}` });
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        data: sanitizedData,
    };
}
function validateAndCastField(value, field) {
    if (value === null)
        return null;
    switch (field.type) {
        case client_1.FieldType.TEXT:
            if (typeof value !== 'string') {
                throw new Error(`Expected a text string, received: ${typeof value}`);
            }
            return value;
        case client_1.FieldType.NUMBER: {
            const parsedNum = Number(value);
            if (isNaN(parsedNum)) {
                throw new Error(`Expected a valid number, received: '${value}'`);
            }
            return parsedNum;
        }
        case client_1.FieldType.BOOLEAN: {
            if (typeof value === 'boolean')
                return value;
            if (value === 'true' || value === 1 || value === '1')
                return true;
            if (value === 'false' || value === 0 || value === '0')
                return false;
            throw new Error(`Expected a boolean, received: '${value}'`);
        }
        case client_1.FieldType.DATE: {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`Expected a valid Date, received: '${value}'`);
            }
            return date.toISOString();
        }
        case client_1.FieldType.ENUM: {
            const strVal = String(value);
            if (!field.options || !field.options.includes(strVal)) {
                const allowed = field.options ? field.options.join(', ') : 'none';
                throw new Error(`Value '${strVal}' is not valid. Allowed options: [${allowed}]`);
            }
            return strVal;
        }
        default:
            throw new Error(`Unsupported field type: ${field.type}`);
    }
}
function castValue(valueStr, type, options) {
    switch (type) {
        case client_1.FieldType.TEXT:
            return valueStr;
        case client_1.FieldType.NUMBER:
            return Number(valueStr);
        case client_1.FieldType.BOOLEAN:
            return valueStr === 'true' || valueStr === '1';
        case client_1.FieldType.DATE:
            return new Date(valueStr).toISOString();
        case client_1.FieldType.ENUM:
            return valueStr;
        default:
            return valueStr;
    }
}
