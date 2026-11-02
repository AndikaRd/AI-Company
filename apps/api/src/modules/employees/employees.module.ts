import { Module, forwardRef } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeActivityService } from './employee-activity.service';
import { OllamaModule } from '../ollama/ollama.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [OllamaModule, forwardRef(() => EventsModule)],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeActivityService],
  exports: [EmployeesService, EmployeeActivityService],
})
export class EmployeesModule {}
