export interface RunCodeRequestBody {
    languageId: number
    sourceCode: string
    stdin?: string
}

export interface Judge0Status {
    id: number
    description: string
}

export interface RunResult {
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    status: Judge0Status | null
    time: string | null
    memory: number | null
}

export class HttpError extends Error {
    readonly statusCode: number

    constructor(message: string, statusCode = 500) {
        super(message)
        this.name = "HttpError"
        this.statusCode = statusCode
    }
}