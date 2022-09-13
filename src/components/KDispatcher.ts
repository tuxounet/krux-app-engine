import { KRouter } from "./KRouter";

export class KDispatcher {
  constructor(readonly router: KRouter) {}

  emit(eventName: string, source: string, params?: Record<string, string>) {
    this.notify(eventName, source, params);
  }

  private notify(eventName: string, source: string, params?: Record<string, string>) {
    try {
      console.info(eventName, source, params);
      console.dir(this.router.connections)
      Object.keys(this.router.connections).forEach((connectionId) => {
        console.info("notify", connectionId, eventName, source)
        
        const socket = this.router.connections[connectionId];
        if (socket)
        {
          socket.send(
            JSON.stringify({
              kind: "event",
              eventName,
              source,
              params,
            })
          );}
      });
    } catch (e) {
      console.error("dispatcher", "notify", "failure", e);
    }
  }
}
