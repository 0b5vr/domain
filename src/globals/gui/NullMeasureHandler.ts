export class NullMeasureHandler {
  public measure( path: string, fn: () => void ): number {
    fn();
    return 0.0;
  }
}
