import { LogCategory, LogSeverity } from "../../utils/enums.util";

export interface Logger {
    info(message: string, category?: LogCategory): void;
    warn(message: any, category?: LogCategory): void;
    error(error: any, category?: LogCategory): void;
}

export interface LogMessage {
    readonly message: string;
    readonly severity: LogSeverity;
    readonly category: LogCategory;
    toLine(maxLength: number): string;
}
