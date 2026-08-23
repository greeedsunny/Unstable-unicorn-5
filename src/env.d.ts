/// <reference types="@cloudflare/workers-types" />

interface Env {
  ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
}
