import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MaxLength(10000)
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsBoolean()
  @IsOptional()
  think?: boolean = false;
}
