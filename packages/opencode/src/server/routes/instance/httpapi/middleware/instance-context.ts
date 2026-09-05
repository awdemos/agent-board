import { WorkspaceRef } from "@/effect/instance-ref"
import { InstanceStore } from "@/project/instance-store"
import * as Log from "@opencode-ai/core/util/log"
import { Cause, Effect, Layer } from "effect"
import { HttpRouter, HttpServerResponse } from "effect/unstable/http"
import { HttpApiMiddleware } from "effect/unstable/httpapi"
import { WorkspaceRouteContext } from "./workspace-routing"

const log = Log.create({ service: "server" })

export class InstanceContextMiddleware extends HttpApiMiddleware.Service<
  InstanceContextMiddleware,
  {
    requires: WorkspaceRouteContext
  }
>()("@opencode/ExperimentalHttpApiInstanceContext") {}

function decode(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

function provideInstanceContext<E>(
  effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E>,
  store: InstanceStore.Interface,
): Effect.Effect<HttpServerResponse.HttpServerResponse, E, WorkspaceRouteContext> {
  return Effect.gen(function* () {
    const route = yield* WorkspaceRouteContext
    return yield* store.provide(
      { directory: decode(route.directory) },
      effect.pipe(Effect.provideService(WorkspaceRef, route.workspaceID)),
    ).pipe(
      Effect.catchCause((cause) => {
        const defect = cause.reasons.find(Cause.isDieReason)
        if (!defect) return Effect.failCause(cause)

        log.error("instance context defect", { cause: Cause.pretty(cause) })
        return Effect.succeed(
          HttpServerResponse.jsonUnsafe(
            { name: "UnknownError", data: { message: "Unexpected server error. Check server logs for details." } },
            { status: 500 },
          ),
        )
      }),
    )
  })
}

export const instanceContextLayer = Layer.effect(
  InstanceContextMiddleware,
  Effect.gen(function* () {
    const store = yield* InstanceStore.Service
    return InstanceContextMiddleware.of((effect) => provideInstanceContext(effect, store))
  }),
)

export const instanceRouterMiddleware = HttpRouter.middleware()(
  Effect.gen(function* () {
    const store = yield* InstanceStore.Service
    return (effect) => provideInstanceContext(effect, store)
  }),
)
