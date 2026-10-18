import type { ExpertBlock } from "./expert";
import { BLOCKS_1 } from "./expert-blocks-1";
import { BLOCKS_2 } from "./expert-blocks-2";

/** Hand-written expert blocks keyed by subcategory id. */
export const EXPERT_BLOCKS: Record<string, ExpertBlock> = { ...BLOCKS_1, ...BLOCKS_2 };
