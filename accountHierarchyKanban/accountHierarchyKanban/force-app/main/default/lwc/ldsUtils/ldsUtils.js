export function reduceErrors(errors) {
    if (!Array.isArray(errors)) {
        errors = [errors];
    }
    
    return errors
        .filter(error => !!error)
        .map(error => {
            // UI API read errors
            if (Array.isArray(error.body)) {
                return error.body.map(e => e.message);
            }
            // Apex errors
            else if (error.body && typeof error.body.message === 'string') {
                return error.body.message;
            }
            // JS errors
            else if (typeof error.message === 'string') {
                return error.message;
            }
            // Unknown
            return 'Unknown error';
        })
        .flat();
}