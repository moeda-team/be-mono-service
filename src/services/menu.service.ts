import { BaseService } from './base.service';

export class MenuService extends BaseService {
  BuildOptionTree = (options: any[], parentId: string | null = null): any[] => {
    return options
      .filter(opt => opt.optionId === parentId)
      .sort((a, b) => a.order - b.order)
      .map(opt => {
        const children = this.BuildOptionTree(options, opt.id);

        return {
          id: opt.id,
          label: opt.name,
          type: 'single', // change if you store type in DB
          required: true, // change if you store required flag
          choices: (opt.values || []).map((value: string, index: number) => {
            const childOption = children[index];

            return {
              label: value,
              value: value,
              extraPrice:
                opt.extraPrices?.[index] !== undefined ? Number(opt.extraPrices[index]) : undefined,
              subOptions: childOption ? [childOption] : [],
            };
          }),
        };
      });
  };
}
