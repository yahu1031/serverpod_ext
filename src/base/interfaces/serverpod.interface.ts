/**
 * ServerPod interface
 */
export interface ServerpodInterface {

  /**
   * Creates a serverpod project(Flutter project)
   * */
  createServerpodFlutterProject(): Promise<void>;

  /**
   * Generates the API code for the serverpod project
   * */
  generateServerpodCode(): Promise<void>;

  /**
   * Creates a serverpod project(Dart project)
   * */
  createServerpodDartProject(): Promise<void>;

  /**
   * Starts the serverpod server
   * */
  startServerpodServer(): Promise<void>;
}