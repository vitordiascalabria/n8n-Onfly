import type { INodeType } from 'n8n-workflow';
import { Random } from './nodes/Random/Random.node';

export const nodes: INodeType[] = [new Random() as unknown as INodeType];
