import { type SettingsScopeLike, type SlotsLike } from './settings';
export declare const name = "dsh-auto-collapse";
/** 需要的宿主服务：slots 用于插件配置卡片，settingsScope 用于读写设置；两者缺一不影响核心折叠。 */
export declare const inject: string[];
/** 客户端根上下文的最小结构化类型（仅用 cordis 标准 effect，无运行时依赖）。 */
export interface FoldClientCtx {
    effect(fn: () => unknown, label?: string): unknown;
    slots?: SlotsLike;
    settingsScope?: {
        bind(spec: {
            namespace: string;
        }): SettingsScopeLike;
    };
}
export declare function apply(ctx: FoldClientCtx): void;
