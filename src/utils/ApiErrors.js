class ApiError{
    constructor(
        statusCode,
        message="Something went Wrong",
        errors=[],
        stack = ""
    ){
        super(message)
        this.message = message,
        this.statusCode = statusCode,
        this.data = null,
        this.errors = errors;

        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
};

export {ApiError}