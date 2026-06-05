"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecordPayload = validateRecordPayload;
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
    const type = (field.type || '').toUpperCase();
    switch (type) {
        case 'TEXT':
            if (typeof value !== 'string') {
                throw new Error(`Expected a text string, received: ${typeof value}`);
            }
            return value;
        case 'NUMBER': {
            const parsedNum = Number(value);
            if (isNaN(parsedNum)) {
                throw new Error(`Expected a valid number, received: '${value}'`);
            }
            return parsedNum;
        }
        case 'BOOLEAN': {
            if (typeof value === 'boolean')
                return value;
            if (value === 'true' || value === 1 || value === '1')
                return true;
            if (value === 'false' || value === 0 || value === '0')
                return false;
            throw new Error(`Expected a boolean, received: '${value}'`);
        }
        case 'DATE': {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`Expected a valid Date, received: '${value}'`);
            }
            return date.toISOString();
        }
        case 'ENUM': {
            const strVal = String(value);
            const optionsArray = field.options ? field.options.split(',') : [];
            if (!optionsArray.includes(strVal)) {
                const allowed = field.options ? field.options.split(',').join(', ') : 'none';
                throw new Error(`Value '${strVal}' is not valid. Allowed options: [${allowed}]`);
            }
            return strVal;
        }
        default:
            throw new Error(`Unsupported field type: ${field.type}`);
    }
}
function castValue(valueStr, type, options) {
    const t = (type || '').toUpperCase();
    switch (t) {
        case 'TEXT':
            return valueStr;
        case 'NUMBER':
            return Number(valueStr);
        case 'BOOLEAN':
            return valueStr === 'true' || valueStr === '1';
        case 'DATE':
            return new Date(valueStr).toISOString();
        case 'ENUM':
            return valueStr;
        default:
            return valueStr;
    }
}
