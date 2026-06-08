import { IsIn, IsOptional, IsString } from 'class-validator';

export class AiCommandTraceFeedbackDto {
  @IsIn(['up', 'down'])
  rating: 'up' | 'down';

  @IsOptional()
  @IsString()
  @IsIn([
    'wrong_action',
    'wrong_date',
    'wrong_person',
    'wrong_service',
    'did_not_understand',
  ])
  reason?:
    | 'wrong_action'
    | 'wrong_date'
    | 'wrong_person'
    | 'wrong_service'
    | 'did_not_understand';
}
