import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsCreditCard,
  IsDate,
  IsDateString,
  IsDefined,
  IsDivisibleBy,
  IsEmpty,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsLatLong,
  IsNegative,
  IsNotEmpty,
  IsNotIn,
  isNotIn,
  IsNumber,
  IsOptional,
  IsPositive,
  isPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotContains,
  NotEquals,
  registerDecorator,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

enum MovieGenre {
  ACTION = '액션',
  FANTASY = '판타지',
  DRAMA = '드라마',
  COMEDY = '코미디',
}

@ValidatorConstraint({
  async: true,
})
class PasswordValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    return value.length >= 4 && value.length < 8;
  }
  defaultMessage?(validationArguments?: ValidationArguments): string {
    return `비밀번호는 4자 이상 8자 이하이어야 합니다. 현재 길이: ${validationArguments?.value.length}  값: ($value)`;
  }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: PasswordValidator,
    });
  };
}

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // # 기본 validator

  // @IsDefined() // null || undefined
  // @IsOptional()
  // @Equals('solyi')
  // @NotEquals('solyi')
  // @IsEmpty() // null || undefined || ''
  // @IsNotEmpty()

  // Array
  // @IsIn(['액션', '판타지'])
  // @IsNotIn(['액션', '판타지'])

  // # 타입 validator
  // @IsBoolean()
  // @IsString()
  // @IsNumber() // 숫자 체크
  // @IsInt() // 정수 체크
  // @IsArray()
  // @IsEnum(MovieGenre)
  // @IsDateString()

  // # 숫자 validator
  // @IsDivisibleBy(5) // 5로 나누어 떨어지는지 체크
  // @IsPositive() // 양수인지 체크
  // @IsNegative() // 음수인지 체크
  // @Min(100)
  // @Max(1000)

  // # 문자 Validator
  // @Contains('solyi') // 문자열에 'solyi'가 포함되어 있는지 체크
  // @NotContains('solyi') // 문자열에 'solyi'가 포함되어 있지 않은지 체크
  // @IsAlphanumeric() // 영문, 숫자만 포함되어 있는지 체크
  // @IsCreditCard()
  // @IsHexColor() // 16진수 색상 코드인지 체크
  // @MaxLength(10) // 최대 길이 10
  // @MinLength(2) // 최소 길이 2
  // @IsUUID() // UUID 형식인지 체크
  // @IsLatLong() // 위도, 경도 형식인지 체크
  // @Validate(PasswordValidator)
  // @Validate(PasswordValidator, {
  //   message: '다른 메세지',
  // })
  @IsPasswordValid()
  test: string;
}
