export enum LogCategory {
    serverpod = 'SERVERPOD',
    flutter = 'FLUTTER',
    dart = 'DART',
    utils = 'UTILS',
    terraform = 'TERRAFORM',
    extension = 'EXTENSION',
}


export enum LogSeverity {
    info,
    warn,
    error,
}
export enum ChangeType {
    create = 'create',
    read = 'read',
    update = 'update',
    destroy = 'destroy',
    recreate = 'recreate',
    unknown = 'unknown'
}