import { Logger } from "../base/interfaces/logger.interface";
import { LogCategory, LogSeverity } from "./enums.util";

export class ExtLogger implements Logger {


    constructor(private category: LogCategory) {
    }


    private logAppender(message: string, severity: LogSeverity) {
        return `${severity === LogSeverity.info ? '\x1b[34mINFO\x1b[0m' : severity === LogSeverity.warn ? '\x1b[33mWARNING\x1b[0m' : '\x1b[31mERROR\x1b[0m'} : [ Serverpod.${this.category} ] - ${message}`;
    }

    public info(message: string): void {
        console.log(this.logAppender(message, LogSeverity.info));
    }
    public warn(message: any): void {
        console.warn(this.logAppender(message, LogSeverity.warn));
    }
    public error(error: any): void {
        console.error(this.logAppender(error, LogSeverity.error));
    }
}