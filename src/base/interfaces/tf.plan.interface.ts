import { ChangeType } from "../../utils/enums.util";

export interface ReleaseInterface {
    version: string;
    notes: string[];
}

export interface ResourceId {
    name: string;
    type: string | null;
    prefixes: string[];
}
export interface Warning {
    id: ResourceId;
    detail: string;
}

export interface Diff {
    property: string;
    old?: string;
    new: string;
    forcesNewResource?: string;
}
export interface PlanAction {
    id: ResourceId;
    type: ChangeType;
    changes: Diff[];
}
export interface Plan {
    warnings: Warning[];
    actions: PlanAction[];
}

export interface PlanInterface {
    type: string;
    name: string;
    changes: string | null;
}