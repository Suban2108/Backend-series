class ApiError{
    constructor(
        statusCode,
        message="Something went Wrong",
        errors=[],
        statck = ""
    ){
        super(message)
        this.message = message,
        this.statusCode = statusCode,
        this.data = null,
        this.errors = errors;

        if(statck){
            this.stack = statck;
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
};

export {ApiError}