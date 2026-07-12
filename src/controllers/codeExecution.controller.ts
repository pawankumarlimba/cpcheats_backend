import type { Request, Response } from "express"
import { Judge0Service } from "../services/judge0.service"
import { HttpError, type RunCodeRequestBody } from "../types/codeExecution.types"

class CodeExecutionController {
    private readonly service: Judge0Service

    constructor(service: Judge0Service = new Judge0Service(process.env.JUDGE0_API_KEY ?? "")) {
        this.service = service
    }

    /**
     * Route handler. Defined as an arrow-function class property (not a
     * regular method) so `this` stays bound to the instance when Express
     * calls it directly, e.g.:
     *
     *   const controller = new CodeExecutionController()
     *   router.post("/code-editor/run", controller.run)
     *
     * If you'd rather use a normal method, bind it yourself at registration:
     *   router.post("/code-editor/run", controller.run.bind(controller))
     */
    public run = async (req: Request, res: Response): Promise<void> => {
        try {
            const body = this.parseBody(req)
            const result = await this.service.execute(body)
            res.status(200).json(result)
        } catch (err) {
            this.handleError(err, res)
        }
    }

    private parseBody(req: Request): RunCodeRequestBody {
        const json = req.body

        if (!json || typeof json !== "object") {
            throw new HttpError("Request body must be valid JSON", 400)
        }

        const { languageId, sourceCode, stdin } = json as Partial<RunCodeRequestBody>

        if (typeof languageId !== "number") {
            throw new HttpError("languageId is required and must be a number", 400)
        }
        if (typeof sourceCode !== "string" || !sourceCode.trim()) {
            throw new HttpError("sourceCode is required", 400)
        }
        if (stdin !== undefined && typeof stdin !== "string") {
            throw new HttpError("stdin must be a string", 400)
        }

        return { languageId, sourceCode, stdin }
    }

    private handleError(err: unknown, res: Response): void {
        if (err instanceof HttpError) {
            res.status(err.statusCode).json({ error: err.message })
            return
        }
        console.error("Unexpected error in CodeExecutionController:", err)
        res.status(500).json({ error: "Failed to execute code" })
    }
}

export const codeExecutionController = new CodeExecutionController();