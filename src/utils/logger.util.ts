import { Logger } from "../base/interfaces/logger.interface";
import { LogCategory, LogSeverity } from "./enums.util";

export class ExtLogger implements Logger {


    constructor(private category: LogCategory) {
    }


    private logAppender(loggerTag: string, message: string, severity: LogSeverity) {
        return `${severity === LogSeverity.info ? '\x1b[34mINFO\x1b[0m' : severity === LogSeverity.warn ? '\x1b[33mWARNING\x1b[0m' : '\x1b[31mERROR\x1b[0m'} : [ Serverpod.${this.category}.${loggerTag} ] ${message}`;
    }

    public info(loggerTag: string, message: string): void {
        console.log(this.logAppender(loggerTag, message, LogSeverity.info));
    }
    public warn(loggerTag: string, message: any): void {
        console.warn(this.logAppender(loggerTag, message, LogSeverity.warn));
    }
    public error(loggerTag: string, error: any): void {
        console.error(this.logAppender(loggerTag, error, LogSeverity.error));
    }
}