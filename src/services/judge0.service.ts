import { HttpError, type RunCodeRequestBody, type RunResult } from "../types/codeExecution.types"

export class Judge0Service {
    private static readonly BASE_URL =
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"
    private static readonly HOST = "judge0-ce.p.rapidapi.com"

    private readonly apiKey: string

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    /** True once we've confirmed the server actually has a key to send. */
    public hasCredentials(): boolean {
        return this.apiKey.length > 0
    }

    public async execute({
        languageId,
        sourceCode,
        stdin,
    }: RunCodeRequestBody): Promise<RunResult> {
        if (!this.hasCredentials()) {
            throw new HttpError("Server is missing JUDGE0_API_KEY", 500)
        }

        let response: Response
        try {
            response = await fetch(Judge0Service.BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Host": Judge0Service.HOST,
                    "X-RapidAPI-Key": this.apiKey,
                },
                body: JSON.stringify({
                    language_id: languageId,
                    source_code: sourceCode,
                    stdin: stdin ?? "",
                }),
            })
        } catch (err) {
            console.error("Judge0 network error:", err)
            throw new HttpError("Could not reach the code execution service", 502)
        }

        if (!response.ok) {
            console.error("Judge0 responded with", response.status)
            throw new HttpError("Code execution service returned an error", 502)
        }

        const data = await response.json()
        return Judge0Service.toRunResult(data)
    }

    private static toRunResult(data: Record<string, unknown>): RunResult {
        return {
            stdout: (data.stdout as string) ?? null,
            stderr: (data.stderr as string) ?? null,
            compile_output: (data.compile_output as string) ?? null,
            status: (data.status as RunResult["status"]) ?? null,
            time: (data.time as string) ?? null,
            memory: (data.memory as number) ?? null,
        }
    }
}