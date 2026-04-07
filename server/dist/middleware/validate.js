"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const v4_1 = require("zod/v4");
const errors_1 = require("../utils/errors");
/**
 * Express middleware factory that validates request data against a Zod schema.
 * On success, replaces the request property with the parsed (and coerced) data.
 * On failure, passes a ValidationError to the next error handler.
 */
const validate = (schema, location = 'body') => {
    return (req, _res, next) => {
        try {
            const data = req[location];
            const parsed = schema.parse(data);
            // Replace with parsed & coerced data
            req[location] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof v4_1.z.ZodError) {
                const details = {};
                for (const issue of error.issues) {
                    const path = issue.path.join('.') || '_root';
                    if (!details[path]) {
                        details[path] = [];
                    }
                    details[path].push(issue.message);
                }
                next(new errors_1.ValidationError('Validation failed', details));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
