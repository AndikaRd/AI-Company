import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { EmployeesModule } from '../employees/employees.module';
import { OfficeFacilitiesService } from './office-facilities.service';
import { EmployeeNeedsService } from './employee-needs.service';
import { BehaviorDecisionService } from './behavior-decision.service';
import { LifeSimulationService } from './life-simulation.service';
import { LifeSimulationController } from './life-simulation.controller';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
    forwardRef(() => EmployeesModule),
  ],
  controllers: [LifeSimulationController],
  providers: [
    OfficeFacilitiesService,
    EmployeeNeedsService,
    BehaviorDecisionService,
    LifeSimulationService,
  ],
  exports: [
    OfficeFacilitiesService,
    EmployeeNeedsService,
    BehaviorDecisionService,
    LifeSimulationService,
  ],
})
export class LifeSimulationModule {}

