import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { CompanyModule } from './modules/company/company.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { EventsModule } from './modules/events/events.module';
import { OllamaModule } from './modules/ollama/ollama.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    CompanyModule,
    DepartmentsModule,
    EmployeesModule,
    EventsModule,
    OllamaModule,
  ],
})
export class AppModule {}

