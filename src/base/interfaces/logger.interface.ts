import { LogCategory, LogSeverity } from "../../utils/enums.util";

export interface Logger {
    info(loggerTag: string, message: string, category?: LogCategory): void;
    warn(loggerTag: string, message: any, category?: LogCategory): void;
    error(loggerTag: string, error: any, category?: LogCategory): void;
}

export interface LogMessage {
    readonly message: string;
    readonly severity: LogSeverity;
    readonly category: LogCategory;
    toLine(maxLength: number): string;
}
