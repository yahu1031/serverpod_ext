export interface ServerpodInterface{
  createFlutterProject(name: string, path: string): Promise<void>;
}