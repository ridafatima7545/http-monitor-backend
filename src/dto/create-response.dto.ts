import { IsNumber, IsObject, IsDate, IsOptional } from 'class-validator';

export class CreateResponseDto {
  @IsDate()
  timestamp: Date;

  @IsObject()
  requestPayload: any;

  @IsObject()
  responseData: any;

  @IsNumber()
  statusCode: number;

  @IsNumber()
  responseTime: number;

  @IsObject()
  @IsOptional()
  headers?: any;
}
