import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({
    toClassOnly: false, // 요청을 받을때
    toPlainOnly: true, // 응답을 할때
  })
  password: string;

  @Column({ enum: Role, default: Role.user })
  role: Role;
}
