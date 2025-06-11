import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.userRepository.find();

    if (!users) return [];
    return users;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException('USER ID를 찾을 수 없습니다.');

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.save({
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    return newUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('USER ID를 찾을 수 없습니다.');

    await this.userRepository.update({ id }, { ...updateUserDto });

    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return updatedUser;
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('USER ID를 찾을 수 없습니다.');

    await this.userRepository.delete(id);

    return user.id;
  }
}
