export class KDispatcher {
  emit(eventName: string, source: string, params?: Record<string, string>) {
    console.info(eventName, source, params);
  }
}
