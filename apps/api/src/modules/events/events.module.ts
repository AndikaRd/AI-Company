import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [forwardRef(() => EmployeesModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}

