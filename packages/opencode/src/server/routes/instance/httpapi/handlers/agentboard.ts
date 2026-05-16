import { AgentBoardRoutes } from "@/agentboard/routes"
import { InstanceRef } from "@/effect/instance-ref"
import { Cause, Effect, Stream } from "effect"
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { Hono } from "hono"

function agentBoardApp(worktree: string) {
  const routes = AgentBoardRoutes({ worktree })
  return new Hono().route("/", routes).route("/agentboard", routes)
}

function honoRequest(request: HttpServerRequest.HttpServerRequest) {
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: request.headers,
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = Stream.toReadableStream(request.stream)
    init.duplex = "half"
  }
  return new Request(new URL(request.url, "http://localhost"), init)
}

function honoResponse(response: Response) {
  if (!response.body) {
    return HttpServerResponse.empty({
      status: response.status,
      headers: response.headers,
    })
  }
  return HttpServerResponse.stream(
    Stream.fromReadableStream({
      evaluate: () => response.body!,
      onError: (error) => error,
    }),
    {
      status: response.status,
      headers: response.headers,
    },
  )
}

export const agentBoardRoute = HttpRouter.use((router) =>
  Effect.gen(function* () {
    console.log("[agentboard] Registering routes")
    yield* router.add(
      "*",
      "/agentboard/*",
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        console.log("[agentboard] Request:", request.method, request.url)
        const instance = yield* InstanceRef
        console.log("[agentboard] Instance:", instance?.worktree, instance?.directory)
        if (!instance) return HttpServerResponse.text("No AgentBoard instance context", { status: 500 })
        const app = agentBoardApp(instance.worktree)
        console.log("[agentboard] Calling Hono...")
        const response = yield* Effect.tryPromise(() => Promise.resolve(app.fetch(honoRequest(request))))
        console.log("[agentboard] Hono response:", response.status, response.statusText)
        return honoResponse(response)
      }).pipe(
        Effect.catchCause((cause) => {
          console.error("[agentboard] Error:", Cause.pretty(cause))
          return Effect.succeed(
            HttpServerResponse.text(
              Cause.pretty(cause),
              { status: 500 },
            ),
          )
        }),
      ),
    )
  }),
)
